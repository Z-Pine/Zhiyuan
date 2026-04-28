/**
 * T050: 位次分层算法
 * 根据考生分数和排名，将院校划分为冲刺/稳妥/保底三档
 */

/**
 * 计算位次分层
 * @param {Object} params - 参数
 * @param {number} params.score - 考生总分
 * @param {number} params.rank - 考生位次排名
 * @param {string} params.province - 省份
 * @param {string} params.subjectType - 科目类型 (physics/history)
 * @param {Array} params.admissionScores - 历年录取数据
 * @returns {Object} 分层结果
 */
async function calculateScoreLevel({ score, rank, province, subjectType, admissionScores }) {
  console.log(`📊 位次分层计算: 分数=${score}, 排名=${rank}, 省份=${province}, 科类=${subjectType}`);
  
  // 1. 按院校分组分析
  const schoolGroups = groupBySchool(admissionScores);
  console.log(`📋 院校分组: ${Object.keys(schoolGroups).length} 所院校`);
  
  // 2. 院校分层
  const levels = {
    冲刺: [],
    稳妥: [],
    保底: []
  };
  
  for (const [schoolId, schoolData] of Object.entries(schoolGroups)) {
    // 跳过数据不完整的院校
    if (!schoolId || !schoolData || !schoolData.avgRank) {
      continue;
    }
    
    // 使用位次差来判断层次
    const matchResult = matchLevelByRank(schoolData, rank, score);
    
    if (matchResult.level) {
      levels[matchResult.level].push({
        school_id: schoolId,
        school_name: schoolData.name,
        avg_rank: schoolData.avgRank,
        avg_score: schoolData.avgScore,
        match_score: matchResult.score,
        admission_probability: matchResult.probability,
        reason: matchResult.reason
      });
    }
  }
  
  // 3. 排序和筛选
  // 冲刺：按录取位次从好到差排序（位次小的在前）
  levels.冲刺 = levels.冲刺.sort((a, b) => a.avg_rank - b.avg_rank).slice(0, 15);
  // 稳妥：按录取位次从好到差排序
  levels.稳妥 = levels.稳妥.sort((a, b) => a.avg_rank - b.avg_rank).slice(0, 20);
  // 保底：按录取位次从差到好排序（位次大的在前，更保险）
  levels.保底 = levels.保底.sort((a, b) => b.avg_rank - a.avg_rank).slice(0, 15);
  
  console.log(`✅ 分层完成: 冲刺=${levels.冲刺.length}, 稳妥=${levels.稳妥.length}, 保底=${levels.保底.length}`);
  
  return {
    冲刺: levels.冲刺.map(s => s.school_id),
    稳妥: levels.稳妥.map(s => s.school_id),
    保底: levels.保底.map(s => s.school_id),
    details: levels,
    thresholds: {
      studentRank: rank,
      studentScore: score,
      冲刺范围: `位次 ${Math.floor(rank * 0.3)} - ${rank}（比考生好30%-100%）`,
      稳妥范围: `位次 ${rank} - ${Math.floor(rank * 1.5)}（与考生相当）`,
      保底范围: `位次 ${Math.floor(rank * 1.5)} - ${Math.floor(rank * 2.5)}（比考生差50%-150%）`
    }
  };
}

/**
 * 按院校分组
 */
function groupBySchool(admissionScores) {
  const groups = {};
  
  for (const record of admissionScores) {
    // 使用university_id作为key（数据库返回的字段名）
    const schoolId = record.university_id;
    
    if (!schoolId) {
      console.log('⚠️ 跳过没有university_id的记录');
      continue;  // 跳过没有院校ID的记录
    }
    
    if (!groups[schoolId]) {
      groups[schoolId] = {
        id: schoolId,  // 添加id字段
        name: record.school_name || '未知院校',
        level: record.school_level,
        scores: [],
        ranks: []
      };
    }
    
    if (record.min_score && record.min_score > 0) {
      groups[schoolId].scores.push(record.min_score);
    }
    if (record.min_rank && record.min_rank > 0) {
      groups[schoolId].ranks.push(record.min_rank);
    }
  }
  
  // 计算平均录取分数和位次，并过滤掉数据不足的院校
  const validGroups = {};
  
  for (const [schoolId, school] of Object.entries(groups)) {
    // 至少需要有分数或位次数据
    if (school.scores.length === 0 && school.ranks.length === 0) {
      console.log(`⚠️ 跳过没有有效数据的院校: ${school.name}`);
      continue;
    }
    
    if (school.scores.length > 0) {
      school.avgScore = school.scores.reduce((a, b) => a + b, 0) / school.scores.length;
      school.minScore = Math.min(...school.scores);
      school.maxScore = Math.max(...school.scores);
    } else {
      school.avgScore = 0;
      school.minScore = 0;
      school.maxScore = 0;
    }
    
    if (school.ranks.length > 0) {
      school.avgRank = school.ranks.reduce((a, b) => a + b, 0) / school.ranks.length;
      school.minRank = Math.min(...school.ranks);
      school.maxRank = Math.max(...school.ranks);
    } else {
      school.avgRank = 0;
      school.minRank = 0;
      school.maxRank = 0;
    }
    
    validGroups[schoolId] = school;
  }
  
  console.log(`✅ 有效院校分组: ${Object.keys(validGroups).length} 所`);
  
  return validGroups;
}

