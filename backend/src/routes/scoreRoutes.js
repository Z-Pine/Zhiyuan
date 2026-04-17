const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/student/:studentId', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { studentId } = req.params;

    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    const result = await query(
      'SELECT * FROM scores WHERE student_id = $1 ORDER BY year DESC, created_at DESC',
      [studentId]
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
      const { student_id, year, total_score, rank, province_rank, subject_scores } = req.body;

      const studentCheck = await query(
        'SELECT id FROM students WHERE id = $1 AND user_id = $2',
        [student_id, userId]
      );

      if (studentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: '学生信息不存在' });
      }

      const result = await query(
        `INSERT INTO scores (student_id, year, total_score, rank, province_rank, subject_scores, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [student_id, year || 2024, total_score, rank, province_rank, JSON.stringify(subject_scores || {})]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const scoreId = req.params.id;
      const { year, total_score, rank, province_rank, subject_scores } = req.body;

      const scoreCheck = await query(
        `SELECT s.id FROM scores s 
         JOIN students st ON st.id = s.student_id 
         WHERE s.id = $1 AND st.user_id = $2`,
        [scoreId, userId]
      );

      if (scoreCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: '成绩信息不存在' });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (year !== undefined) { updates.push(`year = $${paramCount++}`); values.push(year); }
      if (total_score !== undefined) { updates.push(`total_score = $${paramCount++}`); values.push(total_score); }
      if (rank !== undefined) { updates.push(`rank = $${paramCount++}`); values.push(rank); }
      if (province_rank !== undefined) { updates.push(`province_rank = $${paramCount++}`); values.push(province_rank); }
      if (subject_scores !== undefined) { updates.push(`subject_scores = $${paramCount++}`); values.push(JSON.stringify(subject_scores)); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: '没有需要更新的字段' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(scoreId);

      const sql = `UPDATE scores SET ${updates.join(', ')} WHERE id = $${paramCount++} RETURNING *`;
      
      const result = await query(sql, values);

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
