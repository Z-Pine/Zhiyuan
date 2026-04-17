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
  
  // 1. 计算历年录取数据的统计特征
  const scoreStats = analyzeScoreDistribution(admissionScores);
  
  // 2. 确定分层阈值
  const thresholds = calculateThresholds(score, rank, scoreStats);
  
  // 3. 院校分层
  const levels = {
    冲刺: [],
    稳妥: [],
    保底: []
  };
  
  // 按院校分组分析
  const schoolGroups = groupBySchool(admissionScores);
  
  for (const [schoolId, schoolData] of Object.entries(schoolGroups)) {
    const schoolScore = calculateSchoolScore(schoolData, scoreStats);
    const matchResult = matchLevel(schoolScore, thresholds, rank);
    
    if (matchResult.level) {
      levels[matchResult.level].push({
        school_id: schoolId,
        school_name: schoolData.name,
        match_score: matchResult.score,
        admission_probability: matchResult.probability,
        reason: matchResult.reason
      });
    }
  }
  
  // 4. 排序和筛选
  levels.冲刺 = sortByMatchScore(levels.冲刺).slice(0, 15);
  levels.稳妥 = sortByMatchScore(levels.稳妥).slice(0, 20);
  levels.保底 = sortByMatchScore(levels.保底).slice(0, 15);
  
  console.log(`✅ 分层完成: 冲刺=${levels.冲刺.length}, 稳妥=${levels.稳妥.length}, 保底=${levels.保底.length}`);
  
  return {
    冲刺: levels.冲刺.map(s => s.school_id),
    稳妥: levels.稳妥.map(s => s.school_id),
    保底: levels.保底.map(s => s.school_id),
    details: levels,
    thresholds
  };
}

/**
 * 分析分数分布统计
 */
function analyzeScoreDistribution(admissionScores) {
  const scores = admissionScores.map(a => a.min_score).filter(s => s > 0);
  const ranks = admissionScores.map(a => a.min_rank).filter(r => r > 0);
  
  scores.sort((a, b) => a - b);
  ranks.sort((a, b) => a - b);
  
  return {
    score: {
      min: Math.min(...scores),
      max: Math.max(...scores),
      median: scores[Math.floor(scores.length / 2)],
      q25: scores[Math.floor(scores.length * 0.25)],
      q75: scores[Math.floor(scores.length * 0.75)],
      avg: scores.reduce((a, b) => a + b, 0) / scores.length
    },
    rank: {
      min: Math.min(...ranks),
      max: Math.max(...ranks),
      median: ranks[Math.floor(ranks.length / 2)],
      q25: ranks[Math.floor(ranks.length * 0.25)],
      q75: ranks[Math.floor(ranks.length * 0.75)]
    }
  };
}

/**
 * 计算分层阈值
 */
function calculateThresholds(score, rank, scoreStats) {
  // 基于位次的分层策略（更可靠）
  const rankThresholds = {
    // 冲刺：排名比考生好 0-30% 的院校
    冲刺上限: rank * 0.7,
    冲刺下限: rank * 1.0,
    
    // 稳妥：排名与考生相当 ±30% 的院校
    稳妥上限: rank * 1.0,
    稳妥下限: rank * 1.3,
    
    // 保底：排名比考生差 30-80% 的院校
    保底上限: rank * 1.3,
    保底下限: rank * 1.8
  };
  
  // 基于分数的辅助阈值
  const scoreDiff = score - scoreStats.score.median;
  const scoreThresholds = {
    冲刺: score + 10,      // 比考生高10分以内
    稳妥: score - 5,       // 比考生低5分左右
    保底: score - 20       // 比考生低20分以上
  };
  
  return {
    rank: rankThresholds,
    score: scoreThresholds,
    scoreStats
  };
}

/**
 * 按院校分组
 */
