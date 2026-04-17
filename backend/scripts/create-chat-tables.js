/**
 * 创建对话相关数据库表
 * T056: 追问对话API
 */

const { pool } = require('../src/config/database');

async function createChatTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 开始创建对话相关表...');
    
    // 开始事务
    await client.query('BEGIN');
    
    // 1. 创建对话会话表
    console.log('📋 创建 chat_sessions 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `);
    
    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_recommendation ON chat_sessions(recommendation_id)
    `);
    
    // 2. 创建对话消息表
    console.log('📋 创建 chat_messages 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'card')),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at)
    `);
    
    // 3. 创建用户反馈表（用于收集对话质量反馈）
    console.log('📋 创建 chat_feedback 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_feedback (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feedback_type VARCHAR(20) CHECK (feedback_type IN ('helpful', 'unhelpful', 'inaccurate', 'other')),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log('✅ 对话相关表创建完成！');
    console.log('');
    console.log('创建的表：');
    console.log('  - chat_sessions: 对话会话表');
    console.log('  - chat_messages: 对话消息表');
    console.log('  - chat_feedback: 对话反馈表');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 创建表失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行创建
createChatTables()
  .then(() => {
    console.log('\n🎉 数据库初始化完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 初始化失败:', error);
    process.exit(1);
  });
