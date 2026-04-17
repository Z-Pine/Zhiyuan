/**
 * T052: 风险评估算法测试
 */

const { assessRisk } = require('../../src/services/recommendation/risk-assessment');

describe('风险评估算法测试', () => {
  
  // 模拟院校数据
  const mockSchools = [
    { id: 1, name: '北京大学', is_985: true, is_211: true, province: '北京', category: '综合' },
    { id: 2, name: '清华大学', is_985: true, is_211: true, province: '北京', category: '理工' },
    { id: 3, name: '武汉大学', is_985: true, is_211: true, province: '湖北', category: '综合' },
    { id: 4, name: '郑州大学', is_985: false, is_211: true, province: '河南', category: '综合' },
    { id: 5, name: '普通本科', is_985: false, is_211: false, province: '湖南', category: '理工' }
  ];

  // 模拟专业数据
  const mockMajors = [
    { major_id: 1, major_name: '计算机科学与技术', category: '计算机' },
    { major_id: 2, major_name: '法学', category: '法学' },
    { major_id: 3, major_name: '临床医学', category: '临床医学' },
    { major_id: 4, major_name: '工商管理', category: '工商管理' },
    { major_id: 5, major_name: '人工智能', category: '电子信息' }
  ];

  // 模拟数据库连接
  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [] })
  };

  test('985院校风险评估测试', async () => {
    const result = await assessRisk({
      schools: mockSchools.filter(s => s.is_985),
      majors: mockMajors,
      client: mockClient
    });

    // 985院校应该有高风险或中等风险
    const schoolRisks = Object.values(result.schoolRisks);
    const highOrMediumRisks = schoolRisks.filter(r => r.level === 'high' || r.level === 'medium');
    expect(highOrMediumRisks.length).toBeGreaterThan(0);
  });

  test('普通院校风险评估测试', async () => {
    const result = await assessRisk({
      schools: mockSchools.filter(s => !s.is_985 && !s.is_211),
      majors: mockMajors,
      client: mockClient
    });

    // 普通院校风险应该较低
    const schoolRisks = Object.values(result.schoolRisks);
    const lowRisks = schoolRisks.filter(r => r.level === 'low');
    expect(lowRisks.length).toBeGreaterThan(0);
  });

  test('热门地区院校风险测试', async () => {
    const result = await assessRisk({
      schools: mockSchools.filter(s => s.province === '北京'),
      majors: mockMajors,
      client: mockClient
    });

    // 北京地区院校应该有地理位置风险
    const schoolRisks = Object.values(result.schoolRisks);
    schoolRisks.forEach(risk => {
      const locationFactor = risk.factors.find(f => f.type === '地理位置');
      if (locationFactor) {
        expect(locationFactor.level).toBe('medium');
      }
    });
  });

  test('饱和专业风险评估测试', async () => {
    const saturatedMajors = mockMajors.filter(m => 
      m.major_name.includes('法学') || m.major_name.includes('工商管理')
    );

    const result = await assessRisk({
      schools: mockSchools,
      majors: saturatedMajors,
      client: mockClient
    });

    // 饱和专业应该有就业饱和风险
    const majorRisks = Object.values(result.majorRisks);
    majorRisks.forEach(risk => {
      const saturationFactor = risk.factors.find(f => f.type === '就业饱和');
      if (saturationFactor) {
        expect(['medium', 'high']).toContain(saturationFactor.level);
      }
    });
  });

  test('行业风险评估测试', async () => {
    const result = await assessRisk({
      schools: mockSchools,
      majors: mockMajors,
      client: mockClient
    });

    // 应该包含行业风险评估
    expect(Object.keys(result.industryRisks).length).toBeGreaterThan(0);
  });

  test('风险警告生成测试', async () => {
    const result = await assessRisk({
      schools: mockSchools,
      majors: mockMajors,
      client: mockClient
    });

    // 应该生成风险警告
    expect(Array.isArray(result.warnings)).toBeTruthy();
  });

  test('风险建议生成测试', async () => {
    const result = await assessRisk({
      schools: mockSchools,
      majors: mockMajors,
      client: mockClient
    });

    // 应该生成建议
    expect(Array.isArray(result.suggestions)).toBeTruthy();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('总体风险等级计算测试', async () => {
    const result = await assessRisk({
      schools: mockSchools,
      majors: mockMajors,
      client: mockClient
    });

    // 总体风险等级应该是有效的
    expect(['low', 'medium', 'high']).toContain(result.overallRiskLevel);
  });

  test('风险分数范围测试', async () => {
    const result = await assessRisk({
      schools: mockSchools,
      majors: mockMajors,
      client: mockClient
    });

    // 所有风险分数应在0-100之间
    const allRisks = [
      ...Object.values(result.schoolRisks),
      ...Object.values(result.majorRisks)
    ];
    
    allRisks.forEach(risk => {
      expect(risk.score).toBeGreaterThanOrEqual(0);
      expect(risk.score).toBeLessThanOrEqual(100);
    });
  });

  test('空数据处理测试', async () => {
    const result = await assessRisk({
      schools: [],
      majors: [],
      client: mockClient
    });

    // 空数据时不应抛出异常
    expect(result.schoolRisks).toEqual({});
    expect(result.majorRisks).toEqual({});
  });
});
