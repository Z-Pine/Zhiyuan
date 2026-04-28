const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// 读取SQL文件并按分隔符拆分语句（跳过函数定义，只处理DDL）
function splitSqlStatements(sql) {
  // 按 ; 分割，但跳过函数内嵌的 ;
  const statements = [];
  let current = '';
  let inFunction = false;
  let bracketDepth = 0;

  for (const line of sql.split('\n')) {
    // 跳过注释和函数定义行
    if (line.trim().startsWith('--')) continue;
    if (line.includes('$$ language')) { inFunction = false; bracketDepth = 0; }
    if (line.includes('CREATE FUNCTION') || line.includes('CREATE OR REPLACE FUNCTION')) inFunction = true;
    if (inFunction) {
      if (line.includes('BEGIN')) bracketDepth++;
      if (line.includes('END;')) {
        bracketDepth--;
        if (bracketDepth <= 0) { inFunction = false; bracketDepth = 0; }
      }
      current += line + '\n';
      continue;
    }
    current += line + '\n';
    if (line.trim().endsWith(';')) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrate-prod.sql'), 'utf8');
  const client = await pool.connect();
  let ok = 0, fail = 0;
  const errors = [];

  try {
    // 获取现有表
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const existingTables = new Set(tables.rows.map(r => r.table_name));
    console.log('现有表:', [...existingTables].join(', ') || '(无)');

    // 按顺序处理每条语句
    const stmts = splitSqlStatements(sql);
    console.log(`共 ${stmts.length} 条SQL语句`);

    for (const stmt of stmts) {
      if (!stmt || stmt.length < 3) continue;

      // 跳过函数定义（单独处理）
      if (stmt.includes('CREATE FUNCTION') || stmt.includes('CREATE OR REPLACE FUNCTION')) continue;
      if (stmt.includes('UPDATE users') || stmt.includes('INSERT INTO')) continue; // 跳过种子数据
      if (stmt.includes('CREATE TRIGGER') && !stmt.includes('IF NOT EXISTS')) {
        // triggers 需要特殊处理
        try {
          await client.query(stmt);
          ok++;
        } catch (e) {
          if (e.code === '42710' || e.code === '42P07' || e.message.includes('already exists')) {
            fail--; // 不算失败
          } else {
            fail++;
            errors.push({ stmt: stmt.slice(0, 80), err: e.message });
          }
        }
        continue;
      }

      // 将 CREATE TABLE 改为 CREATE TABLE IF NOT EXISTS 防止已存在报错
      let execStmt = stmt;
      if (execStmt.startsWith('CREATE TABLE ') && !execStmt.includes('IF NOT EXISTS')) {
        execStmt = execStmt.replace(/^CREATE TABLE ([^ ]+)/, 'CREATE TABLE IF NOT EXISTS $1');
      }
      if (execStmt.startsWith('CREATE INDEX ') && !execStmt.includes('IF NOT EXISTS')) {
        execStmt = execStmt.replace(/^CREATE INDEX ([^ ]+)/, 'CREATE INDEX IF NOT EXISTS $1');
      }

      try {
        await client.query(execStmt);
        ok++;
      } catch (e) {
        if (e.code === '42P07' || e.code === '42710' || e.message.includes('already exists')) {
          fail--; // 表/索引已存在，不算失败
        } else if (e.code === '42701' && e.message.includes('duplicate')) {
          fail--; // 字段已存在
        } else {
          fail++;
          errors.push({ stmt: stmt.slice(0, 100), err: e.message });
        }
      }
    }

    // 单独处理触发器 IF NOT EXISTS
    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `CREATE TRIGGER IF NOT EXISTS update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    ];
    for (const t of triggers) {
      try { await client.query(t); ok++; } catch (e) {
        if (!e.message.includes('already exists')) { fail++; errors.push({ stmt: t.slice(0,80), err: e.message }); }
        else fail--;
      }
    }

    console.log(`\n✅ 执行完成: ${ok} 成功, ${fail} 失败`);

    // 最终验证
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('最终表:', finalTables.rows.map(r => r.table_name).join(', '));

    if (errors.length > 0) {
      console.log('\n失败详情:');
      errors.slice(0, 10).forEach(e => console.log(`  - ${e.stmt}: ${e.err}`));
    }

  } catch (e) {
    console.error('迁移异常:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();