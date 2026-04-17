import 'package:flutter_test/flutter_test.dart';
import 'package:zhiyuan_app/utils/test_utils.dart';

/// T094: 算法测试 - 推荐算法验证
void main() {
  group('录取概率算法测试', () {
    test('位次优于最低录取位次时概率应该为95%', () {
      final probability = calculateAdmissionProbability(1000, 2000, 5000);
      expect(probability, 95.0);
    });

    test('位次等于最低录取位次时概率应该为95%', () {
      final probability = calculateAdmissionProbability(2000, 2000, 5000);
      expect(probability, 95.0);
    });

    test('位次等于最高录取位次时概率应该为10%', () {
      final probability = calculateAdmissionProbability(5000, 2000, 5000);
      expect(probability, 10.0);
    });

    test('位次在中间时概率应该线性递减', () {
      final probability = calculateAdmissionProbability(3500, 2000, 5000);
      // 3500在2000和5000中间，概率应该在10%和95%之间
      expect(probability, greaterThan(10.0));
      expect(probability, lessThan(95.0));
      // 具体值：3500在中间，概率约为52.5%
      expect(probability, closeTo(52.5, 1.0));
    });

    test('位次优于最低录取位次很多时概率应该为95%', () {
      final probability = calculateAdmissionProbability(100, 2000, 5000);
      expect(probability, 95.0);
    });

    test('位次差于最高录取位次很多时概率应该为10%', () {
      final probability = calculateAdmissionProbability(10000, 2000, 5000);
      expect(probability, 10.0);
    });
  });

  group('推荐类型算法测试', () {
    test('概率>=70%应该是保底类型', () {
      expect(determineRecommendationType(100), 'safe');
      expect(determineRecommendationType(70), 'safe');
    });

    test('概率40%-69%应该是稳妥类型', () {
      expect(determineRecommendationType(69), 'steady');
      expect(determineRecommendationType(55), 'steady');
      expect(determineRecommendationType(40), 'steady');
    });

    test('概率<40%应该是冲刺类型', () {
      expect(determineRecommendationType(39), 'sprint');
      expect(determineRecommendationType(20), 'sprint');
      expect(determineRecommendationType(1), 'sprint');
      expect(determineRecommendationType(0), 'sprint');
    });
  });

  group('风险等级算法测试', () {
    test('录取概率低、就业率低、增长率低应该是高风险', () {
      final risk = calculateRiskLevel(20, 75, 3);
      expect(risk, 'high');
    });

    test('录取概率中等、就业率中等、增长率中等应该是中风险', () {
      final risk = calculateRiskLevel(45, 85, 8);
      expect(risk, 'medium');
    });

    test('录取概率高、就业率高、增长率高应该是低风险', () {
      final risk = calculateRiskLevel(80, 95, 15);
      expect(risk, 'low');
    });

    test('边界条件测试', () {
      // 刚好60分应该是高风险
      expect(calculateRiskLevel(30, 80, 5), 'high');
      // 刚好30分应该是中风险
      expect(calculateRiskLevel(50, 90, 10), 'medium');
    });
  });

  group('匹配度算法测试', () {
    test('完全匹配应该返回100分', () {
      final score = calculateMatchScore(
        studentScore: 600,
        schoolAvgScore: 600,
        studentRank: 5000,
        schoolAvgRank: 5000,
        studentInterests: ['计算机', '数学'],
        majorCharacteristics: ['计算机', '数学', '物理'],
      );
      expect(score, closeTo(100.0, 5.0));
    });

    test('完全不匹配应该返回低分', () {
      final score = calculateMatchScore(
        studentScore: 400,
        schoolAvgScore: 650,
        studentRank: 50000,
        schoolAvgRank: 5000,
        studentInterests: ['文学', '历史'],
        majorCharacteristics: ['计算机', '数学'],
      );
      expect(score, lessThan(50.0));
    });

    test('分数和位次匹配但兴趣不匹配', () {
      final score = calculateMatchScore(
        studentScore: 600,
        schoolAvgScore: 600,
        studentRank: 5000,
        schoolAvgRank: 5000,
        studentInterests: ['文学', '历史'],
        majorCharacteristics: ['计算机', '数学'],
      );
      // 分数和位次匹配度60%，兴趣匹配度0%，总分约60%
      expect(score, closeTo(60.0, 5.0));
    });

    test('兴趣匹配但分数和位次不匹配', () {
      final score = calculateMatchScore(
        studentScore: 500,
        schoolAvgScore: 650,
        studentRank: 30000,
        schoolAvgRank: 5000,
        studentInterests: ['计算机', '数学'],
        majorCharacteristics: ['计算机', '数学', '物理'],
      );
      // 兴趣匹配度100%，但分数和位次匹配度低
      expect(score, greaterThan(40.0));
      expect(score, lessThan(80.0));
    });

    test('空兴趣列表应该只计算分数和位次匹配度', () {
      final score = calculateMatchScore(
        studentScore: 600,
        schoolAvgScore: 600,
        studentRank: 5000,
        schoolAvgRank: 5000,
        studentInterests: [],
        majorCharacteristics: ['计算机', '数学'],
      );
      // 只有分数和位次匹配度，各30%，总分60%
      expect(score, closeTo(60.0, 5.0));
    });
  });

  group('等效分算法测试', () {
    test('同一年份的等效分应该相同', () {
      final equivalentScore = calculateEquivalentScore(600, 2024, '湖北', 'physics');
      expect(equivalentScore, 600);
    });

    test('往年分数应该增加调整值', () {
      final equivalentScore2023 = calculateEquivalentScore(600, 2023, '湖北', 'physics');
      final equivalentScore2022 = calculateEquivalentScore(600, 2022, '湖北', 'physics');
      
      // 每年增加5分
      expect(equivalentScore2023, greaterThan(600));
      expect(equivalentScore2022, greaterThan(equivalentScore2023));
    });

    test('未来年份分数应该减少调整值', () {
      final equivalentScore = calculateEquivalentScore(600, 2025, '湖北', 'physics');
      expect(equivalentScore, lessThan(600));
    });
  });

  group('综合推荐算法测试', () {
    test('高分高排名学生应该获得更多冲刺推荐', () {
      // 模拟高分学生
      final studentScore = 680;
      final studentRank = 500;
      
      // 生成推荐列表
      final recommendations = _generateMockRecommendations(studentScore, studentRank);
      
      // 统计各类型推荐数量
      final sprintCount = recommendations.where((r) => r['type'] == 'sprint').length;
      final steadyCount = recommendations.where((r) => r['type'] == 'steady').length;
      final safeCount = recommendations.where((r) => r['type'] == 'safe').length;
      
      // 高分学生应该有更多冲刺推荐
      expect(sprintCount, greaterThanOrEqualTo(steadyCount));
      expect(sprintCount, greaterThanOrEqualTo(safeCount));
    });

    test('低分低排名学生应该获得更多保底推荐', () {
      // 模拟低分学生
      final studentScore = 450;
      final studentRank = 50000;
      
      // 生成推荐列表
      final recommendations = _generateMockRecommendations(studentScore, studentRank);
      
      // 统计各类型推荐数量
      final sprintCount = recommendations.where((r) => r['type'] == 'sprint').length;
      final steadyCount = recommendations.where((r) => r['type'] == 'steady').length;
      final safeCount = recommendations.where((r) => r['type'] == 'safe').length;
      
      // 低分学生应该有更多保底推荐
      expect(safeCount, greaterThanOrEqualTo(steadyCount));
      expect(safeCount, greaterThanOrEqualTo(sprintCount));
    });
  });
}

