const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const result = await query(
      `SELECT u.id, u.phone, u.nickname, u.avatar, u.created_at, u.last_login_at,
              json_agg(json_build_object(
                'id', s.id,
                'name', s.name,
                'province', s.province,
                'city', s.city,
                'category', s.category,
                'grade', s.grade
              ) ORDER BY s.created_at DESC) as students
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/profile',
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { nickname, avatar } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (nickname !== undefined) {
        updates.push(`nickname = $${paramCount++}`);
        values.push(nickname);
      }

      if (avatar !== undefined) {
        updates.push(`avatar = $${paramCount++}`);
        values.push(avatar);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: '没有需要更新的字段' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, phone, nickname, avatar, updated_at`;
      
      const result = await query(sql, values);

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
