const { query } = require('../config/database');

const recommendSchools = async (student, score, profile) => {
  const { province, category } = student;
  const { total_score, rank, province_rank } = score;

  const schoolConditions = [];
  const values = [];
  let paramCount = 1;

  if (province) {
    schoolConditions.push(`(province = $${paramCount++} OR province = '全国')`);
    values.push(province);
  }

  schoolConditions.push(`type = $${paramCount++}`);
  values.push(category === '历史类' ? '综合' : category || '理工');

  const whereClause = schoolConditions.length > 0 ? `WHERE ${schoolConditions.join(' AND ')}` : '';

  const schoolsResult = await query(
    `SELECT * FROM universities ${whereClause} ORDER BY id ASC LIMIT 100`,
    values
  );

  const schools = schoolsResult.rows.map(s => ({
    ...s,
    tags: s.tags || [],
    features: s.features || []
  }));

  const rushSchools = [];
  const safeSchools = [];
  const targetSchools = [];

  const studentRank = province_rank || rank;
  
  for (const school of schools) {
    const scoreResult = await query(
      `SELECT * FROM admission_scores 
       WHERE university_id = $1 AND subject_type = $2 AND year = 2024
       ORDER BY year DESC LIMIT 1`,
      [school.id, category === '历史类' ? 'history' : 'physics']
    );

    if (scoreResult.rows.length === 0) continue;

    const schoolScore = scoreResult.rows[0];
    const minRank = schoolScore.min_rank || 0;
    const avgRank = schoolScore.avg_rank || 0;

    const rankDiff = minRank - studentRank;
    const probability = calculateProbability(studentRank, minRank, avgRank);

    const schoolData = {
      id: school.id,
      name: school.name,
      province: school.province,
      city: school.city,
      level: school.level,
      tags: school.tags,
      minScore: schoolScore.min_score,
      avgScore: schoolScore.avg_score,
      minRank: schoolScore.min_rank,
      probability
    };

    if (probability >= 80) {
      safeSchools.push(schoolData);
    } else if (probability >= 40) {
      targetSchools.push(schoolData);
    } else if (probability >= 15) {
      rushSchools.push(schoolData);
    }
  }

  return {
    rush: rushSchools.slice(0, 5),
    target: targetSchools.slice(0, 8),
    safe: safeSchools.slice(0, 5)
  };
};

const calculateProbability = (studentRank, minRank, avgRank) => {
  if (studentRank <= 0) return 0;
  
  const rankDiff = minRank - studentRank;
  
  if (rankDiff < -5000) return 5;
  if (rankDiff < -3000) return 10;
  if (rankDiff < -1000) return 15;
  if (rankDiff < 0) return 20;
  if (rankDiff < 1000) return 30;
  if (rankDiff < 2000) return 40;
  if (rankDiff < 3000) return 50;
  if (rankDiff < 5000) return 60;
  if (rankDiff < 8000) return 70;
  if (rankDiff < 10000) return 80;
  if (rankDiff < 15000) return 85;
  if (rankDiff < 20000) return 90;
  return 95;
};

const recommendMajors = async (student, score, profile) => {
  const { category } = student;
  const { total_score } = score;

  let interestCategories = [];
  if (profile && profile.career_interest) {
    interestCategories = profile.career_interest.split(',');
  }

  let categoryFilter = '';
  const values = [];
  let paramCount = 1;

  if (interestCategories.length > 0) {
    categoryFilter = `WHERE (category = $${paramCount++} OR $${paramCount++} = '')`;
    values.push(category || '物理类', category || '物理类');
  }

  const majorsResult = await query(
    `SELECT * FROM majors ${categoryFilter} ORDER BY id LIMIT 50`,
    values
  );

  const majors = majorsResult.rows.map(m => ({
    ...m,
    tags: m.tags || []
  }));

  return majors.slice(0, 10).map(major => ({
    id: major.id,
    name: major.name,
    category: major.category,
    degree: major.degree,
    duration: major.duration,
    tags: major.tags,
    salaryRange: major.salary_range,
    employmentRate: major.employment_rate,
    industryTrend: major.industry_trend
  }));
};

const assessRisk = async (student, score, profile) => {
  const { province, category } = student;
  const { total_score, rank, province_rank } = score;

  const studentRank = province_rank || rank;
  const risks = [];
  const warnings = [];

  const scoreResult = await query(
    `SELECT COUNT(*) as cnt FROM admission_scores ss
     JOIN universities s ON s.id = ss.university_id
     WHERE ss.subject_type = $1 AND ss.min_rank < $2 AND (s.province = $3 OR s.province = '全国')`,
    [category === '历史类' ? 'history' : 'physics', studentRank, province]
  );

  const availableSchools = parseInt(scoreResult.rows[0].cnt);

  if (availableSchools < 20) {
    risks.push({
      type: 'school',
      level: 'high',
      message: `可选院校较少，仅${availableSchools}所`,
      suggestion: '建议扩大地域范围或考虑其他批次'
    });
  }

  if (profile && profile.risk_preference) {
    const prefValue = parseInt(profile.risk_preference);
    if (prefValue < 30 && availableSchools < 50) {
      warnings.push({
        type: 'strategy',
        level: 'medium',
        message: '策略偏保守但可选院校有限',
        suggestion: '可适当提高风险偏好，增加冲刺院校'
      });
    }
  }

  const yearResult = await query(
    `SELECT year, COUNT(*) as cnt 
     FROM admission_scores 
     WHERE subject_type = $1 AND year >= 2021
     GROUP BY year 
     ORDER BY year DESC`,
    [category === '历史类' ? 'history' : 'physics']
  );

  return {
    overall: risks.length > 0 ? 'medium' : 'low',
    risks,
    warnings,
    dataYear: yearResult.rows.map(y => y.year),
    lastUpdated: new Date().toISOString()
  };
};

module.exports = {
  recommendSchools,
  recommendMajors,
  assessRisk
};
