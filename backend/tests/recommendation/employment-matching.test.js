/**
 * T051: 就业匹配算法测试
 */

const { matchEmployment } = require('../../src/services/recommendation/employment-matching');

describe('就业匹配算法测试', () => {
  
  // 模拟专业数据
  const mockMajors = [
    { id: 1, name: '计算机科学与技术', category: '计算机', degree_type: '工学学士' },
    { id: 2, name: '软件工程', category: '计算机', degree_type: '工学学士' },
    { id: 3, name: '人工智能', category: '电子信息', degree_type: '工学学士' },
    { id: 4, name: '金融学', category: '经济学', degree_type: '经济学学士' },
    { id: 5, name: '临床医学', category: '临床医学', degree_type: '医学学士' },
    { id: 6, name: '法学', category: '法学', degree_type: '法学学士' },
    { id: 7, name: '汉语言文学', category: '中国语言文学', degree_type: '文学学士' },
    { id: 8, name: '工商管理', category: '工商管理', degree_type: '管理学学士' },
    { id: 9, name: '数学与应用数学', category: '数学', degree_type: '理学学士' },
    { id: 10, name: '建筑学', category: '建筑', degree_type: '工学学士' }
  ];

  // 模拟数据库连接
  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [] })
  };

  test('技术型学生画像匹配测试', async () => {
    const studentProfile = {
      mbti_type: 'INTJ',
      holland_code: 'IRC',
      subject_strengths: ['physics', 'mathematics'],
      interest_tags: ['技术', '逻辑', '编程'],
      ability_tags: ['分析', '解决问题'],
      career_preference: 'high_income'
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 应该匹配到计算机相关专业
    expect(result.length).toBeGreaterThan(0);
    
    const topMatches = result.slice(0, 3).map(m => m.major_name);
    expect(topMatches.some(name => 
      name.includes('计算机') || name.includes('软件') || name.includes('人工智能')
    )).toBeTruthy();
  });

  test('人文型学生画像匹配测试', async () => {
    const studentProfile = {
      mbti_type: 'INFP',
      holland_code: 'AS',
      subject_strengths: ['chinese', 'history'],
      interest_tags: ['写作', '阅读', '文化'],
      ability_tags: ['表达', '理解'],
      career_preference: 'work_life_balance'
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 应该匹配到人文相关专业
    const matchedNames = result.map(m => m.major_name);
    expect(matchedNames.some(name => 
      name.includes('文学') || name.includes('法学')
    )).toBeTruthy();
  });

  test('医学志向学生匹配测试', async () => {
    const studentProfile = {
      mbti_type: 'ISFJ',
      holland_code: 'SI',
      subject_strengths: ['biology', 'chemistry'],
      interest_tags: ['医学', '服务', '生物'],
      ability_tags: ['细心', '耐心'],
      career_preference: 'social_contribution'
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 应该匹配到医学专业
    const matchedNames = result.map(m => m.major_name);
    expect(matchedNames).toContain('临床医学');
  });

  test('匹配分数范围测试', async () => {
    const studentProfile = {
      mbti_type: 'ENTJ',
      holland_code: 'EC',
      subject_strengths: ['mathematics'],
      interest_tags: ['管理', '领导'],
      ability_tags: ['组织', '决策'],
      career_preference: 'leadership'
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 所有匹配分数应在40-100之间
    result.forEach(match => {
      expect(match.match_score).toBeGreaterThanOrEqual(40);
      expect(match.match_score).toBeLessThanOrEqual(100);
    });
  });

  test('匹配理由生成测试', async () => {
    const studentProfile = {
      mbti_type: 'INTP',
      holland_code: 'IR',
      subject_strengths: ['mathematics', 'physics'],
      interest_tags: ['科研', '逻辑'],
      ability_tags: ['分析'],
      career_preference: 'creativity'
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 每个匹配结果应该有匹配理由
    result.forEach(match => {
      expect(match.match_reason).toBeDefined();
      expect(match.match_reason.length).toBeGreaterThan(0);
    });
  });

  test('返回数量限制测试', async () => {
    const studentProfile = {
      mbti_type: 'ESTJ',
      holland_code: 'ECS',
      subject_strengths: [],
      interest_tags: [],
      ability_tags: [],
      career_preference: null
    };

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 返回结果不应超过30个
    expect(result.length).toBeLessThanOrEqual(30);
  });

  test('空画像处理测试', async () => {
    const studentProfile = {};

    const result = await matchEmployment({
      studentProfile,
      majors: mockMajors,
      client: mockClient
    });

    // 空画像时不应抛出异常，返回默认匹配
    expect(Array.isArray(result)).toBeTruthy();
  });
});
