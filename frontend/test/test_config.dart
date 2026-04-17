/// 测试配置文件
/// 包含测试相关的配置和常量

class TestConfig {
  // API 测试配置
  static const String testBaseUrl = 'http://localhost:3000/api';
  static const Duration apiTimeout = Duration(seconds: 10);
  
  // 测试用户数据
  static const String testPhone = '13800138000';
  static const String testVerificationCode = '123456';
  static const String testToken = 'test_jwt_token';
  
  // 测试成绩数据
  static const Map<String, dynamic> testScores = {
    'chinese': 120,
    'math': 130,
    'english': 125,
    'physics': 85,
    'chemistry': 80,
    'biology': 78,
  };
  
  static const int testTotalScore = 618;
  static const int testRank = 5000;
  static const String testProvince = '湖北';
  static const String testSubjectType = 'physics';
  static const int testYear = 2024;
  
  // 测试学校数据
  static const List<Map<String, dynamic>> testSchools = [
    {
      'id': 1,
      'name': '武汉大学',
      'code': '10486',
      'province': '湖北',
      'type': '综合',
      'level': '985',
      'min_score_2024': 630,
      'min_rank_2024': 4000,
    },
    {
      'id': 2,
      'name': '华中科技大学',
      'code': '10487',
      'province': '湖北',
      'type': '理工',
      'level': '985',
      'min_score_2024': 625,
      'min_rank_2024': 4500,
    },
    {
      'id': 3,
      'name': '武汉理工大学',
      'code': '10497',
      'province': '湖北',
      'type': '理工',
      'level': '211',
      'min_score_2024': 580,
      'min_rank_2024': 12000,
    },
  ];
  
  // 测试推荐数据
  static const List<Map<String, dynamic>> testRecommendations = [
    {
      'id': 1,
      'school_name': '武汉大学',
      'major_name': '计算机科学与技术',
      'probability': 85.5,
      'type': 'safe',
      'admission_score_2024': 645,
      'admission_rank_2024': 3500,
    },
    {
      'id': 2,
      'school_name': '华中科技大学',
      'major_name': '软件工程',
      'probability': 65.0,
      'type': 'steady',
      'admission_score_2024': 635,
      'admission_rank_2024': 4200,
    },
    {
      'id': 3,
      'school_name': '清华大学',
      'major_name': '计算机科学与技术',
      'probability': 15.0,
      'type': 'sprint',
      'admission_score_2024': 695,
      'admission_rank_2024': 200,
    },
  ];
  
  // 性能测试阈值
  static const int maxStartupTimeMs = 3000;
  static const int maxPageLoadTimeMs = 1000;
  static const int maxListRenderTimeMs = 500;
  static const int maxMemoryUsageMB = 200;
  static const int minFrameRate = 60;
  
  // 重试配置
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);
}

/// 测试标签
class TestTags {
  static const String unit = 'unit';
  static const String widget = 'widget';
  static const String integration = 'integration';
  static const String performance = 'performance';
  static const String security = 'security';
  static const String algorithm = 'algorithm';
  static const String compatibility = 'compatibility';
}

/// 测试优先级
class TestPriority {
  static const int p0 = 0; // 阻塞性问题
  static const int p1 = 1; // 高优先级
  static const int p2 = 2; // 中优先级
  static const int p3 = 3; // 低优先级
}
