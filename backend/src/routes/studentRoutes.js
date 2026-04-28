const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取学生列表
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

// 创建学生
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, gender, province, city, subject_type, high_school, birth_date } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '请输入学生姓名' });
    }

    const result = await query(
      `INSERT INTO students (user_id, name, gender, province, city, subject_type, high_school, birth_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [userId, name, gender, province || '广东', city, subject_type || 'physics', high_school, birth_date]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 获取学生详情
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

// 更新学生信息
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.id;
    const { name, gender, province, city, subject_type, high_school, birth_date, score, rank, subject_scores } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (province !== undefined) {
      updates.push(`province = $${paramCount++}`);
      values.push(province);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (subject_type !== undefined) {
      updates.push(`subject_type = $${paramCount++}`);
      values.push(subject_type);
    }
    if (high_school !== undefined) {
      updates.push(`high_school = $${paramCount++}`);
      values.push(high_school);
    }
    if (birth_date !== undefined) {
      updates.push(`birth_date = $${paramCount++}`);
      values.push(birth_date);
    }
    if (score !== undefined) {
      updates.push(`score = $${paramCount++}`);
      values.push(score);
    }
    if (rank !== undefined) {
      updates.push(`rank = $${paramCount++}`);
      values.push(rank);
    }
    if (subject_scores !== undefined) {
      updates.push(`subject_scores = $${paramCount++}`);
      values.push(JSON.stringify(subject_scores));
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
});

// 删除学生
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
