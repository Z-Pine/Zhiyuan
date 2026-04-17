import 'package:flutter_test/flutter_test.dart';
import 'package:zhiyuan_app/utils/test_utils.dart';

/// T090: 单元测试 - 工具函数测试
void main() {
  group('手机号验证测试', () {
    test('有效手机号应该返回true', () {
      expect(isValidPhone('13800138000'), true);
      expect(isValidPhone('15912345678'), true);
      expect(isValidPhone('18687654321'), true);
    });

    test('无效手机号应该返回false', () {
      expect(isValidPhone('1380013800'), false); // 少一位
      expect(isValidPhone('138001380000'), false); // 多一位
      expect(isValidPhone('12800138000'), false); // 无效前缀
      expect(isValidPhone(''), false); // 空字符串
      expect(isValidPhone('abc'), false); // 非数字
    });
  });

  group('分数验证测试', () {
    test('有效分数应该返回true', () {
      expect(isValidScore(750), true);
      expect(isValidScore(600), true);
      expect(isValidScore(0), true);
    });

    test('无效分数应该返回false', () {
      expect(isValidScore(751), false); // 超过最大值
      expect(isValidScore(-1), false); // 负数
    });
  });

  group('位次验证测试', () {
    test('有效位次应该返回true', () {
      expect(isValidRank(1), true);
      expect(isValidRank(10000), true);
      expect(isValidRank(100000), true);
    });

    test('无效位次应该返回false', () {
      expect(isValidRank(0), false);
      expect(isValidRank(-1), false);
    });
  });

  group('录取概率计算测试', () {
    test('位次优于最低录取位次时概率应该很高', () {
      final probability = calculateAdmissionProbability(1000, 2000, 5000);
      expect(probability, 95.0);
    });

    test('位次差于最高录取位次时概率应该很低', () {
      final probability = calculateAdmissionProbability(6000, 2000, 5000);
      expect(probability, 10.0);
    });

    test('位次在中间时概率应该适中', () {
      final probability = calculateAdmissionProbability(3500, 2000, 5000);
      expect(probability, greaterThan(10.0));
      expect(probability, lessThan(95.0));
    });
  });

  group('推荐类型判断测试', () {
    test('高概率应该是保底', () {
      expect(determineRecommendationType(80), 'safe');
      expect(determineRecommendationType(70), 'safe');
    });

    test('中等概率应该是稳妥', () {
      expect(determineRecommendationType(69), 'steady');
      expect(determineRecommendationType(40), 'steady');
    });

    test('低概率应该是冲刺', () {
      expect(determineRecommendationType(39), 'sprint');
      expect(determineRecommendationType(10), 'sprint');
    });
  });

  group('位次格式化测试', () {
    test('小于1000的位次应该直接显示', () {
      expect(formatRank(999), '999');
      expect(formatRank(500), '500');
    });

    test('1000-9999的位次应该显示为千', () {
      expect(formatRank(1500), '1.5千');
      expect(formatRank(5000), '5.0千');
    });

    test('大于10000的位次应该显示为万', () {
      expect(formatRank(15000), '1.5万');
      expect(formatRank(50000), '5.0万');
    });
  });

  group('科目组合验证测试', () {
    test('有效的物理类组合应该返回true', () {
      final scores = {
        'chinese': 120,
        'math': 130,
        'english': 125,
        'physics': 85,
        'chemistry': 80,
        'biology': 78,
      };
      expect(isValidSubjectCombination('physics', scores), true);
    });

    test('有效的历史类组合应该返回true', () {
      final scores = {
        'chinese': 120,
        'math': 110,
        'english': 125,
        'history': 85,
        'geography': 80,
        'politics': 78,
      };
      expect(isValidSubjectCombination('history', scores), true);
    });

    test('缺少必考科目应该返回false', () {
      final scores = {
        'math': 130,
        'english': 125,
        'physics': 85,
        'chemistry': 80,
        'biology': 78,
      };
      expect(isValidSubjectCombination('physics', scores), false);
    });

    test('再选科目不足应该返回false', () {
      final scores = {
        'chinese': 120,
        'math': 130,
        'english': 125,
        'physics': 85,
        'chemistry': 80,
      };
      expect(isValidSubjectCombination('physics', scores), false);
    });
  });

  group('总分计算测试', () {
    test('应该正确计算总分', () {
      final scores = {
        'chinese': 120,
        'math': 130,
        'english': 125,
        'physics': 85,
        'chemistry': 80,
        'biology': 78,
      };
      expect(calculateTotalScore(scores), 618);
    });

    test('空map应该返回0', () {
      expect(calculateTotalScore({}), 0);
    });
  });

  group('学校代码验证测试', () {
    test('有效的5位数字代码应该返回true', () {
      expect(isValidSchoolCode('12345'), true);
      expect(isValidSchoolCode('98765'), true);
    });

    test('无效的学校代码应该返回false', () {
      expect(isValidSchoolCode('1234'), false); // 少一位
      expect(isValidSchoolCode('123456'), false); // 多一位
      expect(isValidSchoolCode('abcde'), false); // 非数字
      expect(isValidSchoolCode(''), false); // 空字符串
    });
  });

  group('风险等级计算测试', () {
    test('高风险情况', () {
      final risk = calculateRiskLevel(20, 75, 3);
      expect(risk, 'high');
    });

    test('中风险情况', () {
      final risk = calculateRiskLevel(45, 85, 8);
      expect(risk, 'medium');
    });

    test('低风险情况', () {
      final risk = calculateRiskLevel(80, 95, 15);
      expect(risk, 'low');
    });
  });

  group('匹配度计算测试', () {
    test('完全匹配应该返回高分', () {
      final score = calculateMatchScore(
        studentScore: 600,
        schoolAvgScore: 600,
        studentRank: 5000,
        schoolAvgRank: 5000,
        studentInterests: ['计算机', '数学'],
        majorCharacteristics: ['计算机', '数学', '物理'],
      );
      expect(score, greaterThan(80));
    });

    test('完全不匹配应该返回低分', () {
      final score = calculateMatchScore(
        studentScore: 500,
        schoolAvgScore: 650,
        studentRank: 50000,
        schoolAvgRank: 5000,
        studentInterests: ['文学', '历史'],
        majorCharacteristics: ['计算机', '数学'],
      );
      expect(score, lessThan(50));
    });
  });
}