/**
 * 根据位次匹配层次（新算法 - 简单直接）
 * @param {Object} schoolData - 院校数据
 * @param {number} studentRank - 考生位次
 * @param {number} studentScore - 考生分数
 * @returns {Object} 匹配结果
 */
function matchLevelByRank(schoolData, studentRank, studentScore) {
  const schoolRank = schoolData.avgRank;
  const schoolScore = schoolData.avgScore;
  
  // 位次差异比例（院校位次 / 考生位次）
  // 比例 < 1: 院校录取位次更好（更难考）→ 冲刺
  // 比例 ≈ 1: 相当 → 稳妥
  // 比例 > 1: 院校录取位次更差（更容易考）→ 保底
  const rankRatio = schoolRank / studentRank;
  
  // 分数差
  const scoreDiff = schoolScore - studentScore;
  
  // 冲刺档：院校录取位次比考生好 30%-100%
  // 例如：考生位次15000，院校录取位次7500-15000
  if (rankRatio >= 0.3 && rankRatio < 1.0) {
    const probability = 0.15 + (rankRatio) * 0.35; // 0.15-0.50
    return {
      level: '冲刺',
      score: Math.round(rankRatio * 100), // 30-100分
      probability: Math.min(0.50, probability),
      reason: `院校录取位次${Math.round(schoolRank)}优于考生位次${studentRank}，有一定挑战性`
    };
  }
  
  // 稳妥档：院校录取位次与考生相当
  // 位次在考生的 100%-150% 范围内
  // 例如：考生位次15000，院校录取位次15000-22500
  if (rankRatio >= 1.0 && rankRatio <= 1.5) {
    const probability = 0.65 + (1.5 - rankRatio) * 0.15; // 0.65-0.80
    return {
      level: '稳妥',
      score: Math.round((2 - rankRatio) * 70), // 35-70分
      probability: Math.min(0.80, probability),
      reason: `院校录取位次${Math.round(schoolRank)}与考生位次${studentRank}接近，录取概率较大`
    };
  }
  
  // 保底档：院校录取位次比考生差 50%-150%
  // 例如：考生位次15000，院校录取位次22500-37500
  if (rankRatio > 1.5 && rankRatio <= 2.5) {
    const probability = 0.82 + Math.min(0.13, (rankRatio - 1.5) * 0.08);
    return {
      level: '保底',
      score: Math.round(rankRatio * 35), // 52-87分
      probability: Math.min(0.95, probability),
      reason: `院校录取位次${Math.round(schoolRank)}低于考生位次${studentRank}，录取把握很大`
    };
  }
  
  // 超出范围的不推荐
  if (rankRatio < 0.3) {
    return { 
      level: null, 
      score: 0, 
      probability: 0, 
      reason: `院校层次过高（录取位次${Math.round(schoolRank)}远优于考生${studentRank}）`
    };
  }
  
  if (rankRatio > 2.5) {
    return { 
      level: null, 
      score: 0, 
      probability: 0, 
      reason: `院校层次过低（录取位次${Math.round(schoolRank)}远低于考生${studentRank}）`
    };
  }
  
  return { level: null, score: 0, probability: 0, reason: '未知原因' };
}

/**
 * 计算院校匹配分数（保留旧函数以防其他地方使用）
 */
function calculateSchoolScore(schoolData, scoreStats) {
  // 简化版本
  return {
    total: 50,
    factors: {
      rankMatch: 50,
      scoreMatch: 50,
      levelBonus: 50,
      stability: 50
    }
  };
}

/**
 * 匹配层次（旧函数，保留以防其他地方使用）
 */
function matchLevel(schoolScore, thresholds, studentRank) {
  return { level: null, score: 0, probability: 0, reason: '' };
}

/**
 * 按匹配分数排序（已废弃，保留以防其他地方使用）
 */
function sortByMatchScore(schools) {
  return schools.sort((a, b) => b.match_score - a.match_score);
}

module.exports = {
  calculateScoreLevel
};
