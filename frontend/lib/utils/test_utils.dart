/// T090: 测试工具函数
/// 提供测试辅助功能

/// 验证手机号格式
bool isValidPhone(String phone) {
  final RegExp phoneRegex = RegExp(r'^1[3-9]\d{9}$');
  return phoneRegex.hasMatch(phone);
}

/// 验证分数有效性
bool isValidScore(int score, {int minScore = 0, int maxScore = 750}) {
  return score >= minScore && score <= maxScore;
}

/// 验证位次有效性
bool isValidRank(int rank, {int minRank = 1}) {
  return rank >= minRank;
}

/// 计算录取概率
/// 根据考生位次和学校录取位次计算概率
double calculateAdmissionProbability(int studentRank, int schoolMinRank, int schoolMaxRank) {
  if (studentRank <= schoolMinRank) {
    return 95.0; // 位次优于最低录取位次，概率很高
  }
  
  if (studentRank >= schoolMaxRank) {
    return 10.0; // 位次差于最高录取位次，概率很低
  }
  
  // 线性插值计算概率
  final range = schoolMaxRank - schoolMinRank;
  final position = studentRank - schoolMinRank;
  final probability = 95.0 - (position / range) * 85.0;
  
  return probability.clamp(10.0, 95.0);
}

/// 判断推荐类型
/// sprint: 冲刺, steady: 稳妥, safe: 保底
String determineRecommendationType(double probability) {
  if (probability >= 70) {
    return 'safe';
  } else if (probability >= 40) {
    return 'steady';
  } else {
    return 'sprint';
  }
}

/// 格式化分数
String formatScore(int score) {
  return score.toString();
}

/// 格式化位次
String formatRank(int rank) {
  if (rank >= 10000) {
    return '${(rank / 10000).toStringAsFixed(1)}万';
  } else if (rank >= 1000) {
    return '${(rank / 1000).toStringAsFixed(1)}千';
  }
  return rank.toString();
}

/// 计算分数差异
calculateScoreDifference(int score1, int score2) {
  return score1 - score2;
}

/// 验证科目组合有效性
bool isValidSubjectCombination(String subjectType, Map<String, int> scores) {
  // 3+1+2模式验证
  // 必考：语文、数学、外语
  // 首选：物理或历史
  // 再选：化学、生物、地理、政治中选2门
  
  if (!scores.containsKey('chinese') || 
      !scores.containsKey('math') || 
      !scores.containsKey('english')) {
    return false;
  }
  
  if (subjectType == 'physics') {
    if (!scores.containsKey('physics')) return false;
  } else if (subjectType == 'history') {
    if (!scores.containsKey('history')) return false;
  } else {
    return false;
  }
  
  // 检查再选科目数量
  final electiveSubjects = ['chemistry', 'biology', 'geography', 'politics'];
  final selectedElectives = electiveSubjects.where((s) => scores.containsKey(s)).length;
  
  return selectedElectives == 2;
}

/// 计算总分
int calculateTotalScore(Map<String, int> scores) {
  return scores.values.fold(0, (sum, score) => sum + score);
}

/// 计算等效分
/// 将不同年份的分数转换为等效分
int calculateEquivalentScore(int score, int year, String province, String subjectType) {
  // 简化的等效分计算（实际应该基于一分一段表）
  // 这里使用模拟数据
  final baseYear = 2024;
  final yearDiff = baseYear - year;
  
  // 每年分数波动约5-10分
  final adjustment = yearDiff * 5;
  
  return score + adjustment;
}

/// 验证学校代码
bool isValidSchoolCode(String code) {
  // 学校代码通常是5位数字
  final RegExp codeRegex = RegExp(r'^\d{5}$');
  return codeRegex.hasMatch(code);
}

/// 验证专业代码
bool isValidMajorCode(String code) {
  // 专业代码通常是6位数字或字母数字组合
  final RegExp codeRegex = RegExp(r'^[A-Z0-9]{6}$');
  return codeRegex.hasMatch(code);
}

/// 计算风险等级
String calculateRiskLevel(double probability, double employmentRate, double growthRate) {
  double riskScore = 0;
  
  // 录取概率风险（权重40%）
  if (probability < 30) riskScore += 40;
  else if (probability < 50) riskScore += 25;
  else if (probability < 70) riskScore += 10;
  
  // 就业率风险（权重30%）
  if (employmentRate < 80) riskScore += 30;
  else if (employmentRate < 90) riskScore += 15;
  
  // 行业增长率风险（权重30%）
  if (growthRate < 5) riskScore += 30;
  else if (growthRate < 10) riskScore += 15;
  
  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
}

/// 计算匹配度分数
double calculateMatchScore({
  required int studentScore,
  required int schoolAvgScore,
  required int studentRank,
  required int schoolAvgRank,
  required List<String> studentInterests,
  required List<String> majorCharacteristics,
}) {
  double score = 0;
  
  // 分数匹配度（30%）
  final scoreDiff = (studentScore - schoolAvgScore).abs();
  final scoreMatch = 1 - (scoreDiff / 100).clamp(0.0, 1.0);
  score += scoreMatch * 30;
  
  // 位次匹配度（30%）
  final rankDiff = (studentRank - schoolAvgRank).abs();
  final rankMatch = 1 - (rankDiff / 10000).clamp(0.0, 1.0);
  score += rankMatch * 30;
  
  // 兴趣匹配度（40%）
  if (studentInterests.isNotEmpty && majorCharacteristics.isNotEmpty) {
    final common = studentInterests.where((i) => majorCharacteristics.contains(i)).length;
    final interestMatch = common / studentInterests.length;
    score += interestMatch * 40;
  }
  
  return score.clamp(0.0, 100.0);
}
