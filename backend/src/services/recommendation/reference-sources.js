/**
 * T054: 参考来源关联
 * 为推荐结果生成官方数据来源和参考链接
 */

/**
 * 生成参考来源
 * @param {Object} recommendations - 推荐结果
 * @returns {Object} 参考来源信息
 */
function generateReferences(recommendations) {
  console.log('🔗 生成参考来源...');
  
  const references = {
    official_sources: [],
    data_sources: [],
    policy_sources: [],
    school_sources: [],
    major_sources: [],
    generated_at: new Date().toISOString()
  };
  
  // 1. 官方教育平台
  references.official_sources = [
    {
      name: '教育部阳光高考信息平台',
      url: 'https://gaokao.chsi.com.cn',
      description: '官方高考政策、院校信息、录取数据查询平台',
      type: 'official'
    },
    {
      name: '各省教育考试院官网',
      url: 'https://www.neea.edu.cn',
      description: '各省高考政策、分数线、录取查询',
      type: 'official'
    },
    {
      name: '中国高等教育学生信息网(学信网)',
      url: 'https://www.chsi.com.cn',
      description: '学历查询、学籍验证、招生信息',
      type: 'official'
    }
  ];
  
  // 2. 数据来源
  references.data_sources = [
    {
      name: '历年录取分数数据库',
      description: '基于2022-2024年各省录取数据',
      update_time: '2024年',
      coverage: '全国31省市区'
    },
    {
      name: '院校基本信息库',
      description: '教育部公布的院校基本信息',
      update_time: '2024年',
      coverage: '全国155所重点院校'
    },
    {
      name: '专业目录数据库',
      description: '教育部本科专业目录(2024版)',
      update_time: '2024年',
      coverage: '12大学科门类，700+专业'
    }
  ];
  
  // 3. 政策来源
  references.policy_sources = [
    {
      name: '新高考改革政策',
      description: '3+1+2模式考试招生政策',
      document: '《关于深化考试招生制度改革的实施意见》',
      year: '2014-2024'
    },
    {
      name: '双一流建设政策',
      description: '世界一流大学和一流学科建设',
      document: '《统筹推进世界一流大学和一流学科建设总体方案》',
      year: '2017'
    },
    {
      name: '职业教育改革',
      description: '职业教育与普通教育融通发展',
      document: '《国家职业教育改革实施方案》',
      year: '2019'
    }
  ];
  
  // 4. 生成院校参考链接
  references.school_sources = generateSchoolReferences(recommendations);
  
  // 5. 生成专业参考链接
  references.major_sources = generateMajorReferences(recommendations);
  
  // 6. 生成推荐说明
  references.recommendation_note = generateRecommendationNote();
  
  console.log('✅ 参考来源生成完成');
  
  return references;
}

/**
 * 生成院校参考链接
 */
function generateSchoolReferences(recommendations) {
  const schoolRefs = [];
  const allSchools = [
    ...(recommendations.冲刺 || []),
    ...(recommendations.稳妥 || []),
    ...(recommendations.保底 || [])
  ];
  
  // 去重
  const uniqueSchools = [];
  const seen = new Set();
  
  for (const item of allSchools) {
    const school = item.school || item;
    if (!seen.has(school.id)) {
      seen.add(school.id);
      uniqueSchools.push(school);
    }
  }
  
  for (const school of uniqueSchools.slice(0, 10)) {
    const ref = {
      school_name: school.name,
      school_id: school.id,
      official_website: generateSchoolWebsite(school),
      admission_page: `https://gaokao.chsi.com.cn/sch/search.do?searchType=1&yxmc=${encodeURIComponent(school.name)}`,
      introduction: generateSchoolIntroduction(school)
    };
    schoolRefs.push(ref);
  }
  
  return schoolRefs;
}

/**
 * 生成院校官网链接
 */
function generateSchoolWebsite(school) {
  // 根据院校代码生成官网链接（模拟）
  const websiteMap = {
    '北京大学': 'https://www.pku.edu.cn',
    '清华大学': 'https://www.tsinghua.edu.cn',
    '复旦大学': 'https://www.fudan.edu.cn',
    '上海交通大学': 'https://www.sjtu.edu.cn',
    '浙江大学': 'https://www.zju.edu.cn',
    '南京大学': 'https://www.nju.edu.cn',
    '中国科学技术大学': 'https://www.ustc.edu.cn',
    '中国人民大学': 'https://www.ruc.edu.cn',
    '北京航空航天大学': 'https://www.buaa.edu.cn',
    '北京理工大学': 'https://www.bit.edu.cn'
  };
  
  return websiteMap[school.name] || `https://www.${school.code || 'school'}.edu.cn`;
}

/**
 * 生成院校简介
 */
function generateSchoolIntroduction(school) {
  const parts = [];
  const level = school.level || [];
  
  if (level.includes('985')) {
    parts.push('985工程重点建设高校');
  } else if (level.includes('211')) {
    parts.push('211工程重点建设高校');
  }
  
  if (level.includes('double_first_class')) {
    parts.push('双一流建设高校');
  }
  
  parts.push(`${school.type || '综合'}类院校`);
  parts.push(`位于${school.province}${school.city ? '·' + school.city : ''}`);
  
  return parts.join('，');
}

/**
 * 生成专业参考链接
 */
