/**
 * T056: 追问对话API
 * 智能问答交互 - 支持用户就推荐结果进行追问
 */

const express = require('express');
const router = express.Router();
const { authenticate: authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * @route POST /api/chat/start
 * @desc 开始新的对话会话
 * @access Private
 */
router.post('/start', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { student_id, recommendation_id, initial_question } = req.body;

    // 参数验证
    if (!student_id || !recommendation_id) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: '请提供学生ID和推荐方案ID'
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

    // 验证推荐方案
    const recommendationCheck = await query(
      'SELECT * FROM recommendations WHERE id = $1 AND student_id = $2',
      [recommendation_id, student_id]
    );

    if (recommendationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'RECOMMENDATION_NOT_FOUND',
        message: '推荐方案不存在'
      });
    }

    // 创建对话会话
    const sessionResult = await query(
      `INSERT INTO chat_sessions 
       (user_id, student_id, recommendation_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'active', NOW(), NOW())
       RETURNING *`,
      [userId, student_id, recommendation_id]
    );

    const session = sessionResult.rows[0];

    // 如果有初始问题，生成第一条回复
    let firstResponse = null;
    if (initial_question) {
      firstResponse = await generateAIResponse(
        session.id,
        recommendation_id,
        initial_question,
        userId
      );
    }

    res.status(201).json({
      success: true,
      code: 'CHAT_SESSION_CREATED',
      message: '对话会话创建成功',
      data: {
        session_id: session.id,
        status: session.status,
        created_at: session.created_at,
        first_message: firstResponse
      }
    });

  } catch (error) {
    console.error('[对话错误]', error);
    next(error);
  }
});

/**
 * @route POST /api/chat/:sessionId/message
 * @desc 发送消息并获取AI回复
 * @access Private
 */
router.post('/:sessionId/message', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;
    const { message, message_type = 'text' } = req.body;

    // 参数验证
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_MESSAGE',
        message: '消息内容不能为空'
      });
    }

    // 验证会话归属
    const sessionCheck = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2 AND status = $3',
      [sessionId, userId, 'active']
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: '对话会话不存在或已结束'
      });
    }

    const session = sessionCheck.rows[0];

    // 保存用户消息
    await query(
      `INSERT INTO chat_messages 
       (session_id, role, content, message_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, 'user', message.trim(), message_type]
    );

    // 更新会话时间
    await query(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
      [sessionId]
    );

    // 生成AI回复
    const aiResponse = await generateAIResponse(
      sessionId,
      session.recommendation_id,
      message.trim(),
      userId
    );

    res.json({
      success: true,
      code: 'MESSAGE_SENT',
      message: '消息发送成功',
      data: {
        user_message: {
          role: 'user',
          content: message.trim(),
          timestamp: new Date().toISOString()
        },
        ai_response: aiResponse
      }
    });

  } catch (error) {
    console.error('[对话错误]', error);
    next(error);
  }
});

/**
 * @route GET /api/chat/:sessionId/history
 * @desc 获取对话历史记录
 * @access Private
 */
router.get('/:sessionId/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 验证会话归属
    const sessionCheck = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: '对话会话不存在'
      });
    }

    // 获取消息历史
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const messagesResult = await query(
      `SELECT 
        id, role, content, message_type, 
        created_at, metadata
       FROM chat_messages 
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, parseInt(limit), offset]
    );

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) FROM chat_messages WHERE session_id = $1',
      [sessionId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      code: 'CHAT_HISTORY_RETRIEVED',
      message: '对话历史获取成功',
      data: {
        messages: messagesResult.rows.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          message_type: msg.message_type,
          timestamp: msg.created_at,
          metadata: msg.metadata
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('[对话错误]', error);
    next(error);
  }
});

/**
 * @route POST /api/chat/:sessionId/end
 * @desc 结束对话会话
 * @access Private
 */
router.post('/:sessionId/end', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    // 验证会话归属
    const sessionCheck = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: '对话会话不存在'
      });
    }

    // 结束会话
    await query(
      `UPDATE chat_sessions 
       SET status = 'ended', ended_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    res.json({
      success: true,
      code: 'CHAT_SESSION_ENDED',
      message: '对话会话已结束'
    });

  } catch (error) {
    console.error('[对话错误]', error);
    next(error);
  }
});

/**
 * @route GET /api/chat/sessions
 * @desc 获取用户的对话会话列表
 * @access Private
 */
router.get('/sessions', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT 
        cs.id, cs.student_id, cs.recommendation_id,
        cs.status, cs.created_at, cs.updated_at, cs.ended_at,
        s.name as student_name,
        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count
      FROM chat_sessions cs
      JOIN students s ON cs.student_id = s.id
      WHERE cs.user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      sql += ` AND cs.status = $2`;
      params.push(status);
    }
    
    sql += ` ORDER BY cs.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const sessionsResult = await query(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1';
    const countParams = [userId];
    
    if (status) {
      countSql += ' AND status = $2';
      countParams.push(status);
    }
    
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      code: 'SESSIONS_RETRIEVED',
      message: '会话列表获取成功',
      data: {
        sessions: sessionsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('[对话错误]', error);
    next(error);
  }
});

/**
 * 生成AI回复
 * @param {number} sessionId - 会话ID
 * @param {number} recommendationId - 推荐方案ID
 * @param {string} userMessage - 用户消息
 * @param {number} userId - 用户ID
 * @returns {Object} AI回复
 */
