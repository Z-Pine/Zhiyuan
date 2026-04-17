/**
 * T053: 行业分析算法
 * 分析行业趋势、薪资水平、就业率等
 */

/**
 * 行业分析
 * @param {Object} params - 参数
 * @param {Array} params.matchedMajors - 匹配的专业列表
 * @param {Object} params.client - 数据库连接
 * @returns {Object} 行业分析结果
 */
async function analyzeIndustry({ matchedMajors, client }) {
  console.log('📈 开始行业分析...');
  
  // 1. 获取相关行业数据
  const industries = await getIndustryData(client, matchedMajors);
  
  // 2. 分析各行业指标
  const analysis = {
    industries: {},
    overall: {
      avgSalary: 0,
      avgGrowth: 0,
      avgEmploymentRate: 0,
      trendDirection: 'stable'
    },
    recommendations: []
  };
  
  let totalSalary = 0;
  let totalGrowth = 0;
  let totalEmploymentRate = 0;
  let count = 0;
  
  for (const industry of industries) {
    const industryAnalysis = analyzeSingleIndustry(industry, matchedMajors);
    analysis.industries[industry.name] = industryAnalysis;
    
    totalSalary += industryAnalysis.salary.current;
    totalGrowth += industryAnalysis.growth.rate;
    totalEmploymentRate += industryAnalysis.employment.rate;
    count++;
  }
  
  // 3. 计算整体指标
  if (count > 0) {
    analysis.overall = {
      avgSalary: Math.round(totalSalary / count),
      avgGrowth: (totalGrowth / count).toFixed(1),
      avgEmploymentRate: (totalEmploymentRate / count).toFixed(1),
      trendDirection: determineOverallTrend(totalGrowth / count)
    };
  }
  
  // 4. 生成行业推荐
  analysis.recommendations = generateIndustryRecommendations(analysis.industries);
  
  // 5. 生成专业-行业映射
  analysis.majorIndustryMap = generateMajorIndustryMap(matchedMajors, industries);
  
  console.log(`✅ 行业分析完成: 分析了${count}个行业`);
  
  return analysis;
}

/**
 * 获取行业数据
 */
async function getIndustryData(client, majors) {
  // 从专业推断相关行业
  const industryNames = new Set();
  for (const major of majors) {
    const industries = inferIndustriesFromMajor(major.major_name);
    industries.forEach(i => industryNames.add(i));
  }
  
  const industries = [];
  
  // 尝试从数据库获取
  try {
    const result = await client.query(`
      SELECT * FROM industries 
      WHERE name = ANY($1) AND status = 'active'
    `, [Array.from(industryNames)]);
    
    if (result.rows.length > 0) {
      industries.push(...result.rows);
    }
  } catch (error) {
    console.log('   使用默认行业数据');
  }
  
  // 补充默认数据
  const defaultIndustries = getDefaultIndustryData();
  for (const name of industryNames) {
    if (!industries.find(i => i.name === name)) {
      const defaultData = defaultIndustries.find(i => i.name === name);
      if (defaultData) {
        industries.push(defaultData);
      }
    }
  }
  
  return industries;
}

/**
 * 从专业推断行业
 */
