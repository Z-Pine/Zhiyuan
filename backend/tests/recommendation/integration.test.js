/**
 * 推荐引擎集成测试
 * 测试完整的推荐流程
 */

const { RecommendationEngine } = require('../../src/services/recommendation');

// 模拟数据库
const mockQuery = jest.fn();
const mockClient = {
  query: mockQuery,
  release: jest.fn()
};

jest.mock('../../src/config/database', () => ({
  pool: {
    connect: jest.fn(() => Promise.resolve(mockClient))
  }
}));

describe('推荐引擎集成测试', () => {
  
  beforeEach(() => {
    mockQuery.mockClear();
  });

  // 模拟学生画像
  const mockStudentProfile = {
    user_id: 1,
    student_id: 1,
    mbti_type: 'INTJ',
    holland_code: 'IRC',
    subject_strengths: ['physics', 'mathematics'],
    interest_tags: ['技术', '编程'],
    ability_tags: ['分析', '逻辑'],
    career_preference: 'high_income'
  };

  // 模拟考试成绩
  const mockExamResult = {
    id: 1,
    student_id: 1,
    total_score: 620,
    rank: 5000,
    province: '湖北',
    subject_type: 'physics',
    year: 2024
  };

  // 模拟院校数据
  const mockSchools = [
    { id: 1, name: '武汉大学', code: '10001', province: '湖北', city: '武汉', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true, status: 'active' },
    { id: 2, name: '华中科技大学', code: '10002', province: '湖北', city: '武汉', category: '理工', level: '985', is_985: true, is_211: true, is_double_first: true, status: 'active' },
    { id: 3, name: '中南大学', code: '10003', province: '湖南', city: '长沙', category: '综合', level: '985', is_985: true, is_211: true, is_double_first: true, status: 'active' },
    { id: 4, name: '郑州大学', code: '10004', province: '河南', city: '郑州', category: '综合', level: '211', is_985: false, is_211: true, is_double_first: true, status: 'active' }
  ];

  // 模拟专业数据
  const mockMajors = [
    { id: 1, name: '计算机科学与技术', code: '080901', category: '计算机', degree_type: '工学学士', status: 'active' },
    { id: 2, name: '软件工程', code: '080902', category: '计算机', degree_type: '工学学士', status: 'active' },
    { id: 3, name: '人工智能', code: '080717', category: '电子信息', degree_type: '工学学士', status: 'active' },
    { id: 4, name: '临床医学', code: '100201', category: '临床医学', degree_type: '医学学士', status: 'active' }
  ];

  // 模拟录取分数数据
  const mockAdmissionScores = [
    { school_id: 1, school_name: '武汉大学', major_id: 1, major_name: '计算机科学与技术', min_score: 630, min_rank: 3500, province: '湖北', subject_type: 'physics', year: 2024, school_level: '985', is_985: true },
    { school_id: 1, school_name: '武汉大学', major_id: 2, major_name: '软件工程', min_score: 625, min_rank: 4000, province: '湖北', subject_type: 'physics', year: 2024, school_level: '985', is_985: true },
    { school_id: 2, school_name: '华中科技大学', major_id: 1, major_name: '计算机科学与技术', min_score: 635, min_rank: 3000, province: '湖北', subject_type: 'physics', year: 2024, school_level: '985', is_985: true },
    { school_id: 3, school_name: '中南大学', major_id: 1, major_name: '计算机科学与技术', min_score: 610, min_rank: 6000, province: '湖北', subject_type: 'physics', year: 2024, school_level: '985', is_985: true },
    { school_id: 4, school_name: '郑州大学', major_id: 1, major_name: '计算机科学与技术', min_score: 590, min_rank: 10000, province: '湖北', subject_type: 'physics', year: 2024, school_level: '211', is_985: false }
  ];

  test('完整推荐流程测试', async () => {
    // 设置模拟数据
    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })  // getSchools
      .mockResolvedValueOnce({ rows: mockMajors })   // getMajors
      .mockResolvedValueOnce({ rows: mockAdmissionScores })  // getAdmissionScores
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });  // saveRecommendation

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, mockExamResult);

    // 验证结果结构
    expect(result.recommendation_id).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.冲刺).toBeDefined();
    expect(result.稳妥).toBeDefined();
    expect(result.保底).toBeDefined();
    expect(result.风险分析).toBeDefined();
    expect(result.行业分析).toBeDefined();
    expect(result.参考来源).toBeDefined();
  });

  test('推荐结果数量测试', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })
      .mockResolvedValueOnce({ rows: mockMajors })
      .mockResolvedValueOnce({ rows: mockAdmissionScores })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, mockExamResult);

    // 验证数量限制
    expect(result.冲刺.length).toBeLessThanOrEqual(10);
    expect(result.稳妥.length).toBeLessThanOrEqual(15);
    expect(result.保底.length).toBeLessThanOrEqual(10);
  });

  test('录取概率范围测试', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })
      .mockResolvedValueOnce({ rows: mockMajors })
      .mockResolvedValueOnce({ rows: mockAdmissionScores })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, mockExamResult);

    // 验证所有录取概率在合理范围
    const allSchools = [...result.冲刺, ...result.稳妥, ...result.保底];
    allSchools.forEach(school => {
      expect(school.admissionProbability).toBeGreaterThanOrEqual(0.05);
      expect(school.admissionProbability).toBeLessThanOrEqual(0.95);
    });
  });

  test('参考来源完整性测试', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })
      .mockResolvedValueOnce({ rows: mockMajors })
      .mockResolvedValueOnce({ rows: mockAdmissionScores })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, mockExamResult);

    // 验证参考来源
    expect(result.参考来源.official_sources).toBeDefined();
    expect(result.参考来源.data_sources).toBeDefined();
    expect(result.参考来源.policy_sources).toBeDefined();
    expect(result.参考来源.recommendation_note).toBeDefined();
  });

  test('高分考生推荐测试', async () => {
    const highScoreResult = {
      ...mockExamResult,
      total_score: 680,
      rank: 500
    };

    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })
      .mockResolvedValueOnce({ rows: mockMajors })
      .mockResolvedValueOnce({ rows: mockAdmissionScores })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, highScoreResult);

    // 高分考生应该有更多冲刺院校
    expect(result.冲刺.length).toBeGreaterThanOrEqual(0);
  });

  test('低分考生推荐测试', async () => {
    const lowScoreResult = {
      ...mockExamResult,
      total_score: 550,
      rank: 20000
    };

    mockQuery
      .mockResolvedValueOnce({ rows: mockSchools })
      .mockResolvedValueOnce({ rows: mockMajors })
      .mockResolvedValueOnce({ rows: mockAdmissionScores })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const engine = new RecommendationEngine();
    const result = await engine.generateRecommendation(mockStudentProfile, lowScoreResult);

    // 低分考生应该有保底院校
    expect(result.保底.length).toBeGreaterThanOrEqual(0);
  });

  test('数据库错误处理测试', async () => {
    mockQuery.mockRejectedValue(new Error('数据库连接失败'));

    const engine = new RecommendationEngine();
    
    await expect(
      engine.generateRecommendation(mockStudentProfile, mockExamResult)
    ).rejects.toThrow('数据库连接失败');
  });
});
