/**
 * T051: 就业匹配算法
 * 根据学生画像匹配适合的专业和职业方向
 */

/**
 * 就业匹配
 * @param {Object} params - 参数
 * @param {Object} params.studentProfile - 学生画像
 * @param {Array} params.majors - 专业列表
 * @param {Object} params.client - 数据库连接
 * @returns {Array} 匹配的专业列表
 */
async function matchEmployment({ studentProfile, majors, client }) {
  console.log('💼 开始就业匹配分析...');
  
  // 1. 解析学生画像
  const profileTraits = parseStudentProfile(studentProfile);
  console.log(`   学生特质: ${profileTraits.join(', ')}`);
  
  // 2. 获取行业数据
  const industries = await getIndustries(client);
  
  // 3. 获取职业数据
  const careers = await getCareers(client);
  
  // 4. 匹配专业
  const matchedMajors = [];
  
  for (const major of majors) {
    const matchResult = calculateMajorMatch(major, profileTraits, industries, careers);
    
    if (matchResult.score >= 40) {  // 只保留匹配度40%以上的
      matchedMajors.push({
        major_id: major.id,
        major_name: major.name,
        category: major.category,
        degree_type: major.degree_type,
        match_score: matchResult.score,
        match_reason: matchResult.reason,
        recommended_careers: matchResult.careers,
        industry_fit: matchResult.industryFit
      });
    }
  }
  
  // 5. 排序并返回前30个最匹配的专业
  matchedMajors.sort((a, b) => b.match_score - a.match_score);
  
  console.log(`✅ 就业匹配完成: 找到${matchedMajors.length}个匹配专业`);
  
  return matchedMajors.slice(0, 30);
}

/**
 * 解析学生画像
 */
function parseStudentProfile(profile) {
  const traits = [];
  
  // 解析MBTI性格类型
  if (profile.mbti_type) {
    traits.push(...parseMBTI(profile.mbti_type));
  }
  
  // 解析霍兰德职业兴趣
  if (profile.holland_code) {
    traits.push(...parseHolland(profile.holland_code));
  }
  
  // 解析学科优势
  if (profile.subject_strengths) {
    traits.push(...parseSubjectStrengths(profile.subject_strengths));
  }
  
  // 解析兴趣标签
  if (profile.interest_tags) {
    traits.push(...profile.interest_tags);
  }
  
  // 解析能力标签
  if (profile.ability_tags) {
    traits.push(...profile.ability_tags);
  }
  
  // 解析职业倾向
  if (profile.career_preference) {
    traits.push(...parseCareerPreference(profile.career_preference));
  }
  
  return [...new Set(traits)];  // 去重
}

/**
 * 解析MBTI性格类型
 */
function parseMBTI(mbti) {
  const mbtiMap = {
    'ISTJ': ['严谨', '务实', '逻辑', '管理', '财务'],
    'ISFJ': ['细心', '耐心', '服务', '医疗', '教育'],
    'INFJ': ['洞察', '理想', '人文', '咨询', '写作'],
    'INTJ': ['战略', '独立', '分析', '科研', '技术'],
    'ISTP': ['灵活', '实践', '技术', '工程', '操作'],
    'ISFP': ['艺术', '敏感', '创造', '设计', '艺术'],
    'INFP': ['理想', '创造', '人文', '写作', '心理'],
    'INTP': ['逻辑', '好奇', '分析', '科研', '技术'],
    'ESTP': ['行动', '实践', '商业', '销售', '管理'],
    'ESFP': ['热情', '社交', '表演', '艺术', '服务'],
    'ENFP': ['热情', '创造', '社交', '营销', '教育'],
    'ENTP': ['创新', '辩论', '战略', '创业', '咨询'],
    'ESTJ': ['组织', '管理', '执行', '管理', '行政'],
    'ESFJ': ['合作', '服务', '社交', '教育', '医疗'],
    'ENFJ': ['领导', '感染', '教育', '教育', '管理'],
    'ENTJ': ['领导', '战略', '决策', '管理', '创业']
  };
  
  return mbtiMap[mbti] || ['综合'];
}

/**
 * 解析霍兰德职业兴趣
 */
function parseHolland(holland) {
  const hollandMap = {
    'R': ['实践', '技术', '操作', '工程', '机械'],
    'I': ['研究', '分析', '科学', '科研', '数据'],
    'A': ['艺术', '创造', '设计', '表演', '写作'],
    'S': ['社会', '服务', '教育', '医疗', '咨询'],
    'E': ['企业', '管理', '销售', '领导', '商业'],
    'C': ['常规', '细致', '财务', '行政', '文档']
  };
  
  const traits = [];
  for (const code of holland.toUpperCase()) {
    if (hollandMap[code]) {
      traits.push(...hollandMap[code]);
    }
  }
  return traits;
}

