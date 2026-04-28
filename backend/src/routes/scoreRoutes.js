const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取成绩列表 (支持查询参数)
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { student_id } = req.query;

    let sql = `
      SELECT er.* 
      FROM exam_results er
      JOIN students s ON s.id = er.student_id
      WHERE s.user_id = $1
    `;
    const params = [userId];

    if (student_id) {
      sql += ` AND er.student_id = $2`;
      params.push(student_id);
    }

    sql += ` ORDER BY er.exam_year DESC, er.created_at DESC`;

    const result = await query(sql, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// 获取指定学生的成绩列表
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { studentId } = req.params;

    // 验证学生归属
    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    const result = await query(
      'SELECT * FROM exam_results WHERE student_id = $1 ORDER BY exam_year DESC, created_at DESC',
      [studentId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// 录入成绩
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      student_id,
      exam_year,
      province,
      subject_type,
      total_score,
      rank,
      province_rank,
      chinese_score,
      math_score,
      english_score,
      physics_score,
      chemistry_score,
      biology_score,
      history_score,
      geography_score,
      politics_score,
      exam_date
    } = req.body;

    // 验证必填字段
    if (!student_id || !total_score) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供学生ID和总分' 
      });
    }

    // 验证学生归属
    const studentCheck = await query(
      'SELECT id, province, subject_type FROM students WHERE id = $1 AND user_id = $2',
      [student_id, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生信息不存在' });
    }

    const student = studentCheck.rows[0];

    const result = await query(
      `INSERT INTO exam_results (
        student_id, exam_year, province, subject_type, total_score, 
        rank, province_rank, chinese_score, math_score, english_score,
        physics_score, chemistry_score, biology_score, history_score,
        geography_score, politics_score, exam_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *`,
      [
        student_id,
        exam_year || new Date().getFullYear(),
        province || student.province,
        subject_type || student.subject_type,
        total_score,
        rank,
        province_rank || rank,
        chinese_score,
        math_score,
        english_score,
        physics_score,
        chemistry_score,
        biology_score,
        history_score,
        geography_score,
        politics_score,
        exam_date
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 获取成绩详情
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const scoreId = req.params.id;

    const result = await query(
      `SELECT er.* 
       FROM exam_results er
       JOIN students s ON s.id = er.student_id
       WHERE er.id = $1 AND s.user_id = $2`,
      [scoreId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '成绩信息不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 更新成绩
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const scoreId = req.params.id;
    const {
      exam_year,
      total_score,
      rank,
      province_rank,
      chinese_score,
      math_score,
      english_score,
      physics_score,
      chemistry_score,
      biology_score,
      history_score,
      geography_score,
      politics_score
    } = req.body;

    // 验证成绩归属
    const scoreCheck = await query(
      `SELECT er.id FROM exam_results er 
       JOIN students s ON s.id = er.student_id 
       WHERE er.id = $1 AND s.user_id = $2`,
      [scoreId, userId]
    );

    if (scoreCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: '成绩信息不存在' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (exam_year !== undefined) {
      updates.push(`exam_year = $${paramCount++}`);
      values.push(exam_year);
    }
    if (total_score !== undefined) {
      updates.push(`total_score = $${paramCount++}`);
      values.push(total_score);
    }
    if (rank !== undefined) {
      updates.push(`rank = $${paramCount++}`);
      values.push(rank);
    }
    if (province_rank !== undefined) {
      updates.push(`province_rank = $${paramCount++}`);
      values.push(province_rank);
    }
    if (chinese_score !== undefined) {
      updates.push(`chinese_score = $${paramCount++}`);
      values.push(chinese_score);
    }
    if (math_score !== undefined) {
      updates.push(`math_score = $${paramCount++}`);
      values.push(math_score);
    }
    if (english_score !== undefined) {
      updates.push(`english_score = $${paramCount++}`);
      values.push(english_score);
    }
    if (physics_score !== undefined) {
      updates.push(`physics_score = $${paramCount++}`);
      values.push(physics_score);
    }
    if (chemistry_score !== undefined) {
      updates.push(`chemistry_score = $${paramCount++}`);
      values.push(chemistry_score);
    }
    if (biology_score !== undefined) {
      updates.push(`biology_score = $${paramCount++}`);
      values.push(biology_score);
    }
    if (history_score !== undefined) {
      updates.push(`history_score = $${paramCount++}`);
      values.push(history_score);
    }
    if (geography_score !== undefined) {
      updates.push(`geography_score = $${paramCount++}`);
      values.push(geography_score);
    }
    if (politics_score !== undefined) {
      updates.push(`politics_score = $${paramCount++}`);
      values.push(politics_score);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有需要更新的字段' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(scoreId);

    const sql = `UPDATE exam_results SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(sql, values);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 删除成绩
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const scoreId = req.params.id;

    const result = await query(
      `DELETE FROM exam_results er
       USING students s
       WHERE er.student_id = s.id 
       AND er.id = $1 
       AND s.user_id = $2
       RETURNING er.id`,
      [scoreId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '成绩信息不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
