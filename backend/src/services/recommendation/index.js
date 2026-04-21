/**
 * 智能推荐引擎
 * 整合5大核心算法模块
 */

const { pool } = require('../../config/database');
const { calculateScoreLevel } = require('./score-level-algorithm');
const { matchEmployment } = require('./employment-matching');
const { assessRisk } = require('./risk-assessment');
const { analyzeIndustry } = require('./industry-analysis');
const { generateReferences } = require('./reference-sources');

class RecommendationEngine {
  /**
   * 生成完整推荐方案
   * @param {Object} studentProfile - 学生画像
   * @param {Object} examResult - 考试成绩
   * @returns {Object} 推荐结果
   */
  async generateRecommendation(studentProfile, examResult) {
    const client = await pool.connect();
    
    try {
      console.log('🎯 开始生成推荐方案...');
      
      // 1. 获取基础数据
      const schools = await this.getSchools(client);
      const majors = await this.getMajors(client);
      const admissionScores = await this.getAdmissionScores(client, examResult);
      
      // 2. 执行5大核心算法
      
      // T050: 位次分层算法 - 确定冲刺/稳妥/保底
      console.log('📊 执行位次分层算法...');
      const levelDistribution = await calculateScoreLevel({
        score: examResult.total_score,
        rank: examResult.rank,
        province: examResult.province,
        subjectType: examResult.subject_type,
        admissionScores
      });
      
      // T051: 就业匹配算法 - 画像匹配专业
      console.log('💼 执行就业匹配算法...');
      const employmentMatches = await matchEmployment({
        studentProfile,
        majors,
        client
      });
      
      // T052: 风险评估算法
      console.log('⚠️ 执行风险评估算法...');
      const riskAssessment = await assessRisk({
        schools,
        majors: employmentMatches,
        client
      });
      
      // T053: 行业分析算法
      console.log('📈 执行行业分析算法...');
      const industryAnalysis = await analyzeIndustry({
        matchedMajors: employmentMatches,
        client
      });
      
      // 3. 综合推荐结果
      console.log('🔄 综合推荐结果...');
      const recommendations = this.synthesizeRecommendations({
        levelDistribution,
        employmentMatches,
        riskAssessment,
        industryAnalysis,
        schools,
        majors
      });
      
      // T054: 生成参考来源
      console.log('🔗 生成参考来源...');
      const references = generateReferences(recommendations);
      
      // 4. 保存推荐结果
      const recommendationId = await this.saveRecommendation(client, {
        userId: studentProfile.user_id,
        studentId: studentProfile.id,
        examResultId: examResult.id,
        recommendations,
        references
      });
      
      console.log('✅ 推荐方案生成完成');
      
      return {
        recommendation_id: recommendationId,
        summary: this.generateSummary(recommendations),
       冲刺院校: recommendations.冲刺,
        稳妥院校: recommendations.稳妥,
        保底院校: recommendations.保底,
        风险分析: riskAssessment,
        行业分析: industryAnalysis,
        参考来源: references
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * 获取院校数据
   */
  async getSchools(client) {
    const result = await client.query(`
      SELECT 
        s.*,
        array_agg(DISTINCT sm.major_id) as major_ids
      FROM universities s
      LEFT JOIN school_majors sm ON s.id = sm.school_id
      WHERE s.status = 'active'
      GROUP BY s.id
    `);
    return result.rows;
  }
  
  /**
   * 获取专业数据
   */
  async getMajors(client) {
    const result = await client.query(`
      SELECT * FROM majors WHERE status = 'active'
    `);
    return result.rows;
  }
  
  /**
   * 获取录取分数数据
   */
  async getAdmissionScores(client, examResult) {
    const result = await client.query(`
      SELECT 
        a.*,
        s.name as school_name,
        s.level as school_level,
        s.is_985,
        s.is_211,
        m.name as major_name,
        m.category as major_category
      FROM admission_scores a
      JOIN schools s ON a.school_id = s.id
      JOIN majors m ON a.major_id = m.id
      WHERE a.province = $1
        AND a.subject_type = $2
        AND a.year >= 2022
      ORDER BY a.year DESC, a.min_score DESC
    `, [examResult.province, examResult.subject_type]);
    return result.rows;
  }
  
  /**
   * 综合推荐结果
   */
  synthesizeRecommendations({
    levelDistribution,
    employmentMatches,
    riskAssessment,
    industryAnalysis,
    schools,
    majors
  }) {
    const recommendations = {
      冲刺: [],
      稳妥: [],
      保底: []
    };
    
    // 按层次分配院校
    for (const school of schools) {
      const schoolMajors = this.getSchoolMajors(school, majors, employmentMatches);
      const riskLevel = riskAssessment.schoolRisks[school.id]?.level || 'medium';
      
      // 根据位次分层结果分配
      if (levelDistribution.冲刺.includes(school.id)) {
        recommendations.冲刺.push({
          school,
          majors: schoolMajors,
          risk: riskLevel,
          admissionProbability: this.calculateProbability('冲刺', school, riskLevel)
        });
      } else if (levelDistribution.稳妥.includes(school.id)) {
        recommendations.稳妥.push({
          school,
          majors: schoolMajors,
          risk: riskLevel,
          admissionProbability: this.calculateProbability('稳妥', school, riskLevel)
        });
      } else if (levelDistribution.保底.includes(school.id)) {
        recommendations.保底.push({
          school,
          majors: schoolMajors,
          risk: riskLevel,
          admissionProbability: this.calculateProbability('保底', school, riskLevel)
        });
      }
    }
    
    // 按录取概率排序
    recommendations.冲刺.sort((a, b) => b.admissionProbability - a.admissionProbability);
    recommendations.稳妥.sort((a, b) => b.admissionProbability - a.admissionProbability);
    recommendations.保底.sort((a, b) => b.admissionProbability - a.admissionProbability);
    
    // 限制数量
    recommendations.冲刺 = recommendations.冲刺.slice(0, 10);
    recommendations.稳妥 = recommendations.稳妥.slice(0, 15);
    recommendations.保底 = recommendations.保底.slice(0, 10);
    
    return recommendations;
  }
  
  /**
   * 获取院校匹配的专业
   */
  getSchoolMajors(school, allMajors, employmentMatches) {
    const matchedMajorIds = employmentMatches.map(m => m.major_id);
    return allMajors
      .filter(m => matchedMajorIds.includes(m.id))
      .slice(0, 5);
  }
  
  /**
   * 计算录取概率
   */
  calculateProbability(level, school, riskLevel) {
    const baseProbability = {
      '冲刺': 0.3,
      '稳妥': 0.6,
      '保底': 0.85
    };
    
    const riskAdjustment = {
      'high': -0.15,
      'medium': 0,
      'low': 0.1
    };
    
    let probability = baseProbability[level] + (riskAdjustment[riskLevel] || 0);
    
    // 院校层次加成
    if (school.is_985) probability -= 0.1;
    else if (school.is_211) probability -= 0.05;
    
    return Math.max(0.05, Math.min(0.95, probability));
  }
  
  /**
   * 生成推荐摘要
   */
  generateSummary(recommendations) {
    return {
      total_schools: recommendations.冲刺.length + recommendations.稳妥.length + recommendations.保底.length,
      冲刺_count: recommendations.冲刺.length,
      稳妥_count: recommendations.稳妥.length,
      保底_count: recommendations.保底.length,
      平均录取概率: this.calculateAverageProbability(recommendations)
    };
  }
  
  /**
   * 计算平均录取概率
   */
  calculateAverageProbability(recommendations) {
    const all = [...recommendations.冲刺, ...recommendations.稳妥, ...recommendations.保底];
    if (all.length === 0) return 0;
    const sum = all.reduce((acc, r) => acc + r.admissionProbability, 0);
    return (sum / all.length * 100).toFixed(1) + '%';
  }
  
  /**
   * 保存推荐结果
   */
  async saveRecommendation(client, data) {
    const result = await client.query(`
      INSERT INTO recommendations (
        user_id, student_id, exam_result_id, 
        recommendation_data, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [
      data.userId,
      data.studentId,
      data.examResultId,
      JSON.stringify(data.recommendations)
    ]);
    
    return result.rows[0].id;
  }
}

module.exports = { RecommendationEngine };