function inferIndustriesFromMajor(majorName) {
  const mappings = {
    '计算机': ['互联网', '软件开发', '人工智能'],
    '软件': ['互联网', '软件开发'],
    '人工智能': ['人工智能', '互联网'],
    '数据': ['大数据', '互联网', '金融'],
    '金融': ['金融', '投资', '银行'],
    '经济': ['金融', '经济研究', '咨询'],
    '会计': ['财务', '审计', '金融'],
    '医学': ['医疗', '医药', '健康管理'],
    '临床': ['医疗', '临床医学'],
    '护理': ['医疗', '护理服务'],
    '教育': ['教育', '培训', '出版'],
    '心理': ['心理咨询', '人力资源', '教育'],
    '法学': ['法律服务', '政府', '企业法务'],
    '语言': ['翻译', '教育', '外贸', '旅游'],
    '建筑': ['建筑', '房地产', '城市规划'],
    '土木': ['建筑', '工程', '房地产'],
    '机械': ['制造业', '汽车', '机械工程'],
    '电气': ['电力', '制造业', '新能源'],
    '电子': ['电子', '通信', '半导体'],
    '通信': ['通信', '互联网', '电子'],
    '能源': ['新能源', '传统能源', '环保'],
    '环境': ['环保', '能源', '规划'],
    '生物': ['生物医药', '生物科技', '农业'],
    '化学': ['化工', '医药', '材料'],
    '材料': ['新材料', '制造业', '电子'],
    '数学': ['金融', '数据科学', '教育', '科研'],
    '物理': ['科研', '教育', '半导体', '新能源'],
    '文学': ['出版', '传媒', '教育', '文化'],
    '历史': ['教育', '文化', '博物馆', '研究'],
    '哲学': ['教育', '研究', '咨询'],
    '艺术': ['设计', '传媒', '文化', '娱乐'],
    '设计': ['设计', '互联网', '建筑', '传媒'],
    '管理': ['企业管理', '咨询', '金融'],
    '市场': ['市场营销', '互联网', '传媒'],
    '人力': ['人力资源', '咨询', '企业'],
    '行政': ['行政管理', '政府', '企业']
  };
  
  for (const [keyword, industries] of Object.entries(mappings)) {
    if (majorName.includes(keyword)) {
      return industries;
    }
  }
  
  return ['综合'];
}

/**
 * 分析单个行业
 */
function analyzeSingleIndustry(industry, majors) {
  const relatedMajors = majors.filter(m => {
    const industries = inferIndustriesFromMajor(m.major_name);
    return industries.includes(industry.name);
  });
  
  return {
    name: industry.name,
    salary: {
      current: industry.avg_salary || 8000,
      entry: Math.round((industry.avg_salary || 8000) * 0.6),
      senior: Math.round((industry.avg_salary || 8000) * 2.5),
      trend: industry.salary_trend || 'stable'
    },
    growth: {
      rate: industry.growth_rate || 5,
      trend: industry.growth_rate > 10 ? '快速增长' : 
             industry.growth_rate > 5 ? '稳步增长' : '增长放缓',
      outlook: calculateGrowthOutlook(industry)
    },
    employment: {
      rate: industry.employment_rate || 85,
      demand: calculateDemandLevel(industry),
      competition: calculateCompetitionLevel(industry)
    },
    relatedMajors: relatedMajors.map(m => m.major_name),
    score: calculateIndustryScore(industry)
  };
}

/**
 * 计算增长前景
 */
function calculateGrowthOutlook(industry) {
  const rate = industry.growth_rate || 5;
  if (rate >= 15) return '优秀';
  if (rate >= 10) return '良好';
  if (rate >= 5) return '一般';
  return '谨慎';
}

/**
 * 计算需求等级
 */
function calculateDemandLevel(industry) {
  const highDemandIndustries = ['人工智能', '大数据', '新能源', '医疗', '半导体'];
  const mediumDemandIndustries = ['互联网', '金融', '教育', '软件'];
  
  if (highDemandIndustries.includes(industry.name)) return '高需求';
  if (mediumDemandIndustries.includes(industry.name)) return '中等需求';
  return '稳定需求';
}

/**
 * 计算竞争程度
 */
function calculateCompetitionLevel(industry) {
  const highCompetition = ['互联网', '金融', '教育'];
  const lowCompetition = ['新能源', '医疗', '半导体'];
  
  if (highCompetition.includes(industry.name)) return '竞争激烈';
  if (lowCompetition.includes(industry.name)) return '竞争适中';
  return '一般竞争';
}

/**
 * 计算行业综合评分
 */
function calculateIndustryScore(industry) {
  let score = 0;
  
  // 薪资水平 (30%)
  const salaryScore = Math.min(100, (industry.avg_salary || 8000) / 200);
  score += salaryScore * 0.3;
  
  // 增长率 (30%)
  const growthScore = Math.min(100, (industry.growth_rate || 5) * 5);
  score += growthScore * 0.3;
  
  // 就业率 (25%)
  const employmentScore = industry.employment_rate || 85;
  score += employmentScore * 0.25;
  
  // 稳定性 (15%)
  const stableIndustries = ['医疗', '教育', '金融'];
  const stabilityScore = stableIndustries.includes(industry.name) ? 90 : 70;
  score += stabilityScore * 0.15;
  
  return Math.round(score);
}

/**
 * 确定整体趋势
 */
