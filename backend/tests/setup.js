/**
 * Jest 测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// 全局测试超时
jest.setTimeout(30000);

// 测试前清理
beforeAll(() => {
  console.log('🧪 测试环境初始化完成');
});

// 测试后清理
afterAll(() => {
  console.log('✅ 测试完成');
});
