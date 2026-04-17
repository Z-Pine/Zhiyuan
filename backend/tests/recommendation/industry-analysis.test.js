/**
 * T053: 行业分析算法测试
 */

const { analyzeIndustry } = require('../../src/services/recommendation/industry-analysis');

describe('行业分析算法测试', () => {
  
  // 模拟匹配的专业
  const mockMatchedMajors = [
    { major_id: 1, major_name: '计算机科学与技术', match_score: 85 },
    { major_id: 2, major_name: '软件工程', match_score: 82 },
    { major_id: 3, major_name: '人工智能', match_score: 90 },
    { major_id: 4, major_name: '金融学', match_score: 75 },
    { major_id: 5, major_name: '临床医学', match_score: 70 }
  ];

  // 模拟数据库连接
  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [] })
  };

  test('行业分析结果结构测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 结果应该包含必要的字段
    expect(result.industries).toBeDefined();
    expect(result.overall).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.majorIndustryMap).toBeDefined();
  });

  test('整体指标计算测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 整体指标应该包含
    expect(result.overall.avgSalary).toBeDefined();
    expect(result.overall.avgGrowth).toBeDefined();
    expect(result.overall.avgEmploymentRate).toBeDefined();
    expect(result.overall.trendDirection).toBeDefined();
  });

  test('行业推荐生成测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 应该生成推荐
    expect(result.recommendations.length).toBeGreaterThan(0);
    
    // 推荐应该包含类型和理由
    result.recommendations.forEach(rec => {
      expect(rec.type).toBeDefined();
      expect(rec.reason).toBeDefined();
    });
  });

  test('专业-行业映射测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 每个专业应该有行业映射
    mockMatchedMajors.forEach(major => {
      const mapping = result.majorIndustryMap[major.major_name];
      expect(mapping).toBeDefined();
      expect(mapping.industries).toBeDefined();
    });
  });

  test('计算机相关专业行业推断测试', async () => {
    const csMajors = mockMatchedMajors.filter(m => 
      m.major_name.includes('计算机') || m.major_name.includes('软件') || m.major_name.includes('人工智能')
    );

    const result = await analyzeIndustry({
      matchedMajors: csMajors,
      client: mockClient
    });

    // 应该包含互联网行业
    const industryNames = Object.keys(result.industries);
    expect(industryNames.some(name => 
      name.includes('互联网') || name.includes('软件')
    )).toBeTruthy();
  });

  test('医学专业行业推断测试', async () => {
    const medicalMajors = mockMatchedMajors.filter(m => 
      m.major_name.includes('医学') || m.major_name.includes('临床')
    );

    const result = await analyzeIndustry({
      matchedMajors: medicalMajors,
      client: mockClient
    });

    // 应该包含医疗行业
    const industryNames = Object.keys(result.industries);
    expect(industryNames.some(name => name.includes('医疗'))).toBeTruthy();
  });

  test('行业评分计算测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 每个行业应该有评分
    Object.values(result.industries).forEach(industry => {
      expect(industry.score).toBeDefined();
      expect(industry.score).toBeGreaterThanOrEqual(0);
      expect(industry.score).toBeLessThanOrEqual(100);
    });
  });

  test('薪资数据完整性测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 每个行业应该有薪资数据
    Object.values(result.industries).forEach(industry => {
      expect(industry.salary).toBeDefined();
      expect(industry.salary.current).toBeGreaterThan(0);
      expect(industry.salary.entry).toBeGreaterThan(0);
      expect(industry.salary.senior).toBeGreaterThan(0);
    });
  });

  test('增长率数据测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 每个行业应该有增长率数据
    Object.values(result.industries).forEach(industry => {
      expect(industry.growth).toBeDefined();
      expect(industry.growth.rate).toBeDefined();
      expect(industry.growth.trend).toBeDefined();
    });
  });

  test('就业率数据测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: mockMatchedMajors,
      client: mockClient
    });

    // 每个行业应该有就业率数据
    Object.values(result.industries).forEach(industry => {
      expect(industry.employment).toBeDefined();
      expect(industry.employment.rate).toBeGreaterThan(0);
      expect(industry.employment.rate).toBeLessThanOrEqual(100);
    });
  });

  test('空专业列表处理测试', async () => {
    const result = await analyzeIndustry({
      matchedMajors: [],
      client: mockClient
    });

    // 空列表时不应抛出异常
    expect(result.industries).toEqual({});
    expect(result.recommendations).toEqual([]);
  });
});
