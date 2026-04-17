const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const SALT_ROUNDS = 10;

router.post('/register',
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('请输入正确的验证码'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, password, code } = req.body;

      const codeResult = await query(
        'SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [phone, code]
      );

      if (codeResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: '验证码错误或已过期' });
      }

      const existingUser = await query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ success: false, message: '该手机号已注册' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await query(
        'INSERT INTO users (phone, password, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, phone, created_at',
        [phone, hashedPassword]
      );

      const user = result.rows[0];
      
      // 生成access token和refresh token
      const accessToken = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      await query('DELETE FROM verification_codes WHERE phone = $1', [phone]);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: { 
          user, 
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 7200
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/login',
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
  body('password').notEmpty().withMessage('请输入密码'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, password } = req.body;

      const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: '手机号或密码错误' });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: '手机号或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const { password: _, ...userInfo } = user;

      // 生成access token和refresh token
      const accessToken = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: { 
          user: userInfo, 
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 7200
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/send-code',
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone } = req.body;

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await query(
        'INSERT INTO verification_codes (phone, code, expires_at, created_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\', NOW())',
        [phone, code]
      );

      console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}`);

      res.json({
        success: true,
        message: '验证码已发送',
        debugCode: process.env.NODE_ENV === 'development' ? code : undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/reset-password',
  body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('请输入正确的验证码'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, password, code } = req.body;

      const codeResult = await query(
        'SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [phone, code]
      );

      if (codeResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: '验证码错误或已过期' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      await query('UPDATE users SET password = $1, updated_at = NOW() WHERE phone = $2', [hashedPassword, phone]);
      await query('DELETE FROM verification_codes WHERE phone = $1', [phone]);

      res.json({ success: true, message: '密码重置成功' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * T033: Token刷新机制
 * 使用refresh token获取新的access token
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REFRESH_TOKEN',
        message: '请提供刷新令牌'
      });
    }

    // 验证refresh token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: '刷新令牌无效或已过期'
      });
    }

    // 检查用户是否存在
    const userResult = await query(
      'SELECT id, phone, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    const user = userResult.rows[0];

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        code: 'USER_DISABLED',
        message: '账号已被禁用'
      });
    }

    // 生成新的token pair
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      code: 'TOKEN_REFRESHED',
      message: '令牌刷新成功',
      data: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 7200 // 2小时
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 登出 - 使token失效
 */
router.post('/logout', async (req, res, next) => {
  try {
    // 在实际生产环境中，这里应该将token加入黑名单
    // 或者使用Redis等缓存存储已失效的token
    
    res.json({
      success: true,
      code: 'LOGOUT_SUCCESS',
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
