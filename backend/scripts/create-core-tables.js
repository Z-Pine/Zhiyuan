const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ujCPkGDrm18w@ep-flat-bar-a1atsc8i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

  `CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    province VARCHAR(20) NOT NULL,
    city VARCHAR(50),
    type VARCHAR(20) DEFAULT '综合',
    level VARCHAR(20)[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    ranking INT,
    homepage VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS majors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    degree_type VARCHAR(20) DEFAULT '理学学士',
    duration INT DEFAULT 4,
    tags TEXT[] DEFAULT '{}',
    subject_requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS admission_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
    major_id UUID REFERENCES majors(id) ON DELETE CASCADE,
    province VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    subject_type VARCHAR(20) NOT NULL,
    min_score INT,
    min_rank INT,
    plan_count INT,
    batch VARCHAR(20) DEFAULT '本科批',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, major_id, province, year, subject_type)
  )`,

  `CREATE TABLE IF NOT EXISTS provinces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    region VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS score_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    subject_type VARCHAR(20) NOT NULL,
    special_line INT,
    first_line INT,
    second_line INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(province, year, subject_type)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province)`,
  `CREATE INDEX IF NOT EXISTS idx_universities_level ON universities USING GIN(level)`,
  `CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type)`,
  `CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category)`,
  `CREATE INDEX IF NOT EXISTS idx_majors_subcategory ON majors(subcategory)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_university ON admission_scores(university_id)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_major ON admission_scores(major_id)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_province ON admission_scores(province)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_year ON admission_scores(year)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_subject_type ON admission_scores(subject_type)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_min_score ON admission_scores(min_score)`,
  `CREATE INDEX IF NOT EXISTS idx_admission_min_rank ON admission_scores(min_rank)`,
  `CREATE INDEX IF NOT EXISTS idx_score_lines_province_year ON score_lines(province, year)`,
];

async function createCoreTables() {
  const client = await pool.connect();
  let ok = 0, skip = 0, fail = 0;

  try {
    console.log('创建核心业务表...\n');
    await client.query('BEGIN');

    for (const stmt of STATEMENTS) {
      if (!stmt || stmt.trim().length < 3) { skip++; continue; }
      try {
        await client.query(stmt);
        ok++;
        console.log(`  ✅ ${stmt.slice(0, 60)}`);
      } catch (e) {
        if (e.code === '42P07' || e.message.includes('already exists')) {
          skip++;
        } else {
          fail++;
          console.log(`  ❌ ${stmt.slice(0, 60)}: ${e.message.split('\n')[0]}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log(`\n结果: ${ok} 成功, ${skip} 跳过, ${fail} 失败`);

    // 验证
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT LIKE '%_archived%'
      ORDER BY table_name
    `);
    console.log('\n当前表:', tables.rows.map(r => r.table_name).join(', '));

    const checks = [
      ['universities', 'level'],
      ['admission_scores', 'university_id'],
      ['majors', 'subcategory'],
    ];
    for (const [tbl, col] of checks) {
      const r = await client.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [tbl, col]);
      console.log(`  ${r.rows.length > 0 ? '✅' : '❌'} ${tbl}.${col}`);
    }

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ 事务失败:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createCoreTables().catch(e => console.error('Fatal:', e.message));