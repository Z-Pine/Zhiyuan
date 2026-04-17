/**
 * 历年分数线数据生成脚本
 * 基于真实数据规律模拟生成
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../src/config/database');

// 3+1+2模式省份列表
const NEW_GAOKAO_PROVINCES = [
  '河北', '辽宁', '江苏', '福建', '湖北', '湖南', '广东', '重庆'
];

// 各省份2024年一本线参考（物理类/历史类）
const PROVINCE_BASELINES_2024 = {
  '河北': { physics: 448, history: 449 },
  '辽宁': { physics: 368, history: 400 },
  '江苏': { physics: 462, history: 478 },
  '福建': { physics: 449, history: 431 },
  '湖北': { physics: 437, history: 432 },
  '湖南': { physics: 422, history: 438 },
  '广东': { physics: 442, history: 428 },
  '重庆': { physics: 427, history: 428 },
};

// 院校层次分数加成
const SCHOOL_LEVEL_BONUS = {
  '985': { min: 80, max: 150 },
  '211': { min: 50, max: 100 },
  '双一流': { min: 30, max: 70 },
  '普通': { min: 0, max: 40 },
};

// 热门专业加成
const HOT_MAJOR_BONUS = {
  '计算机科学与技术': 30,
  '软件工程': 28,
  '人工智能': 35,
  '电子信息工程': 25,
  '金融学': 20,
  '临床医学': 40,
  '口腔医学': 45,
  '法学': 15,
  '会计学': 18,
  '电气工程及其自动化': 22,
  '数据科学与大数据技术': 32,
  '通信工程': 20,
  '自动化': 18,
  '建筑学': 15,
};

// 生成随机数
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 生成某院校某专业在某省份的分数线
const generateScore = (school, major, province, year, subjectType) => {
  const baseline = PROVINCE_BASELINES_2024[province][subjectType];
  const levelBonus = SCHOOL_LEVEL_BONUS[school.level] || SCHOOL_LEVEL_BONUS['普通'];
  const majorBonus = HOT_MAJOR_BONUS[major.name] || 0;
  
  // 基础分数 = 一本线 + 院校层次加成 + 专业热度加成 + 随机波动
  const baseScore = baseline + 
    randomInt(levelBonus.min, levelBonus.max) + 
    majorBonus +
    randomInt(-10, 10);
  
  // 年份调整（2022-2024年数据）
  const yearAdjustment = (2024 - year) * randomInt(2, 5);
  
  const score = Math.max(baseScore - yearAdjustment, baseline);
  
  // 生成排名（模拟）
  // 分数越高，排名越靠前
  const rankBase = subjectType === 'physics' ? 150000 : 80000;
  const rank = Math.floor(rankBase * (750 - score) / 300) + randomInt(0, 1000);
  
  return {
    score,
    rank: Math.max(rank, 100),
    plan_count: randomInt(2, 20),
  };
};

// 生成分数线数据
const generateScores = async () => {
  const client = await pool.connect();
  
  try {
    console.log('开始生成分数线数据...');
    await client.query('BEGIN');
    
    // 获取所有院校和专业
    const schoolsResult = await client.query('SELECT id, name, province as school_province, level FROM schools');
    const majorsResult = await client.query('SELECT id, name FROM majors');
    
    const schools = schoolsResult.rows;
    const majors = majorsResult.rows;
    
    console.log(`获取到 ${schools.length} 所院校, ${majors.length} 个专业`);
    
    let generated = 0;
    const years = [2022, 2023, 2024];
    const subjectTypes = ['physics', 'history'];
    
    // 为每个院校-专业-省份-年份-科类组合生成分数线
    for (const school of schools) {
      // 每所院校随机选择10-30个专业
      const schoolMajors = majors
        .sort(() => 0.5 - Math.random())
        .slice(0, randomInt(10, 30));
      
      for (const major of schoolMajors) {
        // 每个专业在3-5个省份招生
        const targetProvinces = NEW_GAOKAO_PROVINCES
          .sort(() => 0.5 - Math.random())
          .slice(0, randomInt(3, 5));
        
        for (const province of targetProvinces) {
          for (const year of years) {
            for (const subjectType of subjectTypes) {
              const scoreData = generateScore(school, major, province, year, subjectType);
              
              await client.query(`
                INSERT INTO admission_scores 
                (school_id, major_id, province, year, subject_type, min_score, min_rank, plan_count, batch)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (school_id, major_id, province, year, subject_type) DO UPDATE SET
                  min_score = EXCLUDED.min_score,
                  min_rank = EXCLUDED.min_rank,
                  plan_count = EXCLUDED.plan_count
              `, [
                school.id,
                major.id,
                province,
                year,
                subjectType,
                scoreData.score,
                scoreData.rank,
                scoreData.plan_count,
                '本科批'
              ]);
              
              generated++;
              
              if (generated % 100 === 0) {
                console.log(`已生成 ${generated} 条分数线数据`);
              }
            }
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ 分数线数据生成完成！共生成 ${generated} 条数据`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('分数线数据生成失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { generateScores };

// 直接运行
if (require.main === module) {
  generateScores()
    .then(() => {
      console.log('分数线数据生成脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('分数线数据生成脚本执行失败:', error);
      process.exit(1);
    });
}
