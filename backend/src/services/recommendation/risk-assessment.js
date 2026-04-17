/**
 * T052: 风险评估算法
 * 评估行业和院校的风险等级
 */

/**
 * 风险评估
 * @param {Object} params - 参数
 * @param {Array} params.schools - 院校列表
 * @param {Array} params.majors - 专业列表
 * @param {Object} params.client - 数据库连接
 * @returns {Object} 风险评估结果
 */
async function assessRisk({ schools, majors, client }) {
  console.log('⚠️ 开始风险评估...');
  
  const result = {
    overallRiskLevel: 'medium',
    schoolRisks: {},
    majorRisks: {},
    industryRisks: {},
    warnings: [],
    suggestions: []
  };
  
  // 1. 评估院校风险
  for (const school of schools) {
    result.schoolRisks[school.id] = assessSchoolRisk(school);
  }
  
  // 2. 评估专业风险
  for (const major of majors) {
    result.majorRisks[major.major_id] = assessMajorRisk(major);
  }
  
  // 3. 评估行业风险
  result.industryRisks = assessIndustryRisks(majors);
  
  // 4. 生成风险警告和建议
  const analysis = generateRiskAnalysis(result, schools, majors);
  result.warnings = analysis.warnings;
  result.suggestions = analysis.suggestions;
  result.overallRiskLevel = analysis.overallLevel;
  
  console.log(`✅ 风险评估完成: 总体风险等级=${result.overallRiskLevel}`);
  
  return result;
}

/**
 * 评估单个院校风险
 */
function assessSchoolRisk(school) {
  const riskFactors = {
    level: 'low',
    score: 0,  // 0-100, 越高风险越大
    factors: []
  };
  
  // 1. 录取波动风险
  const volatilityRisk = calculateVolatilityRisk(school);
  riskFactors.score += volatilityRisk.score;
  if (volatilityRisk.level !== 'low') {
    riskFactors.factors.push(volatilityRisk);
  }
  
  // 2. 院校层次风险
  const levelRisk = calculateLevelRisk(school);
  riskFactors.score += levelRisk.score;
  if (levelRisk.level !== 'low') {
    riskFactors.factors.push(levelRisk);
  }
  
  // 3. 地理位置风险
  const locationRisk = calculateLocationRisk(school);
  riskFactors.score += locationRisk.score;
  if (locationRisk.level !== 'low') {
    riskFactors.factors.push(locationRisk);
  }
  
  // 4. 竞争程度风险
  const competitionRisk = calculateCompetitionRisk(school);
  riskFactors.score += competitionRisk.score;
  if (competitionRisk.level !== 'low') {
    riskFactors.factors.push(competitionRisk);
  }
  
  // 确定总体风险等级
  riskFactors.score = Math.min(100, riskFactors.score);
  if (riskFactors.score >= 70) {
    riskFactors.level = 'high';
  } else if (riskFactors.score >= 40) {
    riskFactors.level = 'medium';
  } else {
    riskFactors.level = 'low';
  }
  
  return riskFactors;
}

/**
 * 计算录取波动风险
 */
function calculateVolatilityRisk(school) {
  // 根据历年录取分数波动判断
  // 这里简化处理，实际应该查询历史数据
  const volatilityScore = school.is_985 ? 30 : (school.is_211 ? 25 : 20);
  
  return {
    type: '录取波动',
    level: volatilityScore > 25 ? 'medium' : 'low',
    score: volatilityScore,
    description: school.is_985 ? '985院校竞争激烈，录取分数波动较大' : '录取分数相对稳定'
  };
}

/**
 * 计算院校层次风险
 */
function calculateLevelRisk(school) {
  let score = 0;
  let description = '';
  
  if (school.is_985) {
    score = 35;
    description = '985顶尖院校，录取难度极高';
  } else if (school.is_211) {
    score = 25;
    description = '211重点院校，录取难度较高';
  } else if (school.level === '双一流') {
    score = 20;
    description = '双一流院校，有一定竞争压力';
  } else {
    score = 10;
    description = '普通本科院校，录取难度适中';
  }
  
  return {
    type: '院校层次',
    level: score >= 30 ? 'high' : (score >= 20 ? 'medium' : 'low'),
    score: score,
    description: description
  };
}

/**
 * 计算地理位置风险
 */
