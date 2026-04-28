const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function resetAndMigrate() {
  // 1. 先用 DO $$ 块安全地重命名旧表（不伤事务）
  console.log('=== Step 1: 归档旧表 ===');
  const client = await pool.connect();
  try {
    const oldTables = [
      'schools', 'school_scores', 'school_majors',
      'universities', 'majors', 'admission_scores',
      'chat_sessions', 'university_majors',
      'students', 'scores', 'profiles', 'recommendations',
      'recommendation_details', 'verification_codes', 'chat_history',
      'industry_categories', 'major_industry_mapping', 'industries',
      'industry_salary_stats', 'industry_employment_stats', 'industry_jobs',
      'major_school_scores', 'student_profiles', 'exam_results', 'recommendation_feedback'
    ];

    // 收集需要重命名的表
    const existing = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE '%_archived%'
    `);
    const toArchive = existing.rows
      .map(r => r.tablename)
      .filter(t => oldTables.includes(t));

    console.log(`发现 ${toArchive.length} 个旧表待归档`);

    for (const t of toArchive) {
      try {
        await client.query(`ALTER TABLE "${t}" RENAME TO "${t}_archived_20260422"`);
        console.log(`  ✅ ${t} → ${t}_archived_20260422`);
      } catch (e) {
        console.log(`  ⚠️ ${t}: ${e.message.split('\n')[0]}`);
      }
    }

    // 清理 orphaned 归档表
    const archived = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE '%_archived_20260422'
    `);
    console.log(`\n归档表总数: ${archived.rows.length}`);

  } catch (e) {
    console.error('Step 1 错误:', e.message);
  } finally {
    client.release();
  }

  // 2. 执行完整建表SQL
  console.log('\n=== Step 2: 执行建表SQL ===');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrate-prod.sql'), 'utf8');

  // 分割SQL：按 \n\n 分块（迁移文件每段之间有空行）
  const blocks = sql.split(/\n\n+/).map(b => b.trim()).filter(b => b.length > 0);

  let ok = 0, fail = 0;
  const errors = [];

  for (const block of blocks) {
    if (!block || block.startsWith('--')) continue;

    // 跳过种子数据INSERT
    if (block.includes('INSERT INTO') || block.startsWith('-- ')) continue;

    // 跳过部分注释行开头的内容
    const cleanBlock = block.replace(/^--.*$/gm, '').trim();
    if (!cleanBlock || cleanBlock.length < 3) continue;

    // 替换 CREATE TABLE -> CREATE TABLE IF NOT EXISTS
    let stmt = cleanBlock
      .replace(/CREATE TABLE ([^ ])/g, 'CREATE TABLE IF NOT EXISTS $1')
      .replace(/CREATE INDEX ([^ ])/g, 'CREATE INDEX IF NOT EXISTS $1');

    try {
      await pool.query(stmt);
      ok++;
    } catch (e) {
      // 忽略 "already exists" 类错误
      if (e.code === '42P07' || e.code === '42710' ||
          e.message.includes('already exists') ||
          e.message.includes('duplicate')) {
        ok++; // 算成功
      } else {
        fail++;
        errors.push({ stmt: stmt.slice(0, 80), err: e.message.split('\n')[0] });
      }
    }
  }

  console.log(`建表: ${ok} 成功, ${fail} 失败`);

  if (errors.length > 0) {
    console.log('\n失败详情:');
    errors.slice(0, 10).forEach(e => console.log(`  ⚠️ ${e.stmt}: ${e.err}`));
  }

  // 3. 验证
  console.log('\n=== Step 3: 验证核心表 ===');
  const tables = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename NOT LIKE '%_archived%'
    ORDER BY tablename
  `);
  console.log('表列表:', tables.rows.map(r => r.tablename).join(', '));

  const checks = [
    ['universities', 'level', 'ARRAY'],
    ['admission_scores', 'university_id', 'UUID'],
    ['majors', 'subcategory', 'VARCHAR'],
  ];

  for (const [tbl, col, expect] of checks) {
    const r = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `, [tbl, col]);
    const status = r.rows.length > 0 && r.rows[0].data_type === expect ? '✅' : '❌';
    const actual = r.rows.length > 0 ? r.rows[0].data_type : '不存在';
    console.log(`  ${status} ${tbl}.${col}: ${actual} (期望 ${expect})`);
  }

  await pool.end();
  console.log('\n✅ 完成');
}

resetAndMigrate().catch(e => { console.error('Fatal:', e.message); process.exit(1); });