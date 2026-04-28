const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAddStudent() {
  try {
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phone: '13800138000',
      password: '123456'
    });

    if (!loginResponse.data.success) {
      console.error('登录失败:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.access_token;
    if (!token) {
      console.error('未获取到token');
      console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...');

    console.log('\n2. 添加学生...');
    const addStudentResponse = await axios.post(
      `${BASE_URL}/students`,
      {
        name: '测试学生-' + Date.now(),
        gender: 'male',
        province: '广东',
        city: '深圳',
        subject_type: 'physics',
        high_school: '深圳中学'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('添加学生响应:', JSON.stringify(addStudentResponse.data, null, 2));

    if (addStudentResponse.data.success) {
      console.log('✅ 学生添加成功！');
      console.log('学生ID:', addStudentResponse.data.data.id);
      console.log('学生姓名:', addStudentResponse.data.data.name);
    } else {
      console.log('❌ 学生添加失败:', addStudentResponse.data.message);
    }

    console.log('\n3. 查询学生列表...');
    const listResponse = await axios.get(`${BASE_URL}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('学生列表数量:', listResponse.data.data.length);
    console.log('最新的3个学生:');
    listResponse.data.data.slice(0, 3).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (ID: ${student.id})`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAddStudent();
