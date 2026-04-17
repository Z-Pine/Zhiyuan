const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const result = await query(
      'SELECT * FROM students WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/',
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { name, province, city, category, grade } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: '请输入学生姓名' });
      }

      const result = await query(
        `INSERT INTO students (user_id, name, province, city, category, grade, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [userId, name, province || '广东', city, category || '物理类', grade || '高三']
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.id;

    const result = await query(
      'SELECT * FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id',
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const studentId = req.params.id;
      const { name, province, city, category, grade } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (province !== undefined) {
        updates.push(`province = $${paramCount++}`);
        values.push(province);
      }
      if (city !== undefined) {
        updates.push(`city = $${paramCount++}`);
        values.push(city);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramCount++}`);
        values.push(category);
      }
      if (grade !== undefined) {
        updates.push(`grade = $${paramCount++}`);
        values.push(grade);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: '没有需要更新的字段' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(studentId, userId);

      const sql = `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`;
      
      const result = await query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: '学生信息不存在' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.id;

    const result = await query(
      'DELETE FROM students WHERE id = $1 AND user_id = $2 RETURNING id',
      [studentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
