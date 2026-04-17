/**
 * T023: 行业数据整理
 * 导入行业基础数据
 */

const { pool } = require('../src/config/database');

// 行业数据
const industriesData = [
  {
    name: '互联网/电子商务',
    category: '信息技术',
    description: '互联网平台、电商、在线教育等',
    growth_rate: 15.5,
    avg_salary: 18500,
    salary_trend: 'up',
    employment_rate: 94.5
  },
  {
    name: '人工智能',
    category: '信息技术',
    description: '机器学习、深度学习、自然语言处理等',
    growth_rate: 35.2,
    avg_salary: 28000,
    salary_trend: 'up',
    employment_rate: 97.8
  },
  {
    name: '金融科技',
    category: '金融',
    description: '互联网金融、区块链金融、智能投顾等',
    growth_rate: 18.3,
    avg_salary: 22000,
    salary_trend: 'up',
    employment_rate: 92.3
  },
  {
    name: '生物医药',
    category: '医疗健康',
    description: '生物制药、医疗器械、基因检测等',
    growth_rate: 22.1,
    avg_salary: 16500,
    salary_trend: 'up',
    employment_rate: 95.2
  },
  {
    name: '新能源',
    category: '能源',
    description: '太阳能、风能、电动汽车、储能等',
    growth_rate: 28.5,
    avg_salary: 17500,
    salary_trend: 'up',
    employment_rate: 93.8
  },
  {
    name: '集成电路',
    category: '制造业',
    description: '芯片设计、制造、封装测试等',
    growth_rate: 25.8,
    avg_salary: 24000,
    salary_trend: 'up',
    employment_rate: 98.5
  },
  {
    name: '教育培训',
    category: '教育',
    description: 'K12教育、职业教育、在线教育等',
    growth_rate: 5.2,
    avg_salary: 9500,
    salary_trend: 'stable',
    employment_rate: 88.5
  },
  {
    name: '建筑设计',
    category: '建筑',
    description: '建筑设计、室内设计、景观设计等',
    growth_rate: 3.8,
    avg_salary: 12000,
    salary_trend: 'stable',
    employment_rate: 85.2
  },
  {
    name: '电子商务运营',
    category: '零售消费',
    description: '电商平台运营、直播带货、供应链管理等',
    growth_rate: 20.5,
    avg_salary: 14000,
    salary_trend: 'up',
    employment_rate: 91.2
  },
  {
    name: '游戏开发',
    category: '传媒娱乐',
    description: '游戏设计、开发、运营等',
    growth_rate: 12.3,
    avg_salary: 22000,
    salary_trend: 'up',
    employment_rate: 93.5
  },
  {
    name: '管理咨询',
    category: '咨询服务',
    description: '战略咨询、管理咨询、财务咨询等',
    growth_rate: 8.5,
    avg_salary: 25000,
    salary_trend: 'up',
    employment_rate: 94.0
  },
  {
    name: '传统金融',
    category: '金融',
    description: '银行、证券、保险等传统金融业务',
    growth_rate: 4.2,
    avg_salary: 16000,
    salary_trend: 'stable',
    employment_rate: 91.5
  }
];

async function importIndustryData() {
  const client = await pool.connect();
  
  try {
    console.log('开始导入行业数据...');
    
    await client.query('BEGIN');
    
    let importedCount = 0;
    
    for (const industry of industriesData) {
      const result = await client.query(
        `INSERT INTO industries (
          name, category, description, growth_rate, avg_salary,
          salary_trend, employment_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          industry.name,
          industry.category,
          industry.description,
          industry.growth_rate,
          industry.avg_salary,
          industry.salary_trend,
          industry.employment_rate
        ]
      );
      
      if (result.rows.length > 0) {
        importedCount++;
        console.log(`  已导入: ${industry.name}`);
      } else {
        console.log(`  已存在: ${industry.name}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n行业数据导入完成！新增 ${importedCount} 条记录`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('导入失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importIndustryData()
  .then(() => {
    console.log('\n行业数据导入成功！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n导入失败:', error);
    process.exit(1);
  });
