const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取学生画像
router.get('/:studentId', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.studentId;

    // 验证学生是否属于当前用户
    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    const result = await query(
      'SELECT * FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 创建或更新学生画像
router.post('/:studentId', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const studentId = req.params.studentId;
    const {
      mbti_type,
      holland_code,
      interests,
      abilities,
      career_preferences,
      study_style,
      risk_preference,
      province_preferences,
      university_type_preferences,
      major_preferences,
      family_expectations
    } = req.body;

    // 验证学生是否属于当前用户
    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    // 检查画像是否已存在
    const existingProfile = await query(
      'SELECT id FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // 更新
      result = await query(
        `UPDATE student_profiles 
         SET mbti_type = $1,
             holland_code = $2,
             interests = $3,
             abilities = $4,
             career_preferences = $5,
             study_style = $6,
             risk_preference = $7,
             province_preferences = $8,
             university_type_preferences = $9,
             major_preferences = $10,
             family_expectations = $11,
             updated_at = NOW()
         WHERE student_id = $12
         RETURNING *`,
        [
          mbti_type,
          holland_code,
          JSON.stringify(interests),
          JSON.stringify(abilities),
          JSON.stringify(career_preferences),
          study_style,
          risk_preference,
          JSON.stringify(province_preferences),
          JSON.stringify(university_type_preferences),
          JSON.stringify(major_preferences),
          family_expectations,
          studentId
        ]
      );
    } else {
      // 创建
      result = await query(
        `INSERT INTO student_profiles (
          student_id, user_id, mbti_type, holland_code, interests, abilities,
          career_preferences, study_style, risk_preference, province_preferences,
          university_type_preferences, major_preferences, family_expectations,
          created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING *`,
        [
          studentId,
          userId,
          mbti_type,
          holland_code,
          JSON.stringify(interests),
          JSON.stringify(abilities),
          JSON.stringify(career_preferences),
          study_style,
          risk_preference,
          JSON.stringify(province_preferences),
          JSON.stringify(university_type_preferences),
          JSON.stringify(major_preferences),
          family_expectations
        ]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