function determineOverallTrend(avgGrowth) {
  if (avgGrowth >= 10) return 'upward';
  if (avgGrowth >= 5) return 'stable-up';
  if (avgGrowth >= 0) return 'stable';
  return 'downward';
}

/**
 * 生成行业推荐
 */
function generateIndustryRecommendations(industries) {
  const recommendations = [];
  const industryList = Object.values(industries);
  
  // 按评分排序
  industryList.sort((a, b) => b.score - a.score);
  
  // 推荐高分行业
  const topIndustries = industryList.slice(0, 3);
  for (const industry of topIndustries) {
    recommendations.push({
      type: 'priority',
      industry: industry.name,
      reason: `${industry.name}综合评分${industry.score}分，${industry.growth.trend}，平均薪资${industry.salary.current}元`,
      relatedMajors: industry.relatedMajors.slice(0, 3)
    });
  }
  
  // 推荐稳定行业
  const stableIndustries = industryList.filter(i => 
    ['医疗', '教育', '金融'].includes(i.name)
  );
  if (stableIndustries.length > 0) {
    recommendations.push({
      type: 'stable',
      industry: stableIndustries[0].name,
      reason: `${stableIndustries[0].name}行业稳定性高，适合追求工作稳定的考生`,
      relatedMajors: stableIndustries[0].relatedMajors.slice(0, 3)
    });
  }
  
  // 推荐高薪行业
  const highSalaryIndustries = industryList
    .filter(i => i.salary.current >= 12000)
    .slice(0, 2);
  for (const industry of highSalaryIndustries) {
    if (!recommendations.find(r => r.industry === industry.name)) {
      recommendations.push({
        type: 'high_salary',
        industry: industry.name,
        reason: `${industry.name}行业薪资水平较高，平均${industry.salary.current}元/月`,
        relatedMajors: industry.relatedMajors.slice(0, 3)
      });
    }
  }
  
  return recommendations;
}

/**
 * 生成专业-行业映射
 */
function generateMajorIndustryMap(majors, industries) {
  const map = {};
  
  for (const major of majors) {
    const relatedIndustries = inferIndustriesFromMajor(major.major_name);
    const industryData = relatedIndustries.map(name => {
      const industry = industries.find(i => i.name === name);
      return {
        name,
        salary: industry?.avg_salary || 8000,
        growth: industry?.growth_rate || 5,
        employment: industry?.employment_rate || 85
      };
    });
    
    map[major.major_name] = {
      major_id: major.major_id,
      industries: industryData,
      bestIndustry: industryData.length > 0 ? 
        industryData.reduce((max, i) => i.salary > max.salary ? i : max) : 
        null
    };
  }
  
  return map;
}

/**
 * 获取默认行业数据
 */
function getDefaultIndustryData() {
  return [
    {
      name: '互联网',
      avg_salary: 15000,
      growth_rate: 12,
      employment_rate: 88,
      salary_trend: 'up'
    },
    {
      name: '人工智能',
      avg_salary: 20000,
      growth_rate: 25,
      employment_rate: 92,
      salary_trend: 'up'
    },
    {
      name: '金融',
      avg_salary: 18000,
      growth_rate: 8,
      employment_rate: 85,
      salary_trend: 'stable'
    },
    {
      name: '医疗',
      avg_salary: 12000,
      growth_rate: 10,
      employment_rate: 95,
      salary_trend: 'up'
    },
    {
      name: '教育',
      avg_salary: 8000,
      growth_rate: 5,
      employment_rate: 90,
      salary_trend: 'stable'
    },
    {
      name: '新能源',
      avg_salary: 13000,
      growth_rate: 18,
      employment_rate: 87,
      salary_trend: 'up'
    },
    {
      name: '半导体',
      avg_salary: 16000,
      growth_rate: 20,
      employment_rate: 90,
      salary_trend: 'up'
    },
    {
      name: '制造业',
      avg_salary: 10000,
      growth_rate: 6,
      employment_rate: 82,
      salary_trend: 'stable'
    },
    {
      name: '建筑',
      avg_salary: 9000,
      growth_rate: 3,
      employment_rate: 75,
      salary_trend: 'down'
    },
    {
      name: '软件开发',
      avg_salary: 16000,
      growth_rate: 15,
      employment_rate: 90,
      salary_trend: 'up'
    }
  ];
}

module.exports = {
  analyzeIndustry
};
