const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { RecommendationEngine } = require('../services/recommendation');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

/**
 * POST /api/recommendations/generate
 * 生成推荐方案
 */
router.post('/generate', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { student_id, use_llm = false } = req.body;
    const userId = req.user.userId;

    console.log(`🎯 开始为学生 ${student_id} 生成推荐方案...`);

    // 1. 获取学生信息
    const studentResult = await client.query(
      'SELECT * FROM students WHERE id = $1 AND user_id = $2',
      [student_id, userId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    const student = studentResult.rows[0];

    // 2. 检查是否已录入成绩
    if (!student.score || !student.rank) {
      return res.status(400).json({
        success: false,
        message: '请先录入高考成绩'
      });
    }

    // 3. 获取学生画像
    const profileResult = await client.query(
      'SELECT * FROM student_profiles WHERE student_id = $1',
      [student_id]
    );

    const profile = profileResult.rows[0] || {};

    // 4. 构建考试成绩对象
    const examResult = {
      id: student.id,
      total_score: student.score,
      rank: student.rank,
      province: student.province,
      subject_type: student.subject_type,
      subject_scores: student.subject_scores || {}
    };

    // 5. 构建学生画像对象
    const studentProfile = {
      id: student.id,
      user_id: userId,
      name: student.name,
      gender: student.gender,
      province: student.province,
      subject_type: student.subject_type,
      mbti_type: profile.mbti_type,
      interests: profile.interests || [],
      career_preferences: profile.career_preferences || {},
      province_preferences: profile.province_preferences || [],
      university_type_preferences: profile.university_type_preferences || [],
      family_expectations: profile.family_expectations
    };

    // 6. 生成推荐
    const engine = new RecommendationEngine();
    const recommendation = await engine.generateRecommendation(
      studentProfile,
      examResult
    );

    console.log('✅ 推荐方案生成成功');

    res.json({
      success: true,
      message: '推荐方案生成成功',
      data: recommendation
    });

  } catch (error) {
    console.error('❌ 生成推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '生成推荐失败',
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/recommendations/student/:studentId
 * 获取学生的最新推荐
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.userId;

    // 验证学生归属
    const studentCheck = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND user_id = $2',
      [studentId, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    // 获取最新推荐
    const result = await pool.query(`
      SELECT 
        id as recommendation_id,
        recommendation_data,
        created_at
      FROM recommendations
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [studentId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: '暂无推荐记录',
        data: null
      });
    }

    const recommendation = result.rows[0];

    res.json({
      success: true,
      data: {
        recommendation_id: recommendation.recommendation_id,
        ...recommendation.recommendation_data,
        created_at: recommendation.created_at
      }
    });

  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败',
      error: error.message
    });
  }
});

/**
 * GET /api/recommendations
 * 获取推荐历史记录
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取推荐列表
    const result = await pool.query(`
      SELECT 
        r.id,
        r.student_id,
        r.recommendation_data,
        r.created_at,
        s.name as student_name
      FROM recommendations r
      JOIN students s ON r.student_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // 获取总数
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM recommendations WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        recommendations: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取推荐历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐历史失败',
      error: error.message
    });
  }
});

/**
 * POST /api/recommendations/:id/feedback
 * 提交推荐反馈
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    // 验证推荐归属
    const checkResult = await pool.query(
      'SELECT id FROM recommendations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '推荐不存在'
      });
    }

    // 保存反馈
    await pool.query(`
      INSERT INTO recommendation_feedback (
        recommendation_id, user_id, rating, comment, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (recommendation_id) 
      DO UPDATE SET 
        rating = $3,
        comment = $4,
        updated_at = NOW()
    `, [id, userId, rating, comment]);

    res.json({
      success: true,
      message: '反馈提交成功'
    });

  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '提交反馈失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/recommendations/:id
 * 删除推荐记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM recommendations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '推荐不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '删除推荐失败',
      error: error.message
    });
  }
});

module.exports = router;