function groupBySchool(admissionScores) {
  const groups = {};
  
  for (const record of admissionScores) {
    if (!groups[record.school_id]) {
      groups[record.school_id] = {
        name: record.school_name,
        level: record.school_level,
        is_985: record.is_985,
        is_211: record.is_211,
        scores: [],
        ranks: []
      };
    }
    
    groups[record.school_id].scores.push(record.min_score);
    groups[record.school_id].ranks.push(record.min_rank);
  }
  
  // 计算平均录取分数和位次
  for (const school of Object.values(groups)) {
    school.avgScore = school.scores.reduce((a, b) => a + b, 0) / school.scores.length;
    school.avgRank = school.ranks.reduce((a, b) => a + b, 0) / school.ranks.length;
    school.minRank = Math.min(...school.ranks);
    school.maxRank = Math.max(...school.ranks);
  }
  
  return groups;
}

/**
 * 计算院校匹配分数
 */
function calculateSchoolScore(schoolData, scoreStats) {
  // 综合考量多个因素
  const factors = {
    // 位次匹配度 (权重40%)
    rankMatch: normalizeRank(schoolData.avgRank, scoreStats.rank),
    
    // 分数匹配度 (权重30%)
    scoreMatch: normalizeScore(schoolData.avgScore, scoreStats.score.avg),
    
    // 院校层次加成 (权重20%)
    levelBonus: calculateLevelBonus(schoolData),
    
    // 录取稳定性 (权重10%)
    stability: calculateStability(schoolData)
  };
  
  // 加权计算最终匹配分 (0-100)
  const finalScore = 
    factors.rankMatch * 40 +
    factors.scoreMatch * 30 +
    factors.levelBonus * 20 +
    factors.stability * 10;
  
  return {
    total: finalScore,
    factors
  };
}

/**
 * 归一化位次 (0-100)
 */
function normalizeRank(schoolRank, stats) {
  const range = stats.max - stats.min;
  if (range === 0) return 50;
  return 100 - ((schoolRank - stats.min) / range * 100);
}

/**
 * 归一化分数 (0-100)
 */
function normalizeScore(schoolScore, avgScore) {
  const diff = schoolScore - avgScore;
  // 分数差映射到0-100
  return Math.max(0, Math.min(100, 50 + diff));
}

/**
 * 计算院校层次加成
 */
function calculateLevelBonus(schoolData) {
  if (schoolData.is_985) return 95;
  if (schoolData.is_211) return 85;
  if (schoolData.level === '双一流') return 75;
  return 60;
}

/**
 * 计算录取稳定性
 */
function calculateStability(schoolData) {
  const rankVariance = schoolData.maxRank - schoolData.minRank;
  const stability = Math.max(0, 100 - rankVariance / 100);
  return stability;
}

/**
 * 匹配层次
 */
function matchLevel(schoolScore, thresholds, studentRank) {
  const score = schoolScore.total;
  const rankMatch = schoolScore.factors.rankMatch;
  
  // 冲刺档：高分高排名院校，有一定挑战
  if (score >= 75 && rankMatch >= 60) {
    return {
      level: '冲刺',
      score: score,
      probability: calculateProbability('冲刺', score),
      reason: '院校层次较高，需要一定冲刺，录取概率适中'
    };
  }
  
  // 稳妥档：与考生水平匹配
  if (score >= 55 && score < 80 && rankMatch >= 40 && rankMatch < 70) {
    return {
      level: '稳妥',
      score: score,
      probability: calculateProbability('稳妥', score),
      reason: '与考生成绩匹配度较高，录取概率较大'
    };
  }
  
  // 保底档：确保能录取
  if (score < 60 || rankMatch < 40) {
    return {
      level: '保底',
      score: score,
      probability: calculateProbability('保底', score),
      reason: '录取把握较大，可作为保底选择'
    };
  }
  
  return { level: null, score: 0, probability: 0, reason: '' };
}

/**
 * 计算录取概率
 */
function calculateProbability(level, score) {
  const baseProb = {
    '冲刺': 0.35,
    '稳妥': 0.65,
    '保底': 0.85
  };
  
  // 根据匹配分数调整概率
  const adjustment = (score - 50) / 100;
  return Math.max(0.1, Math.min(0.95, baseProb[level] + adjustment));
}

/**
 * 按匹配分数排序
 */
function sortByMatchScore(schools) {
  return schools.sort((a, b) => b.match_score - a.match_score);
}

module.exports = {
  calculateScoreLevel
};
