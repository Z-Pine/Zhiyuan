/**
 * T018: 行业数据表开发
 * 创建行业相关的数据库表
 */

const { pool } = require('../src/config/database');

async function createIndustryTables() {
  const client = await pool.connect();
  
  try {
    console.log('开始创建行业数据表...');
    
    await client.query('BEGIN');
    
    // 1. 行业分类表
    console.log('创建 industry_categories 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_categories (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        parent_id INTEGER REFERENCES industry_categories(id),
        level INTEGER DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 2. 行业数据表
    console.log('创建 industries 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES industry_categories(id),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20),
        description TEXT,
        growth_rate DECIMAL(5,2),
        avg_salary DECIMAL(10,2),
        salary_growth DECIMAL(5,2),
        employment_rate DECIMAL(5,2),
        demand_index INTEGER,
        prospects TEXT,
        trend_direction VARCHAR(20) CHECK (trend_direction IN ('up', 'down', 'stable')),
        risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
        data_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
        data_source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 3. 专业-行业关联表
    console.log('创建 major_industry_mapping 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS major_industry_mapping (
        id SERIAL PRIMARY KEY,
        major_id INTEGER NOT NULL REFERENCES majors(id) ON DELETE CASCADE,
        industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
        career_paths JSONB DEFAULT '[]',
        avg_starting_salary DECIMAL(10,2),
        salary_after_3y DECIMAL(10,2),
        salary_after_5y DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(major_id, industry_id)
      )
    `);
    
    // 4. 行业薪资数据表
    console.log('创建 industry_salary_stats 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_salary_stats (
        id SERIAL PRIMARY KEY,
        industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        percentile_10 DECIMAL(10,2),
        percentile_25 DECIMAL(10,2),
        percentile_50 DECIMAL(10,2),
        percentile_75 DECIMAL(10,2),
        percentile_90 DECIMAL(10,2),
        avg_bonus DECIMAL(10,2),
        avg_raise_rate DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(industry_id, year)
      )
    `);
    
    // 5. 行业就业数据表
    console.log('创建 industry_employment_stats 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_employment_stats (
        id SERIAL PRIMARY KEY,
        industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        total_jobs INTEGER,
        new_jobs INTEGER,
        job_openings INTEGER,
        unemployment_rate DECIMAL(5,2),
        avg_job_tenure DECIMAL(4,1),
        job_satisfaction DECIMAL(4,2),
        work_life_balance DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(industry_id, year)
      )
    `);
    
    // 6. 热门岗位表
    console.log('创建 industry_jobs 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS industry_jobs (
        id SERIAL PRIMARY KEY,
        industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        level VARCHAR(20) CHECK (level IN ('entry', 'mid', 'senior', 'expert')),
        avg_salary_min DECIMAL(10,2),
        avg_salary_max DECIMAL(10,2),
        demand_level VARCHAR(20) CHECK (demand_level IN ('low', 'medium', 'high', 'very_high')),
        required_skills JSONB DEFAULT '[]',
        education_requirement VARCHAR(50),
        experience_requirement VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query('COMMIT');
    
    console.log('行业数据表创建完成！');
    console.log('');
    console.log('创建的表：');
    console.log('  - industry_categories: 行业分类表');
    console.log('  - industries: 行业数据表');
    console.log('  - major_industry_mapping: 专业-行业关联表');
    console.log('  - industry_salary_stats: 行业薪资统计表');
    console.log('  - industry_employment_stats: 行业就业统计表');
    console.log('  - industry_jobs: 热门岗位表');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建表失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createIndustryTables()
  .then(() => {
    console.log('\n行业数据表初始化完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n初始化失败:', error);
    process.exit(1);
  });
