/**
 * API测试脚本
 * 测试所有主要API端点
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let studentId = '';
let scoreId = '';

// 测试结果统计
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试辅助函数
async function test(name, fn) {
  try {
    console.log(`\n🧪 测试: ${name}`);
    await fn();
    console.log(`✅ 通过: ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`❌ 失败: ${name}`);
    console.log(`   错误: ${error.message}`);
    if (error.response) {
      console.log(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

// ============================================
// 1. 健康检查测试
// ============================================
async function testHealth() {
  await test('健康检查 - GET /health', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status !== 'ok') {
      throw new Error('健康检查失败');
    }
    console.log(`   响应: ${JSON.stringify(response.data)}`);
  });

  await test('API健康检查 - GET /api/health', async () => {
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.status !== 'ok') {
      throw new Error('API健康检查失败');
    }
    console.log(`   响应: ${JSON.stringify(response.data)}`);
  });
}

// ============================================
// 2. 认证模块测试
// ============================================
async function testAuth() {
  // 测试发送验证码
  await test('发送验证码 - POST /api/auth/send-code', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/send-code`, {
      phone: '13800138000'
    });
    if (!response.data.success) {
      throw new Error('发送验证码失败');
    }
    console.log(`   验证码: ${response.data.debugCode || '(模拟模式)'}`);
  });

  // 测试登录
  await test('用户登录 - POST /api/auth/login', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone: '13800138000',
      password: '123456'
    });
    if (!response.data.success || !response.data.data.access_token) {
      throw new Error('登录失败');
    }
    authToken = response.data.data.access_token;
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   用户ID: ${response.data.data.user.id}`);
  });

  // 测试错误密码
  await test('错误密码登录 - POST /api/auth/login (应该失败)', async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        phone: '13800138000',
        password: 'wrongpassword'
      });
      throw new Error('应该返回错误但成功了');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`   正确返回401错误`);
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 3. 学生管理测试
// ============================================
async function testStudents() {
  const headers = { Authorization: `Bearer ${authToken}` };

  // 创建学生
  await test('创建学生 - POST /api/students', async () => {
    const response = await axios.post(`${BASE_URL}/api/students`, {
      name: '测试学生',
      gender: 'male',
      province: '广东',
      subject_type: 'physics'
    }, { headers });
    
    if (!response.data.success) {
      throw new Error('创建学生失败');
    }
    studentId = response.data.data.id;
    console.log(`   学生ID: ${studentId}`);
  });

  // 获取学生列表
  await test('获取学生列表 - GET /api/students', async () => {
    const response = await axios.get(`${BASE_URL}/api/students`, { headers });
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('获取学生列表失败');
    }
    console.log(`   学生数量: ${response.data.data.length}`);
  });

  // 获取学生详情
  await test('获取学生详情 - GET /api/students/:id', async () => {
    const response = await axios.get(`${BASE_URL}/api/students/${studentId}`, { headers });
    if (!response.data.success) {
      throw new Error('获取学生详情失败');
    }
    console.log(`   学生姓名: ${response.data.data.name}`);
  });

  // 更新学生信息
  await test('更新学生信息 - PUT /api/students/:id', async () => {
    const response = await axios.put(`${BASE_URL}/api/students/${studentId}`, {
      name: '测试学生(已更新)',
      city: '广州'
    }, { headers });
    if (!response.data.success) {
      throw new Error('更新学生信息失败');
    }
    console.log(`   更新成功`);
  });
}

// ============================================
// 4. 成绩管理测试
// ============================================
async function testScores() {
  const headers = { Authorization: `Bearer ${authToken}` };

  // 录入成绩
  await test('录入成绩 - POST /api/scores', async () => {
    const response = await axios.post(`${BASE_URL}/api/scores`, {
      student_id: studentId,
      exam_year: 2024,
      province: '广东',
      subject_type: 'physics',
      total_score: 620,
      rank: 15000,
      chinese_score: 120,
      math_score: 135,
      english_score: 130,
      physics_score: 90,
      chemistry_score: 85,
      biology_score: 60
    }, { headers });
    
    if (!response.data.success) {
      throw new Error('录入成绩失败');
    }
    scoreId = response.data.data.id;
    console.log(`   成绩ID: ${scoreId}`);
    console.log(`   总分: ${response.data.data.total_score}`);
  });

  // 获取成绩列表
  await test('获取成绩列表 - GET /api/scores', async () => {
    const response = await axios.get(`${BASE_URL}/api/scores?student_id=${studentId}`, { headers });
    if (!response.data.success) {
      throw new Error('获取成绩列表失败');
    }
    console.log(`   成绩记录数: ${response.data.data.length}`);
  });
}

// ============================================
// 5. 学生画像测试
// ============================================
async function testProfiles() {
  const headers = { Authorization: `Bearer ${authToken}` };

  // 创建/更新画像
  await test('更新学生画像 - PUT /api/profiles/:studentId', async () => {
    const response = await axios.put(`${BASE_URL}/api/profiles/${studentId}`, {
      mbti_type: 'INTJ',
      holland_code: 'RIA',
      interests: ['计算机', '人工智能', '数据分析'],
      career_preferences: ['软件工程师', '数据科学家'],
      risk_preference: 'moderate'
    }, { headers });
    
    if (!response.data.success) {
      throw new Error('更新学生画像失败');
    }
    console.log(`   MBTI: ${response.data.data.mbti_type}`);
  });

  // 获取画像
  await test('获取学生画像 - GET /api/profiles/:studentId', async () => {
    const response = await axios.get(`${BASE_URL}/api/profiles/${studentId}`, { headers });
    if (!response.data.success) {
      throw new Error('获取学生画像失败');
    }
    console.log(`   霍兰德代码: ${response.data.data.holland_code}`);
  });
}

// ============================================
// 6. 院校/专业查询测试
// ============================================
async function testSchoolsAndMajors() {
  // 获取院校列表
  await test('获取院校列表 - GET /api/schools', async () => {
    const response = await axios.get(`${BASE_URL}/api/schools?province=广东&limit=5`);
    if (!response.data.success) {
      throw new Error('获取院校列表失败');
    }
    console.log(`   院校数量: ${response.data.data.list.length}`);
    if (response.data.data.list.length > 0) {
      console.log(`   第一所: ${response.data.data.list[0].name}`);
    }
  });

  // 获取专业列表
  await test('获取专业列表 - GET /api/majors', async () => {
    const response = await axios.get(`${BASE_URL}/api/majors?category=工学&limit=5`);
    if (!response.data.success) {
      throw new Error('获取专业列表失败');
    }
    console.log(`   专业数量: ${response.data.data.list.length}`);
    if (response.data.data.list.length > 0) {
      console.log(`   第一个: ${response.data.data.list[0].name}`);
    }
  });
}

// ============================================
// 7. 推荐系统测试
// ============================================
async function testRecommendations() {
  const headers = { Authorization: `Bearer ${authToken}` };

  // 生成推荐
  await test('生成推荐方案 - POST /api/recommendations/generate', async () => {
    const response = await axios.post(`${BASE_URL}/api/recommendations/generate`, {
      student_id: studentId
    }, { headers });
    
    if (!response.data.success) {
      throw new Error('生成推荐方案失败');
    }
    console.log(`   推荐ID: ${response.data.data.recommendation_id}`);
    console.log(`   冲刺院校数: ${response.data.data.冲刺?.length || 0}`);
    console.log(`   稳妥院校数: ${response.data.data.稳妥?.length || 0}`);
    console.log(`   保底院校数: ${response.data.data.保底?.length || 0}`);
  });

  // 获取学生推荐
  await test('获取学生推荐 - GET /api/recommendations/student/:studentId', async () => {
    const response = await axios.get(`${BASE_URL}/api/recommendations/student/${studentId}`, { headers });
    if (!response.data.success) {
      throw new Error('获取学生推荐失败');
    }
    console.log(`   有推荐数据: ${response.data.data ? '是' : '否'}`);
  });
}

// ============================================
// 主测试流程
// ============================================
async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 开始API测试');
  console.log('='.repeat(60));

  try {
    console.log('\n📋 1. 健康检查测试');
    console.log('-'.repeat(60));
    await testHealth();

    console.log('\n🔐 2. 认证模块测试');
    console.log('-'.repeat(60));
    await testAuth();

    console.log('\n👨‍🎓 3. 学生管理测试');
    console.log('-'.repeat(60));
    await testStudents();

    console.log('\n📊 4. 成绩管理测试');
    console.log('-'.repeat(60));
    await testScores();

    console.log('\n🎨 5. 学生画像测试');
    console.log('-'.repeat(60));
    await testProfiles();

    console.log('\n🏫 6. 院校/专业查询测试');
    console.log('-'.repeat(60));
    await testSchoolsAndMajors();

    console.log('\n🎯 7. 推荐系统测试');
    console.log('-'.repeat(60));
    await testRecommendations();

  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
  }

  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`📈 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n详细结果:');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'passed' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
    if (test.error) {
      console.log(`   错误: ${test.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 测试完成！');
  console.log('='.repeat(60));
}

// 运行测试
runTests().catch(console.error);