/**
 * 解析学科优势
 */
function parseSubjectStrengths(strengths) {
  const subjectMap = {
    'physics': ['物理', '工程', '技术', '科研'],
    'chemistry': ['化学', '实验', '医药', '材料'],
    'biology': ['生物', '医学', '生命科学', '环境'],
    'mathematics': ['数学', '逻辑', '数据', '金融'],
    'chinese': ['语文', '文学', '写作', '教育'],
    'english': ['英语', '外语', '国际', '翻译'],
    'history': ['历史', '人文', '研究', '文化'],
    'geography': ['地理', '环境', '规划', '旅游'],
    'politics': ['政治', '法律', '社会', '管理']
  };
  
  const traits = [];
  for (const subject of strengths) {
    if (subjectMap[subject]) {
      traits.push(...subjectMap[subject]);
    }
  }
  return traits;
}

/**
 * 解析职业倾向
 */
function parseCareerPreference(preference) {
  const preferenceMap = {
    'stable': ['稳定', '公务员', '事业编', '国企'],
    'high_income': ['高薪', '金融', '互联网', '技术'],
    'work_life_balance': ['平衡', '教育', '行政', '文化'],
    'social_contribution': ['社会贡献', '医疗', '教育', '公益'],
    'creativity': ['创造', '设计', '艺术', '研发'],
    'leadership': ['领导', '管理', '创业', '企业']
  };
  
  return preferenceMap[preference] || [];
}

/**
 * 获取行业数据
 */
async function getIndustries(client) {
  try {
    const result = await client.query(`
      SELECT * FROM industries
    `);
    return result.rows;
  } catch (error) {
    console.log('   行业表不存在，使用默认数据');
    return getDefaultIndustries();
  }
}

/**
 * 获取职业数据
 */
async function getCareers(client) {
  try {
    const result = await client.query(`
      SELECT * FROM careers
    `);
    return result.rows;
  } catch (error) {
    console.log('   职业表不存在，使用默认数据');
    return getDefaultCareers();
  }
}

/**
 * 计算专业匹配度
 */
function calculateMajorMatch(major, profileTraits, industries, careers) {
  let totalScore = 0;
  const reasons = [];
  const matchedCareers = [];
  const industryFit = [];
  
  // 1. 专业名称匹配 (权重30%)
  const nameMatch = calculateNameMatch(major.name, profileTraits);
  totalScore += nameMatch.score * 0.3;
  if (nameMatch.matched.length > 0) {
    reasons.push(`专业名称匹配: ${nameMatch.matched.join(', ')}`);
  }
  
  // 2. 专业类别匹配 (权重25%)
  const categoryMatch = calculateCategoryMatch(major.category, profileTraits);
  totalScore += categoryMatch.score * 0.25;
  if (categoryMatch.matched.length > 0) {
    reasons.push(`专业类别匹配: ${categoryMatch.matched.join(', ')}`);
  }
  
  // 3. 就业方向匹配 (权重25%)
  const careerMatch = calculateCareerMatch(major, profileTraits, careers);
  totalScore += careerMatch.score * 0.25;
  matchedCareers.push(...careerMatch.careers);
  if (careerMatch.reason) {
    reasons.push(careerMatch.reason);
  }
  
  // 4. 行业前景匹配 (权重20%)
  const industryMatch = calculateIndustryMatch(major, industries);
  totalScore += industryMatch.score * 0.2;
  industryFit.push(...industryMatch.industries);
  
  // 5. 学位类型加成
  if (major.degree_type && major.degree_type.includes('学士')) {
    totalScore += 5;  // 本科学位加分
  }
  
  return {
    score: Math.min(100, Math.round(totalScore)),
    reason: reasons.slice(0, 3).join('; '),  // 最多3个理由
    careers: matchedCareers.slice(0, 5),
    industryFit: industryFit.slice(0, 3)
  };
}

/**
 * 计算名称匹配
 */
function calculateNameMatch(majorName, traits) {
  let score = 0;
  const matched = [];
  
  const majorKeywords = {
    '计算机': ['技术', '逻辑', '数据', '科研'],
    '软件': ['技术', '创造', '逻辑', '工程'],
    '人工智能': ['技术', '科研', '数据', '创新'],
    '金融': ['数学', '经济', '管理', '分析'],
    '医学': ['生物', '服务', '严谨', '医疗'],
    '法学': ['逻辑', '社会', '公正', '管理'],
    '教育': ['社会', '耐心', '服务', '教育'],
    '设计': ['艺术', '创造', '审美', '设计'],
    '工程': ['实践', '技术', '逻辑', '工程'],
    '管理': ['领导', '组织', '决策', '管理'],
    '语言': ['沟通', '国际', '文化', '翻译'],
    '心理': ['洞察', '社会', '咨询', '人文']
  };
  
  for (const [keyword, keywords] of Object.entries(majorKeywords)) {
    if (majorName.includes(keyword)) {
      const matches = traits.filter(t => keywords.includes(t));
      if (matches.length > 0) {
        score += 20 * matches.length;
        matched.push(...matches);
      }
    }
  }
  
  return { score: Math.min(100, score), matched: [...new Set(matched)] };
}

