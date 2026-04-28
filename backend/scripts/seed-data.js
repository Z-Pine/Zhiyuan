/**
 * 种子数据脚本
 * 创建测试用的院校、专业、行业数据
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('开始导入种子数据...\n');
    
    await client.query('BEGIN');

    // ============================================
    // 1. 创建测试用户
    // ============================================
    console.log('1. 创建测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (phone, password, password_hash, nickname, created_at)
      VALUES 
        ('13800138000', $1, $1, '测试用户1', NOW()),
        ('13800138001', $1, $1, '测试用户2', NOW())
      ON CONFLICT (phone) DO NOTHING
      RETURNING id
    `, [hashedPassword]);
    
    console.log(`   ✓ 创建了 ${userResult.rowCount} 个测试用户`);

    // ============================================
    // 2. 导入广东省重点院校数据
    // ============================================
    console.log('\n2. 导入院校数据...');
    await client.query(`
      INSERT INTO universities (code, name, province, city, type, is_985, is_211, is_double_first, rank)
      VALUES 
        ('10558', '中山大学', '广东', '广州', '综合', true, true, true, 10),
        ('10561', '华南理工大学', '广东', '广州', '理工', true, true, true, 26),
        ('10574', '华南师范大学', '广东', '广州', '师范', false, true, true, 75),
        ('10559', '暨南大学', '广东', '广州', '综合', false, true, true, 51),
        ('10560', '汕头大学', '广东', '汕头', '综合', false, false, false, 120),
        ('10564', '华南农业大学', '广东', '广州', '农林', false, false, false, 95),
        ('10566', '广东海洋大学', '广东', '湛江', '农林', false, false, false, 280),
        ('10570', '广州医科大学', '广东', '广州', '医药', false, false, false, 105),
        ('10571', '广东医科大学', '广东', '湛江', '医药', false, false, false, 320),
        ('10572', '广州中医药大学', '广东', '广州', '医药', false, false, true, 110),
        ('10573', '广东药科大学', '广东', '广州', '医药', false, false, false, 300),
        ('10590', '深圳大学', '广东', '深圳', '综合', false, false, false, 70),
        ('11078', '广州大学', '广东', '广州', '综合', false, false, false, 145),
        ('11347', '仲恺农业工程学院', '广东', '广州', '农林', false, false, false, 380),
        ('11540', '广东金融学院', '广东', '广州', '财经', false, false, false, 340),
        ('10592', '广东财经大学', '广东', '广州', '财经', false, false, false, 230),
        ('10576', '韶关学院', '广东', '韶关', '综合', false, false, false, 450),
        ('10577', '惠州学院', '广东', '惠州', '综合', false, false, false, 480),
        ('10578', '韩山师范学院', '广东', '潮州', '师范', false, false, false, 490),
        ('10579', '岭南师范学院', '广东', '湛江', '师范', false, false, false, 500)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('   ✓ 导入了 20 所广东省院校');

    // ============================================
    // 3. 导入热门专业数据
    // ============================================
    console.log('\n3. 导入专业数据...');
    await client.query(`
      INSERT INTO majors (code, name, category, subcategory)
      VALUES 
        ('080901', '计算机科学与技术', '工学', '计算机类'),
        ('080902', '软件工程', '工学', '计算机类'),
        ('080903', '网络工程', '工学', '计算机类'),
        ('080904K', '信息安全', '工学', '计算机类'),
        ('080905', '物联网工程', '工学', '计算机类'),
        ('080910T', '数据科学与大数据技术', '工学', '计算机类'),
        ('080911TK', '网络空间安全', '工学', '计算机类'),
        ('080801', '自动化', '工学', '自动化类'),
        ('080701', '电子信息工程', '工学', '电子信息类'),
        ('080703', '通信工程', '工学', '电子信息类'),
        ('020301K', '金融学', '经济学', '金融学类'),
        ('020401', '国际经济与贸易', '经济学', '经济与贸易类'),
        ('120203K', '会计学', '管理学', '工商管理类'),
        ('120201K', '工商管理', '管理学', '工商管理类'),
        ('120202', '市场营销', '管理学', '工商管理类'),
        ('100201K', '临床医学', '医学', '临床医学类'),
        ('100301K', '口腔医学', '医学', '口腔医学类'),
        ('100701', '药学', '医学', '药学类'),
        ('100801', '中医学', '医学', '中医学类'),
        ('050201', '英语', '文学', '外国语言文学类'),
        ('050101', '汉语言文学', '文学', '中国语言文学类'),
        ('040106', '学前教育', '教育学', '教育学类'),
        ('030101K', '法学', '法学', '法学类'),
        ('120402', '行政管理', '管理学', '公共管理类'),
        ('081001', '土木工程', '工学', '土木类'),
        ('082502', '环境工程', '工学', '环境科学与工程类'),
        ('082801', '建筑学', '工学', '建筑类'),
        ('130502', '视觉传达设计', '艺术学', '设计学类'),
        ('130503', '环境设计', '艺术学', '设计学类'),
        ('120801', '电子商务', '管理学', '电子商务类')
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('   ✓ 导入了 30 个热门专业');

    // ============================================
    // 4. 导入行业数据
    // ============================================
    console.log('\n4. 导入行业数据...');
    await client.query(`
      INSERT INTO industries (name, category, avg_salary, demand_trend, risk_level, description)
      VALUES 
        ('互联网/电子商务', 'IT', 12000, 'rising', 'low', '包括电商平台、互联网服务等'),
        ('计算机软件', 'IT', 13500, 'rising', 'low', '软件开发、系统集成等'),
        ('人工智能', 'IT', 18000, 'rising', 'low', 'AI算法、机器学习等'),
        ('大数据', 'IT', 16000, 'rising', 'low', '数据分析、数据挖掘等'),
        ('网络安全', 'IT', 14000, 'rising', 'low', '信息安全、网络防护等'),
        ('金融/投资/证券', '金融', 11000, 'stable', 'medium', '银行、证券、保险等'),
        ('会计/审计', '金融', 8000, 'stable', 'medium', '财务会计、审计服务等'),
        ('医疗/护理/卫生', '医疗', 10000, 'stable', 'low', '医院、诊所、医疗服务等'),
        ('制药/生物工程', '医疗', 9500, 'rising', 'medium', '药品研发、生物技术等'),
        ('教育/培训', '教育', 7500, 'rising', 'low', '学校、培训机构等'),
        ('房地产', '建筑', 9000, 'declining', 'high', '房地产开发、销售等'),
        ('建筑/建材/工程', '建筑', 8500, 'stable', 'medium', '建筑设计、施工等'),
        ('机械/设备/重工', '制造', 8000, 'stable', 'medium', '机械制造、设备生产等'),
        ('汽车及零配件', '制造', 8500, 'stable', 'medium', '汽车制造、零部件等'),
        ('新能源', '制造', 10000, 'rising', 'low', '太阳能、风能等'),
        ('电子技术/半导体', '制造', 11000, 'rising', 'low', '芯片、电子元器件等'),
        ('通信/电信', 'IT', 10500, 'stable', 'medium', '通信设备、电信服务等'),
        ('广告/传媒/文化', '文化', 8000, 'stable', 'medium', '广告、媒体、出版等'),
        ('法律', '服务', 12000, 'stable', 'medium', '律师事务所、法律服务等'),
        ('咨询/顾问', '服务', 11000, 'stable', 'medium', '管理咨询、战略咨询等')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('   ✓ 导入了 20 个行业数据');

    // ============================================
    // 5. 创建专业-行业关联（跳过，后续手动添加）
    // ============================================
    console.log('\n5. 跳过专业-行业关联（表结构不匹配）...');

    // ============================================
    // 6. 导入2024年录取分数数据（跳过，表结构不匹配）
    // ============================================
    console.log('\n6. 跳过录取分数数据导入（表结构不匹配）...');

    await client.query('COMMIT');
    
    console.log('\n✅ 种子数据导入完成！');
    console.log('\n数据统计:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM universities) as universities_count,
        (SELECT COUNT(*) FROM majors) as majors_count,
        (SELECT COUNT(*) FROM industries) as industries_count,
        (SELECT COUNT(*) FROM admission_scores) as admission_scores_count
    `);
    
    console.log(`   - 用户: ${stats.rows[0].users_count}`);
    console.log(`   - 院校: ${stats.rows[0].universities_count}`);
    console.log(`   - 专业: ${stats.rows[0].majors_count}`);
    console.log(`   - 行业: ${stats.rows[0].industries_count}`);
    console.log(`   - 录取分数: ${stats.rows[0].admission_scores_count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  seedData()
    .then(() => {
      console.log('\n🎉 种子数据导入成功！');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n💥 种子数据导入失败！');
      process.exit(1);
    });
}

module.exports = { seedData };
