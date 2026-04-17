const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { RecommendationEngine } = require('../services/recommendation');

const recommendationEngine = new RecommendationEngine();

router.use(authenticate);

/**
 * @route POST /api/recommendations/generate
 * @desc 生成推荐方案（一键生成）
 * @access Private
 */
router.post('/generate', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { student_id, use_llm = false } = req.body;

    // 参数验证
    if (!student_id) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: '请指定学生ID'
      });
    }

    // 验证学生归属
    const studentCheck = await query(
      'SELECT * FROM students WHERE id = $1 AND user_id = $2',
      [student_id, userId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: '学生信息不存在或无权限访问'
      });
    }

    const student = studentCheck.rows[0];

    // 获取最新成绩
    const scoreResult = await query(
      `SELECT * FROM exam_results 
       WHERE student_id = $1 
       ORDER BY exam_date DESC, year DESC 
       LIMIT 1`,
      [student_id]
    );

    if (scoreResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'SCORE_NOT_FOUND',
        message: '请先录入高考成绩'
      });
    }

    const examResult = scoreResult.rows[0];

    // 获取学生画像
    const profileResult = await query(
      'SELECT * FROM student_profiles WHERE student_id = $1',
      [student_id]
    );

    const studentProfile = profileResult.rows[0] || {
      student_id,
      user_id: userId,
      mbti_type: null,
      holland_code: null,
      subject_strengths: [],
      interest_tags: [],
      ability_tags: [],
      career_preference: null
    };

    // 调用推荐引擎生成方案
    console.log(`[推荐] 为用户${userId}的学生${student_id}生成推荐方案...`);
    const recommendation = await recommendationEngine.generateRecommendation(
      studentProfile,
      examResult
    );

    // 返回结果
    res.status(201).json({
      success: true,
      code: 'RECOMMENDATION_GENERATED',
      message: '推荐方案生成成功',
      data: {
        recommendation_id: recommendation.recommendation_id,
        summary: recommendation.summary,
        冲刺: recommendation.冲刺,
        稳妥: recommendation.稳妥,
        保底: recommendation.保底,
        风险分析: recommendation.风险分析,
        行业分析: recommendation.行业分析,
        参考来源: recommendation.参考来源
      }
    });

  } catch (error) {
    console.error('[推荐错误]', error);
    next(error);
  }
});

/**
 * @route GET /api/recommendations/:id
 * @desc 获取推荐详情
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await query(
      `SELECT r.*, s.name as student_name, s.id as student_id
       FROM recommendations r
       JOIN students s ON s.id = r.student_id
       WHERE r.id = $1 AND s.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: '推荐方案不存在'
      });
    }

    const rec = result.rows[0];

    res.json({
      success: true,
      data: {
        id: rec.id,
        student_id: rec.student_id,
        student_name: rec.student_name,
        recommendation_data: rec.recommendation_data,
        created_at: rec.created_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/recommendations/student/:studentId
 * @desc 获取学生的最新推荐
 * @access Private
 */
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
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: '学生信息不存在'
      });
    }

    // 获取最新推荐
    const result = await query(
      `SELECT * FROM recommendations 
       WHERE student_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        code: 'NO_RECOMMENDATION',
        data: null,
        message: '暂无推荐数据，请先生成推荐方案'
      });
    }

    const rec = result.rows[0];

    res.json({
      success: true,
      data: {
        id: rec.id,
        recommendation_data: rec.recommendation_data,
        created_at: rec.created_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/recommendations
 * @desc 获取用户的推荐历史列表
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      `SELECT r.id, r.student_id, s.name as student_name, 
              r.created_at, r.recommendation_data->>'summary' as summary
       FROM recommendations r
       JOIN students s ON s.id = r.student_id
       WHERE s.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM recommendations r
       JOIN students s ON s.id = r.student_id
       WHERE s.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/recommendations/:id/feedback
 * @desc 提交推荐反馈
 * @access Private
 */
router.post('/:id/feedback', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    // 验证推荐归属
    const checkResult = await query(
      `SELECT r.id FROM recommendations r
       JOIN students s ON s.id = r.student_id
       WHERE r.id = $1 AND s.user_id = $2`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: '推荐方案不存在'
      });
    }

    // 保存反馈
    await query(
      `INSERT INTO recommendation_feedback 
       (recommendation_id, user_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, userId, rating, comment]
    );

    res.json({
      success: true,
      message: '反馈提交成功'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
