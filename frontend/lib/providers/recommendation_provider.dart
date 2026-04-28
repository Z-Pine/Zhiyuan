import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class RecommendationProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  RecommendationResult? _currentRecommendation;
  List<RecommendationResult> _recommendationHistory = [];
  bool _isLoading = false;
  bool _isGenerating = false;
  String? _errorMessage;
  
  // 收藏列表
  Set<int> _favoriteSchoolIds = {};

  RecommendationProvider(this._apiService);

  RecommendationResult? get currentRecommendation => _currentRecommendation;
  List<RecommendationResult> get recommendationHistory => _recommendationHistory;
  bool get isLoading => _isLoading;
  bool get isGenerating => _isGenerating;
  String? get errorMessage => _errorMessage;
  Set<int> get favoriteSchoolIds => _favoriteSchoolIds;

  /// 加载学生的最新推荐
  Future<void> loadRecommendation(String studentId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/api/recommendations/student/$studentId');
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        if (data != null) {
          _currentRecommendation = RecommendationResult.fromJson(data);
        }
      } else {
        _errorMessage = _apiService.getMessage(response);
      }
    } catch (e) {
      _errorMessage = '网络错误';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// 生成推荐方案
  Future<bool> generateRecommendation(String studentId, {bool useLlm = false}) async {
    _isGenerating = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/api/recommendations/generate', data: {
        'student_id': studentId,
        'use_llm': useLlm,
      });

      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        _currentRecommendation = RecommendationResult.fromJson(data);
        _isGenerating = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = _apiService.getMessage(response);
      }
    } catch (e) {
      _errorMessage = '网络错误';
    }

    _isGenerating = false;
    notifyListeners();
    return false;
  }

  /// 加载推荐历史
  Future<void> loadRecommendationHistory({int page = 1, int limit = 10}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get(
        '/api/recommendations?page=$page&limit=$limit',
      );
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        if (data != null && data['recommendations'] != null) {
          _recommendationHistory = (data['recommendations'] as List)
              .map((e) => RecommendationResult.fromJson(e))
              .toList();
        }
      }
    } catch (e) {
      _errorMessage = '加载历史记录失败';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// 提交反馈
  Future<bool> submitFeedback(int recommendationId, int rating, {String? comment}) async {
    try {
      final response = await _apiService.post(
        '/api/recommendations/$recommendationId/feedback',
        data: {
          'rating': rating,
          'comment': comment,
        },
      );
      return _apiService.getSuccess(response);
    } catch (e) {
      return false;
    }
  }

  /// 切换收藏状态
  void toggleFavorite(int schoolId) {
    if (_favoriteSchoolIds.contains(schoolId)) {
      _favoriteSchoolIds.remove(schoolId);
    } else {
      _favoriteSchoolIds.add(schoolId);
    }
    notifyListeners();
  }

  /// 检查是否已收藏
  bool isFavorite(int schoolId) {
    return _favoriteSchoolIds.contains(schoolId);
  }

  void clearRecommendation() {
    _currentRecommendation = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

/// 推荐结果模型
class RecommendationResult {
  final int recommendationId;
  final RecommendationSummary summary;
  final List<SchoolRecommendation> sprint;      // 冲刺
  final List<SchoolRecommendation> steady;      // 稳妥
  final List<SchoolRecommendation> safe;        // 保底
  final RiskAnalysis riskAnalysis;
  final IndustryAnalysis industryAnalysis;
  final ReferenceSources references;

  RecommendationResult({
    required this.recommendationId,
    required this.summary,
    required this.sprint,
    required this.steady,
    required this.safe,
    required this.riskAnalysis,
    required this.industryAnalysis,
    required this.references,
  });

  factory RecommendationResult.fromJson(Map<String, dynamic> json) {
    return RecommendationResult(
      recommendationId: json['recommendation_id'],
      summary: RecommendationSummary.fromJson(json['summary'] ?? {}),
      sprint: (json['冲刺'] as List? ?? [])
          .map((e) => SchoolRecommendation.fromJson(e))
          .toList(),
      steady: (json['稳妥'] as List? ?? [])
          .map((e) => SchoolRecommendation.fromJson(e))
          .toList(),
      safe: (json['保底'] as List? ?? [])
          .map((e) => SchoolRecommendation.fromJson(e))
          .toList(),
      riskAnalysis: RiskAnalysis.fromJson(json['风险分析'] ?? {}),
      industryAnalysis: IndustryAnalysis.fromJson(json['行业分析'] ?? {}),
      references: ReferenceSources.fromJson(json['参考来源'] ?? {}),
    );
  }

  /// 获取所有推荐院校
  List<SchoolRecommendation> get allSchools => [...sprint, ...steady, ...safe];

  /// 获取冲刺院校数量
  int get sprintCount => sprint.length;

  /// 获取稳妥院校数量
  int get steadyCount => steady.length;

  /// 获取保底院校数量
  int get safeCount => safe.length;

  /// 获取总推荐数量
  int get totalCount => sprint.length + steady.length + safe.length;
}

/// 推荐摘要
class RecommendationSummary {
  final String title;
  final String description;
  final double avgProbability;
  final String riskLevel;

  RecommendationSummary({
    required this.title,
    required this.description,
    required this.avgProbability,
    required this.riskLevel,
  });

  factory RecommendationSummary.fromJson(Map<String, dynamic> json) {
    return RecommendationSummary(
      title: json['title'] ?? '智能推荐方案',
      description: json['description'] ?? '',
      avgProbability: (json['avg_probability'] ?? 0.0).toDouble(),
      riskLevel: json['risk_level'] ?? 'medium',
    );
  }
}

/// 院校推荐
class SchoolRecommendation {
  final int schoolId;
  final String schoolName;
  final String? logo;
  final String province;
  final String? city;
  final String? level;
  final bool is985;
  final bool is211;
  final bool isDoubleFirst;
  final String? category;
  final int? rank;
  final double matchScore;
  final double admissionProbability;
  final String? reason;
  final List<MajorInfo> recommendedMajors;
  final List<String> tags;

  SchoolRecommendation({
    required this.schoolId,
    required this.schoolName,
    this.logo,
    required this.province,
    this.city,
    this.level,
    this.is985 = false,
    this.is211 = false,
    this.isDoubleFirst = false,
    this.category,
    this.rank,
    required this.matchScore,
    required this.admissionProbability,
    this.reason,
    this.recommendedMajors = const [],
    this.tags = const [],
  });

  factory SchoolRecommendation.fromJson(Map<String, dynamic> json) {
    return SchoolRecommendation(
      schoolId: json['school_id'],
      schoolName: json['school_name'],
      logo: json['logo'],
      province: json['province'] ?? '',
      city: json['city'],
      level: json['level'],
      is985: json['is_985'] ?? false,
      is211: json['is_211'] ?? false,
      isDoubleFirst: json['is_double_first'] ?? false,
      category: json['category'],
      rank: json['rank'],
      matchScore: (json['match_score'] ?? 0.0).toDouble(),
      admissionProbability: (json['admission_probability'] ?? 0.0).toDouble(),
      reason: json['reason'],
      recommendedMajors: (json['recommended_majors'] as List? ?? [])
          .map((e) => MajorInfo.fromJson(e))
          .toList(),
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  /// 获取层次标签
  List<String> get levelTags {
    final tags = <String>[];
    if (is985) tags.add('985');
    if (is211) tags.add('211');
    if (isDoubleFirst) tags.add('双一流');
    return tags;
  }

  /// 获取录取概率百分比字符串
  String get probabilityText => '${(admissionProbability * 100).toStringAsFixed(0)}%';

  /// 获取匹配分数百分比字符串
  String get matchScoreText => '${matchScore.toStringAsFixed(0)}分';
}

/// 专业信息
class MajorInfo {
  final int majorId;
  final String majorName;
  final String? category;
  final double? matchScore;

  MajorInfo({
    required this.majorId,
    required this.majorName,
    this.category,
    this.matchScore,
  });

  factory MajorInfo.fromJson(Map<String, dynamic> json) {
    return MajorInfo(
      majorId: json['major_id'],
      majorName: json['major_name'],
      category: json['category'],
      matchScore: json['match_score']?.toDouble(),
    );
  }
}

/// 风险分析
class RiskAnalysis {
  final String overallRiskLevel;
  final Map<String, dynamic> schoolRisks;
  final Map<String, dynamic> majorRisks;
  final Map<String, dynamic> industryRisks;
  final List<String> warnings;
  final List<String> suggestions;

  RiskAnalysis({
    required this.overallRiskLevel,
    required this.schoolRisks,
    required this.majorRisks,
    required this.industryRisks,
    required this.warnings,
    required this.suggestions,
  });

  factory RiskAnalysis.fromJson(Map<String, dynamic> json) {
    return RiskAnalysis(
      overallRiskLevel: json['overallRiskLevel'] ?? 'medium',
      schoolRisks: json['schoolRisks'] ?? {},
      majorRisks: json['majorRisks'] ?? {},
      industryRisks: json['industryRisks'] ?? {},
      warnings: List<String>.from(json['warnings'] ?? []),
      suggestions: List<String>.from(json['suggestions'] ?? []),
    );
  }

  /// 获取风险等级中文
  String get riskLevelText {
    switch (overallRiskLevel) {
      case 'low':
        return '低风险';
      case 'medium':
        return '中等风险';
      case 'high':
        return '高风险';
      default:
        return '中等风险';
    }
  }
}

/// 行业分析
class IndustryAnalysis {
  final Map<String, IndustryInfo> industries;
  final OverallIndustry overall;
  final List<IndustryRecommendation> recommendations;

  IndustryAnalysis({
    required this.industries,
    required this.overall,
    required this.recommendations,
  });

  factory IndustryAnalysis.fromJson(Map<String, dynamic> json) {
    final industriesMap = <String, IndustryInfo>{};
    if (json['industries'] != null) {
      (json['industries'] as Map<String, dynamic>).forEach((key, value) {
        industriesMap[key] = IndustryInfo.fromJson(value);
      });
    }

    return IndustryAnalysis(
      industries: industriesMap,
      overall: OverallIndustry.fromJson(json['overall'] ?? {}),
      recommendations: (json['recommendations'] as List? ?? [])
          .map((e) => IndustryRecommendation.fromJson(e))
          .toList(),
    );
  }
}

/// 行业信息
class IndustryInfo {
  final String name;
  final double score;
  final SalaryInfo salary;
  final GrowthInfo growth;
  final EmploymentInfo employment;

  IndustryInfo({
    required this.name,
    required this.score,
    required this.salary,
    required this.growth,
    required this.employment,
  });

  factory IndustryInfo.fromJson(Map<String, dynamic> json) {
    return IndustryInfo(
      name: json['name'] ?? '',
      score: (json['score'] ?? 0.0).toDouble(),
      salary: SalaryInfo.fromJson(json['salary'] ?? {}),
      growth: GrowthInfo.fromJson(json['growth'] ?? {}),
      employment: EmploymentInfo.fromJson(json['employment'] ?? {}),
    );
  }
}

/// 薪资信息
class SalaryInfo {
  final int current;
  final int entry;
  final int senior;

  SalaryInfo({
    required this.current,
    required this.entry,
    required this.senior,
  });

  factory SalaryInfo.fromJson(Map<String, dynamic> json) {
    return SalaryInfo(
      current: json['current'] ?? 0,
      entry: json['entry'] ?? 0,
      senior: json['senior'] ?? 0,
    );
  }
}

/// 增长信息
class GrowthInfo {
  final double rate;
  final String trend;

  GrowthInfo({
    required this.rate,
    required this.trend,
  });

  factory GrowthInfo.fromJson(Map<String, dynamic> json) {
    return GrowthInfo(
      rate: (json['rate'] ?? 0.0).toDouble(),
      trend: json['trend'] ?? 'stable',
    );
  }
}

/// 就业信息
class EmploymentInfo {
  final double rate;

  EmploymentInfo({required this.rate});

  factory EmploymentInfo.fromJson(Map<String, dynamic> json) {
    return EmploymentInfo(
      rate: (json['rate'] ?? 0.0).toDouble(),
    );
  }
}

/// 整体行业指标
class OverallIndustry {
  final int avgSalary;
  final double avgGrowth;
  final double avgEmploymentRate;
  final String trendDirection;

  OverallIndustry({
    required this.avgSalary,
    required this.avgGrowth,
    required this.avgEmploymentRate,
    required this.trendDirection,
  });

  factory OverallIndustry.fromJson(Map<String, dynamic> json) {
    return OverallIndustry(
      avgSalary: json['avgSalary'] ?? 0,
      avgGrowth: (json['avgGrowth'] ?? 0.0).toDouble(),
      avgEmploymentRate: (json['avgEmploymentRate'] ?? 0.0).toDouble(),
      trendDirection: json['trendDirection'] ?? 'stable',
    );
  }
}

/// 行业推荐
class IndustryRecommendation {
  final String type;
  final String name;
  final String reason;

  IndustryRecommendation({
    required this.type,
    required this.name,
    required this.reason,
  });

  factory IndustryRecommendation.fromJson(Map<String, dynamic> json) {
    return IndustryRecommendation(
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      reason: json['reason'] ?? '',
    );
  }
}

/// 参考来源
class ReferenceSources {
  final List<OfficialSource> officialSources;
  final List<DataSource> dataSources;
  final List<PolicySource> policySources;
  final String recommendationNote;

  ReferenceSources({
    required this.officialSources,
    required this.dataSources,
    required this.policySources,
    required this.recommendationNote,
  });

  factory ReferenceSources.fromJson(Map<String, dynamic> json) {
    return ReferenceSources(
      officialSources: (json['official_sources'] as List? ?? [])
          .map((e) => OfficialSource.fromJson(e))
          .toList(),
      dataSources: (json['data_sources'] as List? ?? [])
          .map((e) => DataSource.fromJson(e))
          .toList(),
      policySources: (json['policy_sources'] as List? ?? [])
          .map((e) => PolicySource.fromJson(e))
          .toList(),
      recommendationNote: json['recommendation_note'] ?? '',
    );
  }
}

/// 官方来源
class OfficialSource {
  final String name;
  final String url;
  final String description;

  OfficialSource({
    required this.name,
    required this.url,
    required this.description,
  });

  factory OfficialSource.fromJson(Map<String, dynamic> json) {
    return OfficialSource(
      name: json['name'] ?? '',
      url: json['url'] ?? '',
      description: json['description'] ?? '',
    );
  }
}

/// 数据来源
class DataSource {
  final String name;
  final String description;
  final String updateTime;

  DataSource({
    required this.name,
    required this.description,
    required this.updateTime,
  });

  factory DataSource.fromJson(Map<String, dynamic> json) {
    return DataSource(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      updateTime: json['update_time'] ?? '',
    );
  }
}

/// 政策来源
class PolicySource {
  final String name;
  final String description;
  final String document;

  PolicySource({
    required this.name,
    required this.description,
    required this.document,
  });

  factory PolicySource.fromJson(Map<String, dynamic> json) {
    return PolicySource(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      document: json['document'] ?? '',
    );
  }
}