// 辅助函数：生成模拟推荐数据
List<Map<String, dynamic>> _generateMockRecommendations(int score, int rank) {
  final recommendations = <Map<String, dynamic>>[];
  
  // 模拟不同层次的学校
  final schools = [
    {'name': '清华大学', 'min_score': 680, 'min_rank': 500},
    {'name': '北京大学', 'min_score': 678, 'min_rank': 550},
    {'name': '复旦大学', 'min_score': 660, 'min_rank': 1500},
    {'name': '武汉大学', 'min_score': 630, 'min_rank': 4000},
    {'name': '华中科技大学', 'min_score': 625, 'min_rank': 4500},
    {'name': '中南财经政法大学', 'min_score': 600, 'min_rank': 8000},
    {'name': '武汉理工大学', 'min_score': 580, 'min_rank': 12000},
    {'name': '湖北大学', 'min_score': 550, 'min_rank': 20000},
    {'name': '武汉科技大学', 'min_score': 530, 'min_rank': 28000},
    {'name': '湖北工业大学', 'min_score': 510, 'min_rank': 35000},
  ];
  
  for (final school in schools) {
    final minScore = school['min_score'] as int;
    final minRank = school['min_rank'] as int;
    
    // 计算录取概率
    final probability = calculateAdmissionProbability(
      rank,
      minRank,
      (minRank * 1.5).toInt(),
    );
    
    // 确定推荐类型
    final type = determineRecommendationType(probability);
    
    recommendations.add({
      'name': school['name'],
      'type': type,
      'probability': probability,
    });
  }
  
  return recommendations;
}