function calculateLocationRisk(school) {
  const highRiskProvinces = ['北京', '上海', '江苏', '浙江', '广东'];
  const mediumRiskProvinces = ['天津', '湖北', '四川', '陕西', '福建'];
  
  let score = 0;
  let description = '';
  
  if (highRiskProvinces.includes(school.province)) {
    score = 20;
    description = `${school.province}是热门地区，竞争激烈`;
  } else if (mediumRiskProvinces.includes(school.province)) {
    score = 10;
    description = `${school.province}竞争程度中等`;
  } else {
    score = 5;
    description = `${school.province}竞争相对较小`;
  }
  
  return {
    type: '地理位置',
    level: score >= 15 ? 'medium' : 'low',
    score: score,
    description: description
  };
}

/**
 * 计算竞争程度风险
 */
function calculateCompetitionRisk(school) {
  // 基于院校类型判断
  const highCompetitionCategories = ['综合', '理工', '财经'];
  const score = highCompetitionCategories.includes(school.category) ? 15 : 10;
  
  return {
    type: '竞争程度',
    level: score >= 15 ? 'medium' : 'low',
    score: score,
    description: `${school.category}类院校报考人数较多`
  };
}

/**
 * 评估专业风险
 */
function assessMajorRisk(major) {
  const riskFactors = {
    level: 'low',
    score: 0,
    factors: []
  };
  
  // 1. 就业饱和度风险
  const saturationRisk = calculateSaturationRisk(major);
  riskFactors.score += saturationRisk.score;
  riskFactors.factors.push(saturationRisk);
  
  // 2. 专业热度风险
  const popularityRisk = calculatePopularityRisk(major);
  riskFactors.score += popularityRisk.score;
  riskFactors.factors.push(popularityRisk);
  
  // 3. 学习难度风险
  const difficultyRisk = calculateDifficultyRisk(major);
  riskFactors.score += difficultyRisk.score;
  riskFactors.factors.push(difficultyRisk);
  
  // 确定风险等级
  riskFactors.score = Math.min(100, riskFactors.score);
  if (riskFactors.score >= 60) {
    riskFactors.level = 'high';
  } else if (riskFactors.score >= 35) {
    riskFactors.level = 'medium';
  } else {
    riskFactors.level = 'low';
  }
  
  return riskFactors;
}

/**
 * 计算就业饱和度风险
 */
function calculateSaturationRisk(major) {
  const saturatedMajors = [
    '法学', '工商管理', '市场营销', '汉语言文学', '英语',
    '会计学', '国际经济与贸易', '计算机科学与技术'
  ];
  
  const isSaturated = saturatedMajors.some(m => major.major_name.includes(m));
  const score = isSaturated ? 25 : 10;
  
  return {
    type: '就业饱和',
    level: isSaturated ? 'medium' : 'low',
    score: score,
    description: isSaturated ? 
      `${major.major_name}毕业生较多，就业竞争激烈` : 
      `${major.major_name}就业市场相对平衡`
  };
}

/**
 * 计算专业热度风险
 */
function calculatePopularityRisk(major) {
  const hotMajors = [
    '人工智能', '数据科学', '软件工程', '金融学', '临床医学'
  ];
  
  const isHot = hotMajors.some(m => major.major_name.includes(m));
  const score = isHot ? 20 : 10;
  
  return {
    type: '专业热度',
    level: isHot ? 'medium' : 'low',
    score: score,
    description: isHot ? 
      `${major.major_name}是热门专业，竞争激烈但前景好` : 
      `${major.major_name}竞争程度适中`
  };
}

/**
 * 计算学习难度风险
 */
function calculateDifficultyRisk(major) {
  const difficultMajors = [
    '数学', '物理', '化学', '生物科学', '计算机',
    '建筑学', '临床医学', '法学'
  ];
  
  const isDifficult = difficultMajors.some(m => major.major_name.includes(m));
  const score = isDifficult ? 15 : 8;
  
  return {
    type: '学习难度',
    level: isDifficult ? 'medium' : 'low',
    score: score,
    description: isDifficult ? 
      `${major.major_name}学习难度较大，需要较强的基础` : 
      `${major.major_name}学习难度适中`
  };
}

/**
 * 评估行业风险
 */
