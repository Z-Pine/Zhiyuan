/**
 * T050: 位次分层算法测试
 */

const { calculateScoreLevel } = require('../../src/services/recommendation/score-level-algorithm');

describe('位次分层算法测试', () => {
  
  // 模拟录取数据
  const mockAdmissionScores = [
    { school_id: 1, school_name: '北京大学', min_score: 680, min_rank: 500, school_level: '985', is_985: true },
    { school_id: 2, school_name: '清华大学', min_score: 685, min_rank: 400, school_level: '985', is_985: true },
    { school_id: 3, school_name: '复旦大学', min_score: 660, min_rank: 1500, school_level: '985', is_985: true },
    { school_id: 4, school_name: '武汉大学', min_score: 620, min_rank: 5000, school_level: '985', is_985: true },
    { school_id: 5, school_name: '华中科技大学', min_score: 615, min_rank: 6000, school_level: '985', is_985: true },
    { school_id: 6, school_name: '中南大学', min_score: 600, min_rank: 8000, school_level: '985', is_985: true },
    { school_id: 7, school_name: '湖南大学', min_score: 595, min_rank: 9000, school_level: '985', is_985: true },
    { school_id: 8, school_name: '郑州大学', min_score: 580, min_rank: 12000, school_level: '211', is_985: false, is_211: true },
    { school_id: 9, school_name: '南昌大学', min_score: 570, min_rank: 15000, school_level: '211', is_985: false, is_211: true },
    { school_id: 10, school_name: '普通一本', min_score: 550, min_rank: 20000, school_level: '普通', is_985: false, is_211: false }
  ];

  test('高分考生（前1000名）分层测试', async () => {
    const result = await calculateScoreLevel({
      score: 670,
      rank: 800,
      province: '湖北',
      subjectType: 'physics',
      admissionScores: mockAdmissionScores
    });

    // 前1000名应该有冲刺顶尖院校
    expect(result.冲刺.length).toBeGreaterThan(0);
    expect(result.稳妥.length).toBeGreaterThan(0);
    expect(result.保底.length).toBeGreaterThan(0);
    
    // 冲刺应该包含清北
    const sprintSchools = result.details.冲刺.map(s => s.school_name);
    expect(sprintSchools.some(name => name.includes('北京') || name.includes('清华'))).toBeTruthy();
  });

  test('中等分数考生（5000-10000名）分层测试', async () => {
    const result = await calculateScoreLevel({
      score: 610,
      rank: 7000,
      province: '湖北',
      subjectType: 'physics',
      admissionScores: mockAdmissionScores
    });

    // 中等考生应该有合理的分层
    expect(result.冲刺.length).toBeGreaterThanOrEqual(0);
    expect(result.稳妥.length).toBeGreaterThan(0);
    expect(result.保底.length).toBeGreaterThan(0);
    
    // 稳妥应该包含匹配度高的985
    const steadySchools = result.details.稳妥.map(s => s.school_name);
    expect(steadySchools.some(name => name.includes('中南') || name.includes('湖南'))).toBeTruthy();
  });

  test('保底院校数量限制测试', async () => {
    const result = await calculateScoreLevel({
      score: 580,
      rank: 15000,
      province: '湖北',
      subjectType: 'physics',
      admissionScores: mockAdmissionScores
    });

    // 保底院校不应超过15所
    expect(result.保底.length).toBeLessThanOrEqual(15);
  });

  test('空数据异常处理测试', async () => {
    const result = await calculateScoreLevel({
      score: 600,
      rank: 10000,
      province: '湖北',
      subjectType: 'physics',
      admissionScores: []
    });

    // 空数据时应该返回空结果，不抛出异常
    expect(result.冲刺).toEqual([]);
    expect(result.稳妥).toEqual([]);
    expect(result.保底).toEqual([]);
  });

  test('录取概率计算测试', async () => {
    const result = await calculateScoreLevel({
      score: 650,
      rank: 3000,
      province: '湖北',
      subjectType: 'physics',
      admissionScores: mockAdmissionScores
    });

    // 检查概率范围
    const allSchools = [...result.details.冲刺, ...result.details.稳妥, ...result.details.保底];
    allSchools.forEach(school => {
      expect(school.admission_probability).toBeGreaterThanOrEqual(0.05);
      expect(school.admission_probability).toBeLessThanOrEqual(0.95);
    });
  });
});