async function generateAIResponse(sessionId, recommendationId, userMessage, userId) {
  try {
    // 1. 获取推荐方案详情
    const recommendationResult = await query(
      `SELECT * FROM recommendations WHERE id = $1`,
      [recommendationId]
    );

    const recommendation = recommendationResult.rows[0];
    const recommendationData = recommendation ? JSON.parse(recommendation.recommendation_data) : {};

    // 2. 获取对话历史（最近10条）
    const historyResult = await query(
      `SELECT role, content FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [sessionId]
    );

    const history = historyResult.rows.reverse();

    // 3. 构建AI提示词
    const systemPrompt = buildSystemPrompt(recommendationData);
    
    // 4. 调用AI服务（这里使用模拟响应，实际可接入OpenAI/文心一言等）
    const aiContent = await callAIService(systemPrompt, history, userMessage);

    // 5. 保存AI回复
    const messageResult = await query(
      `INSERT INTO chat_messages 
       (session_id, role, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        sessionId,
        'assistant',
        aiContent.text,
        'text',
        JSON.stringify({
          suggested_questions: aiContent.suggestedQuestions || [],
          related_schools: aiContent.relatedSchools || [],
          confidence: aiContent.confidence || 0.9
        })
      ]
    );

    return {
      id: messageResult.rows[0].id,
      role: 'assistant',
      content: aiContent.text,
      message_type: 'text',
      timestamp: messageResult.rows[0].created_at,
      suggested_questions: aiContent.suggestedQuestions || [],
      related_schools: aiContent.relatedSchools || [],
      confidence: aiContent.confidence || 0.9
    };

  } catch (error) {
    console.error('[AI生成错误]', error);
    
    // 返回友好的错误回复
    const fallbackContent = '抱歉，我暂时无法回答这个问题。请稍后再试，或者换个方式提问。';
    
    const messageResult = await query(
      `INSERT INTO chat_messages 
       (session_id, role, content, message_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [sessionId, 'assistant', fallbackContent, 'text']
    );

    return {
      id: messageResult.rows[0].id,
      role: 'assistant',
      content: fallbackContent,
      message_type: 'text',
      timestamp: messageResult.rows[0].created_at,
      suggested_questions: ['这个学校的优势专业是什么？', '录取概率如何计算？'],
      error: true
    };
  }
}

/**
 * 构建系统提示词
 * @param {Object} recommendationData - 推荐数据
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(recommendationData) {
  const { summary, 冲刺, 稳妥, 保底, 风险分析, 行业分析 } = recommendationData;
  
  return `你是一位专业的高考志愿填报顾问，正在帮助考生和家长解答关于志愿填报的问题。

当前推荐方案概况：
- 冲刺院校：${冲刺?.length || 0}所
- 稳妥院校：${稳妥?.length || 0}所  
- 保底院校：${保底?.length || 0}所
- 整体风险等级：${风险分析?.overallRiskLevel || '未知'}

你可以回答的问题包括：
1. 院校详情（优势专业、地理位置、就业情况）
2. 专业解读（培养目标、就业方向、适合人群）
3. 录取概率分析
4. 志愿填报策略建议
5. 行业发展趋势

请用专业、友善的语气回答，回答要简洁明了，避免过于学术化的表达。`;
}

/**
 * 调用AI服务
 * @param {string} systemPrompt - 系统提示词
 * @param {Array} history - 对话历史
 * @param {string} userMessage - 用户消息
 * @returns {Object} AI回复内容
 */
async function callAIService(systemPrompt, history, userMessage) {
  // TODO: 接入实际的AI服务（OpenAI、文心一言、通义千问等）
  // 目前使用模拟响应
  
  const responses = {
    '学校': '根据您的成绩和兴趣，我为您推荐的院校都是经过综合评估的。您可以点击具体院校查看详细信息，包括优势专业、历年分数线、就业情况等。',
    '专业': '专业选择要结合孩子的兴趣、能力和未来职业规划。我可以为您详细解读任何推荐专业的培养目标、课程设置和就业方向。',
    '概率': '录取概率是基于历年分数线、您的位次排名以及院校招生计划综合计算的。冲刺院校概率在15-40%，稳妥院校60-85%，保底院校90%以上。',
    '风险': '当前方案的整体风险是可控的。冲刺、稳妥、保底三档搭配合理，既有冲击名校的机会，也有稳妥录取的保障。',
    '就业': '从行业分析来看，推荐的这些专业对应的行业发展前景良好，就业率和薪资水平都比较理想。',
    'default': '这是一个很好的问题！根据您的推荐方案，我可以为您提供更详细的分析。请问您想了解哪所院校或哪个专业的具体情况？'
  };

  // 简单的关键词匹配
  let responseText = responses.default;
  for (const [keyword, text] of Object.entries(responses)) {
    if (userMessage.includes(keyword)) {
      responseText = text;
      break;
    }
  }

  return {
    text: responseText,
    suggestedQuestions: [
      '北京大学有哪些优势专业？',
      '计算机专业的就业前景如何？',
      '如何提高录取概率？',
      '这个方案的风险大吗？'
    ],
    relatedSchools: [],
    confidence: 0.85
  };
}

module.exports = router;