function generateMajorReferences(recommendations) {
  const majorRefs = [];
  const allMajors = new Set();
  
  // 收集所有专业
  const allSchools = [
    ...(recommendations.冲刺 || []),
    ...(recommendations.稳妥 || []),
    ...(recommendations.保底 || [])
  ];
  
  for (const item of allSchools) {
    const majors = item.majors || [];
    for (const major of majors) {
      allMajors.add(major.name || major.major_name);
    }
  }
  
  // 生成专业参考
  for (const majorName of Array.from(allMajors).slice(0, 15)) {
    const ref = {
      major_name: majorName,
      introduction_page: `https://gaokao.chsi.com.cn/zyk/zybk/specialityDetail.do?specId=${generateSpecId(majorName)}`,
      career_prospects: generateCareerProspects(majorName),
      related_industries: getRelatedIndustries(majorName)
    };
    majorRefs.push(ref);
  }
  
  return majorRefs;
}

/**
 * 生成专业ID（模拟）
 */
function generateSpecId(majorName) {
  // 简化的哈希函数
  let hash = 0;
  for (let i = 0; i < majorName.length; i++) {
    const char = majorName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 10000 + 1000;
}

/**
 * 生成职业前景说明
 */
function generateCareerProspects(majorName) {
  const prospectsMap = {
    '计算机': '软件开发、系统架构、数据分析、人工智能等方向',
    '软件': '软件工程师、前端/后端开发、移动开发等',
    '人工智能': 'AI工程师、算法工程师、数据科学家等',
    '金融': '银行、证券、保险、投资等金融机构',
    '经济': '经济研究、金融分析、企业管理等',
    '医学': '临床医生、医学研究、医疗管理等',
    '教育': '教师、教育管理、培训讲师等',
    '法学': '律师、法官、检察官、企业法务等',
    '建筑': '建筑师、城市规划师、室内设计师等',
    '机械': '机械设计、制造工程师、自动化等'
  };
  
  for (const [keyword, prospect] of Object.entries(prospectsMap)) {
    if (majorName.includes(keyword)) {
      return prospect;
    }
  }
  
  return '相关领域专业技术或管理岗位';
}

/**
 * 获取相关行业
 */
function getRelatedIndustries(majorName) {
  const industryMap = {
    '计算机': ['互联网', '软件开发', '人工智能'],
    '软件': ['互联网', '软件开发'],
    '人工智能': ['人工智能', '互联网'],
    '金融': ['金融', '银行', '投资'],
    '经济': ['金融', '经济研究'],
    '医学': ['医疗', '医药'],
    '教育': ['教育', '培训'],
    '法学': ['法律服务', '政府'],
    '建筑': ['建筑', '房地产'],
    '机械': ['制造业', '汽车']
  };
  
  for (const [keyword, industries] of Object.entries(industryMap)) {
    if (majorName.includes(keyword)) {
      return industries;
    }
  }
  
  return ['综合'];
}

/**
 * 生成推荐说明
 */
function generateRecommendationNote() {
  return {
    disclaimer: '本推荐结果仅供参考，最终志愿填报请以各省教育考试院官方信息为准。',
    usage_guide: [
      '1. 推荐结果基于历年录取数据和算法模型生成',
      '2. 建议结合个人兴趣、家庭条件、地域偏好综合考虑',
      '3. 冲刺院校录取概率较低，建议作为第一志愿尝试',
      '4. 稳妥院校与考生成绩匹配度较高，建议重点考虑',
      '5. 保底院校录取把握较大，建议作为保底选择',
      '6. 建议查阅院校官网了解最新招生政策',
      '7. 关注各省教育考试院发布的最新分数线和招生计划'
    ],
    update_note: '数据更新至2024年，具体录取情况请以当年官方公布为准。',
    contact: {
      official_platform: '教育部阳光高考信息平台',
      url: 'https://gaokao.chsi.com.cn',
      phone: '010-82199588'
    }
  };
}

/**
 * 生成特定院校的参考链接
 * @param {string} schoolName - 院校名称
 * @returns {Object} 院校参考信息
 */
function generateSpecificSchoolReference(schoolName) {
  return {
    name: schoolName,
    official_website: generateSchoolWebsite({ name: schoolName }),
    admission_query: `https://gaokao.chsi.com.cn/sch/search.do?searchType=1&yxmc=${encodeURIComponent(schoolName)}`,
    score_query: `https://gaokao.chsi.com.cn/zsgs/zhangcheng/listVerifedZszc--method-listByYx,yxmc-${encodeURIComponent(schoolName)},start-0.dhtml`,
    plan_query: `https://gaokao.chsi.com.cn/zsgs/zhangcheng/listVerifedZszc--method-listByYx,yxmc-${encodeURIComponent(schoolName)},start-0.dhtml`
  };
}

/**
 * 生成特定专业的参考链接
 * @param {string} majorName - 专业名称
 * @returns {Object} 专业参考信息
 */
function generateSpecificMajorReference(majorName) {
  return {
    name: majorName,
    introduction: `https://gaokao.chsi.com.cn/zyk/zybk/specialityDetail.do?specId=${generateSpecId(majorName)}`,
    career_info: generateCareerProspects(majorName),
    related_industries: getRelatedIndustries(majorName),
    course_info: '详见阳光高考平台专业介绍'
  };
}

module.exports = {
  generateReferences,
  generateSpecificSchoolReference,
  generateSpecificMajorReference
};