/**
 * 计算类别匹配
 */
function calculateCategoryMatch(category, traits) {
  const categoryTraits = {
    '哲学': ['人文', '思考', '逻辑'],
    '经济学': ['数学', '分析', '经济', '管理'],
    '法学': ['逻辑', '社会', '公正'],
    '教育学': ['社会', '耐心', '服务', '教育'],
    '文学': ['语言', '写作', '文化', '表达'],
    '历史学': ['人文', '研究', '文化'],
    '理学': ['科研', '逻辑', '分析'],
    '工学': ['技术', '实践', '工程', '逻辑'],
    '农学': ['生物', '环境', '实践'],
    '医学': ['生物', '服务', '严谨', '医疗'],
    '管理学': ['管理', '组织', '决策', '领导'],
    '艺术学': ['艺术', '创造', '审美', '设计']
  };
  
  const categoryTraitList = categoryTraits[category] || [];
  const matches = traits.filter(t => categoryTraitList.includes(t));
  
  return {
    score: Math.min(100, matches.length * 25),
    matched: matches
  };
}

/**
 * 计算职业匹配
 */
function calculateCareerMatch(major, traits, careers) {
  // 专业到职业的映射
  const majorCareerMap = {
    '计算机科学与技术': ['软件工程师', '系统架构师', '数据分析师'],
    '软件工程': ['软件工程师', '前端开发', '后端开发'],
    '人工智能': ['AI工程师', '算法工程师', '数据科学家'],
    '金融学': ['金融分析师', '投资顾问', '风险管理师'],
    '临床医学': ['临床医生', '专科医生', '医学研究员'],
    '法学': ['律师', '法官', '法务顾问'],
    '教育学': ['教师', '教育管理者', '培训师'],
    '汉语言文学': ['编辑', '记者', '语文教师'],
    '英语': ['翻译', '英语教师', '外贸专员'],
    '工商管理': ['企业管理者', '项目经理', '咨询顾问'],
    '会计学': ['会计师', '审计师', '财务经理'],
    '建筑学': ['建筑师', '城市规划师', '室内设计师']
  };
  
  const relatedCareers = majorCareerMap[major.name] || ['相关领域专业人员'];
  
  return {
    score: 60,  // 基础分
    careers: relatedCareers,
    reason: `主要就业方向: ${relatedCareers.join(', ')}`
  };
}

/**
 * 计算行业匹配
 */
function calculateIndustryMatch(major, industries) {
  // 专业到行业的映射
  const majorIndustryMap = {
    '计算机': ['互联网', '信息技术', '软件开发'],
    '软件': ['互联网', '信息技术', '软件开发'],
    '人工智能': ['人工智能', '互联网', '科技'],
    '金融': ['金融', '银行', '投资'],
    '医学': ['医疗', '医药', '健康'],
    '法学': ['法律服务', '政府', '企业法务'],
    '教育': ['教育', '培训', '文化'],
    '工程': ['制造业', '建筑', '能源'],
    '管理': ['企业管理', '咨询', '金融']
  };
  
  let matchedIndustries = ['综合'];
  
  for (const [keyword, industries] of Object.entries(majorIndustryMap)) {
    if (major.name.includes(keyword)) {
      matchedIndustries = industries;
      break;
    }
  }
  
  return {
    score: 60,
    industries: matchedIndustries
  };
}

/**
 * 获取默认行业数据
 */
function getDefaultIndustries() {
  return [
    { name: '互联网', growth_rate: 15, avg_salary: 15000 },
    { name: '金融', growth_rate: 10, avg_salary: 18000 },
    { name: '医疗', growth_rate: 12, avg_salary: 12000 },
    { name: '教育', growth_rate: 8, avg_salary: 8000 },
    { name: '制造业', growth_rate: 6, avg_salary: 10000 }
  ];
}

/**
 * 获取默认职业数据
 */
function getDefaultCareers() {
  return [
    { name: '软件工程师', demand_level: 'high', avg_salary: 18000 },
    { name: '金融分析师', demand_level: 'medium', avg_salary: 20000 },
    { name: '医生', demand_level: 'high', avg_salary: 15000 },
    { name: '教师', demand_level: 'stable', avg_salary: 8000 },
    { name: '律师', demand_level: 'medium', avg_salary: 15000 }
  ];
}

module.exports = {
  matchEmployment
};
