/**
 * 短信服务
 * 支持模拟模式和真实短信服务
 * 开发/测试环境使用模拟模式，生产环境使用真实短信服务
 */

const { query } = require('../config/database');

// 短信服务配置
const SMS_CONFIG = {
  // 短信服务提供商: 'mock' | 'aliyun' | 'tencent'
  provider: process.env.SMS_PROVIDER || 'mock',
  
  // 模拟模式配置
  mock: {
    // 固定验证码（测试用）
    fixedCode: process.env.SMS_MOCK_FIXED_CODE || null,
    // 是否在控制台打印验证码
    printToConsole: true,
    // 模拟发送延迟（毫秒）
    delay: 500
  },
  
  // 阿里云配置
  aliyun: {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID,
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
    signName: process.env.SMS_SIGN_NAME,
    templateCode: process.env.SMS_TEMPLATE_CODE
  },
  
  // 腾讯云配置
  tencent: {
    secretId: process.env.SMS_SECRET_ID,
    secretKey: process.env.SMS_SECRET_KEY,
    sdkAppId: process.env.SMS_SDK_APP_ID,
    signName: process.env.SMS_SIGN_NAME,
    templateId: process.env.SMS_TEMPLATE_ID
  }
};

/**
 * 生成验证码
 * @returns {string} 6位数字验证码
 */
function generateCode() {
  // 如果有固定验证码，使用固定值
  if (SMS_CONFIG.mock.fixedCode) {
    return SMS_CONFIG.mock.fixedCode;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 模拟发送短信
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function mockSendSMS(phone, code) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, SMS_CONFIG.mock.delay));
  
  // 在控制台打印验证码（便于测试）
  if (SMS_CONFIG.mock.printToConsole) {
    console.log('\n');
    console.log('='.repeat(50));
    console.log('📱 【模拟短信服务】');
    console.log('='.repeat(50));
    console.log(`   手机号: ${phone}`);
    console.log(`   验证码: ${code}`);
    console.log(`   有效期: 5分钟`);
    console.log('='.repeat(50));
    console.log('\n');
  }
  
  return {
    success: true,
    message: '验证码发送成功（模拟）',
    provider: 'mock',
    debug: {
      phone,
      code,
      mode: 'simulation'
    }
  };
}

/**
 * 阿里云短信发送
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function aliyunSendSMS(phone, code) {
  // 这里接入阿里云SDK
  // 需要安装 @alicloud/sms-sdk
  try {
    const SMSClient = require('@alicloud/sms-sdk');
    
    const smsClient = new SMSClient({
      accessKeyId: SMS_CONFIG.aliyun.accessKeyId,
      secretAccessKey: SMS_CONFIG.aliyun.accessKeySecret
    });
    
    const result = await smsClient.sendSMS({
      PhoneNumbers: phone,
      SignName: SMS_CONFIG.aliyun.signName,
      TemplateCode: SMS_CONFIG.aliyun.templateCode,
      TemplateParam: JSON.stringify({ code })
    });
    
    if (result.Code === 'OK') {
      return {
        success: true,
        message: '验证码发送成功',
        provider: 'aliyun',
        requestId: result.RequestId
      };
    } else {
      throw new Error(result.Message);
    }
  } catch (error) {
    console.error('阿里云短信发送失败:', error);
    throw error;
  }
}

/**
 * 腾讯云短信发送
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function tencentSendSMS(phone, code) {
  // 这里接入腾讯云SDK
  // 需要安装 tencentcloud-sdk-nodejs
  try {
    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const SmsClient = tencentcloud.sms.v20210111.Client;
    
    const client = new SmsClient({
      credential: {
        secretId: SMS_CONFIG.tencent.secretId,
        secretKey: SMS_CONFIG.tencent.secretKey
      },
      region: 'ap-guangzhou',
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: {
          reqMethod: 'POST',
          reqTimeout: 30
        }
      }
    });
    
    const result = await client.SendSms({
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: SMS_CONFIG.tencent.sdkAppId,
      SignName: SMS_CONFIG.tencent.signName,
      TemplateId: SMS_CONFIG.tencent.templateId,
      TemplateParamSet: [code]
    });
    
    if (result.SendStatusSet[0].Code === 'Ok') {
      return {
        success: true,
        message: '验证码发送成功',
        provider: 'tencent',
        requestId: result.RequestId
      };
    } else {
      throw new Error(result.SendStatusSet[0].Message);
    }
  } catch (error) {
    console.error('腾讯云短信发送失败:', error);
    throw error;
  }
}

/**
 * 发送验证码短信
 * @param {string} phone - 手机号
 * @returns {Promise<{success: boolean, code: string, message: string}>}
 */
async function sendVerificationCode(phone) {
  try {
    // 检查发送频率限制
    const recentSent = await query(
      `SELECT COUNT(*) as count 
       FROM verification_codes 
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 minutes'`,
      [phone]
    );
    
    if (recentSent.rows[0].count > 0) {
      return {
        success: false,
        message: '发送过于频繁，请稍后再试',
        code: null
      };
    }
    
    // 生成验证码
    const code = generateCode();
    
    // 保存验证码到数据库
    await query(
      `INSERT INTO verification_codes (phone, code, expires_at, created_at) 
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW())`,
      [phone, code]
    );
    
    // 根据配置选择发送方式
    let sendResult;
    switch (SMS_CONFIG.provider) {
      case 'aliyun':
        sendResult = await aliyunSendSMS(phone, code);
        break;
      case 'tencent':
        sendResult = await tencentSendSMS(phone, code);
        break;
      case 'mock':
      default:
        sendResult = await mockSendSMS(phone, code);
        break;
    }
    
    return {
      success: true,
      code: SMS_CONFIG.provider === 'mock' ? code : null,
      message: sendResult.message,
      provider: SMS_CONFIG.provider,
      debug: sendResult.debug
    };
    
  } catch (error) {
    console.error('发送验证码失败:', error);
    return {
      success: false,
      message: '验证码发送失败，请稍后重试',
      code: null
    };
  }
}

/**
 * 验证验证码
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<boolean>}
 */
async function verifyCode(phone, code) {
  try {
    const result = await query(
      `SELECT * FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('验证验证码失败:', error);
    return false;
  }
}

/**
 * 删除已使用的验证码
 * @param {string} phone - 手机号
 */
async function deleteCode(phone) {
  try {
    await query('DELETE FROM verification_codes WHERE phone = $1', [phone]);
  } catch (error) {
    console.error('删除验证码失败:', error);
  }
}

module.exports = {
  sendVerificationCode,
  verifyCode,
  deleteCode,
  generateCode,
  SMS_CONFIG
};