function assessIndustryRisks(majors) {
  const industryRisks = {};
  
  // 行业风险映射
  const industryRiskMap = {
    '互联网': { level: 'medium', trend: '增长放缓', risk: '裁员风险' },
    '金融': { level: 'medium', trend: '监管加强', risk: '政策风险' },
    '教育': { level: 'high', trend: '双减影响', risk: '政策调整' },
    '房地产': { level: 'high', trend: '行业下行', risk: '市场萎缩' },
    '制造业': { level: 'low', trend: '稳定发展', risk: '自动化替代' },
    '医疗': { level: 'low', trend: '持续增长', risk: '门槛提高' },
    '新能源': { level: 'low', trend: '快速发展', risk: '技术迭代' },
    '人工智能': { level: 'medium', trend: '高速发展', risk: '竞争激烈' }
  };
  
  // 从专业推断相关行业
  for (const major of majors) {
    const industries = inferIndustries(major.major_name);
    for (const industry of industries) {
      if (!industryRisks[industry]) {
        industryRisks[industry] = industryRiskMap[industry] || {
          level: 'low',
          trend: '稳定发展',
          risk: '一般风险'
        };
      }
    }
  }
  
  return industryRisks;
}

/**
 * 从专业推断行业
 */
function inferIndustries(majorName) {
  const industryMap = {
    '计算机': ['互联网', '人工智能'],
    '软件': ['互联网', '人工智能'],
    '人工智能': ['人工智能', '互联网'],
    '金融': ['金融'],
    '经济': ['金融'],
    '医学': ['医疗'],
    '临床': ['医疗'],
    '教育': ['教育'],
    '建筑': ['房地产', '制造业'],
    '土木': ['房地产', '制造业'],
    '机械': ['制造业'],
    '电气': ['制造业', '新能源'],
    '能源': ['新能源'],
    '法学': ['法律服务']
  };
  
  for (const [keyword, industries] of Object.entries(industryMap)) {
    if (majorName.includes(keyword)) {
      return industries;
    }
  }
  
  return ['综合'];
}

/**
 * 生成风险分析
 */
function generateRiskAnalysis(result, schools, majors) {
  const warnings = [];
  const suggestions = [];
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  
  // 统计风险分布
  for (const risk of Object.values(result.schoolRisks)) {
    if (risk.level === 'high') highRiskCount++;
    else if (risk.level === 'medium') mediumRiskCount++;
  }
  
  for (const risk of Object.values(result.majorRisks)) {
    if (risk.level === 'high') highRiskCount++;
    else if (risk.level === 'medium') mediumRiskCount++;
  }
  
  // 生成警告
  if (highRiskCount > 0) {
    warnings.push({
      level: 'high',
      message: `检测到${highRiskCount}个高风险项，建议谨慎选择`
    });
  }
  
  if (mediumRiskCount > 5) {
    warnings.push({
      level: 'medium',
      message: `检测到${mediumRiskCount}个中等风险项，建议关注`
    });
  }
  
  // 检查是否有过于集中的风险
  const highRiskSchools = schools.filter(s => result.schoolRisks[s.id]?.level === 'high');
  if (highRiskSchools.length > 3) {
    warnings.push({
      level: 'medium',
      message: '冲刺院校过多，建议增加稳妥和保底选择'
    });
  }
  
  // 生成建议
  suggestions.push({
    type: 'general',
    message: '建议采用"冲稳保"策略，合理分配志愿'
  });
  
  if (highRiskCount > 0) {
    suggestions.push({
      type: 'risk',
      message: '高风险选择需要充分准备备选方案'
    });
  }
  
  // 行业建议
  const highRiskIndustries = Object.entries(result.industryRisks)
    .filter(([_, risk]) => risk.level === 'high');
  if (highRiskIndustries.length > 0) {
    suggestions.push({
      type: 'industry',
      message: `关注${highRiskIndustries.map(([name, _]) => name).join('、')}等行业风险`
    });
  }
  
  // 确定总体风险等级
  let overallLevel = 'low';
  if (highRiskCount >= 3) {
    overallLevel = 'high';
  } else if (highRiskCount >= 1 || mediumRiskCount >= 5) {
    overallLevel = 'medium';
  }
  
  return {
    warnings,
    suggestions,
    overallLevel
  };
}

module.exports = {
  assessRisk
};
