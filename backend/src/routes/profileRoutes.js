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
      'SELECT * FROM profiles WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, message: '暂无画像数据' });
    }

    const profile = result.rows[0];
    profile.answers = JSON.parse(profile.answers || '{}');

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.post('/',
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { student_id, risk_preference, career_interest, region_preference, answers } = req.body;

      const studentCheck = await query(
        'SELECT id FROM students WHERE id = $1 AND user_id = $2',
        [student_id, userId]
      );

      if (studentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: '学生信息不存在' });
      }

      const existingProfile = await query(
        'SELECT id FROM profiles WHERE student_id = $1',
        [student_id]
      );

      let result;
      if (existingProfile.rows.length > 0) {
        result = await query(
          `UPDATE profiles 
           SET risk_preference = $1, career_interest = $2, region_preference = $3, answers = $4, updated_at = NOW()
           WHERE student_id = $5
           RETURNING *`,
          [risk_preference, career_interest, region_preference, JSON.stringify(answers || {}), student_id]
        );
      } else {
        result = await query(
          `INSERT INTO profiles (student_id, risk_preference, career_interest, region_preference, answers, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING *`,
          [student_id, risk_preference, career_interest, region_preference, JSON.stringify(answers || {})]
        );
      }

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
