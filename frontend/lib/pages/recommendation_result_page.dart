import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import '../providers/recommendation_provider.dart';
import '../providers/student_provider.dart';
import '../theme/app_theme.dart';
import 'recommendation_detail_page.dart';

/// 推荐结果展示页面
class RecommendationResultPage extends StatefulWidget {
  const RecommendationResultPage({super.key});

  @override
  State<RecommendationResultPage> createState() => _RecommendationResultPageState();
}

class _RecommendationResultPageState extends State<RecommendationResultPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _currentTabIndex = _tabController.index;
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Consumer<RecommendationProvider>(
          builder: (context, provider, child) {
            final recommendation = provider.currentRecommendation;
            
            if (recommendation == null) {
              return _buildEmptyState();
            }

            return NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  _buildAppBar(context, recommendation),
                  _buildOverviewSection(recommendation),
                  _buildTabBar(),
                ];
              },
              body: TabBarView(
                controller: _tabController,
                children: [
                  _buildAllSchoolsTab(recommendation),
                  _buildSprintTab(recommendation),
                  _buildSteadyTab(recommendation),
                  _buildSafeTab(recommendation),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: _buildFloatingActionButton(),
    );
  }

  /// 空状态
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.school_outlined,
            size: 80,
            color: AppTheme.textTertiary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            '暂无推荐结果',
            style: TextStyle(
              fontSize: 18,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '请先录入学生信息并生成推荐方案',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textTertiary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              // 导航到学生信息录入页面
            },
            icon: const Icon(Icons.add),
            label: const Text('录入学生信息'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 应用栏
  Widget _buildAppBar(BuildContext context, RecommendationResult recommendation) {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text(
          '智能推荐结果',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
            ),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.share_outlined, color: Colors.white),
          onPressed: () => _showExportOptions(context),
        ),
        IconButton(
          icon: const Icon(Icons.more_vert, color: Colors.white),
          onPressed: () => _showMoreOptions(context),
        ),
      ],
    );
  }

  /// 概览部分
  Widget _buildOverviewSection(RecommendationResult recommendation) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  '推荐概览',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildOverviewCard(
                    '冲刺院校',
                    recommendation.sprintCount.toString(),
                    Icons.trending_up,
                    const Color(0xFFFF6B6B),
                    '15-40%',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildOverviewCard(
                    '稳妥院校',
                    recommendation.steadyCount.toString(),
                    Icons.check_circle_outline,
                    const Color(0xFF51CF66),
                    '60-85%',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildOverviewCard(
                    '保底院校',
                    recommendation.safeCount.toString(),
                    Icons.security,
                    const Color(0xFF339AF0),
                    '>90%',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildRiskIndicator(recommendation.riskAnalysis),
          ],
        ),
      ),
    );
  }

  /// 概览卡片
  Widget _buildOverviewCard(
    String title,
    String count,
    IconData icon,
    Color color,
    String probability,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            count,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            probability,
            style: TextStyle(
              fontSize: 11,
              color: color.withOpacity(0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// 风险指示器
  Widget _buildRiskIndicator(RiskAnalysis riskAnalysis) {
    Color riskColor;
    switch (riskAnalysis.overallRiskLevel) {
      case 'low':
        riskColor = AppTheme.successColor;
        break;
      case 'high':
        riskColor = AppTheme.errorColor;
        break;
      default:
        riskColor = AppTheme.warningColor;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: riskColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: riskColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '整体风险等级: ${riskAnalysis.riskLevelText}',
              style: TextStyle(
                fontSize: 13,
                color: riskColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (riskAnalysis.warnings.isNotEmpty)
            Text(
              '${riskAnalysis.warnings.length} 项警告',
              style: TextStyle(
                fontSize: 12,
                color: riskColor,
              ),
            ),
        ],
      ),
    );
  }

  /// 标签栏
  Widget _buildTabBar() {
    return SliverPersistentHeader(
      pinned: true,
      delegate: _SliverTabBarDelegate(
        TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: '全部院校'),
            Tab(text: '冲刺'),
            Tab(text: '稳妥'),
            Tab(text: '保底'),
          ],
        ),
      ),
    );
  }

  /// 全部院校标签
  Widget _buildAllSchoolsTab(RecommendationResult recommendation) {
    final allSchools = recommendation.allSchools;
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: allSchools.length,
      itemBuilder: (context, index) {
        final school = allSchools[index];
        final type = _getSchoolType(recommendation, school);
        return _buildSchoolCard(school, type);
      },
    );
  }

  /// 冲刺标签
  Widget _buildSprintTab(RecommendationResult recommendation) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: recommendation.sprint.length,
      itemBuilder: (context, index) {
        return _buildSchoolCard(recommendation.sprint[index], SchoolType.sprint);
      },
    );
  }

  /// 稳妥标签
  Widget _buildSteadyTab(RecommendationResult recommendation) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: recommendation.steady.length,
      itemBuilder: (context, index) {
        return _buildSchoolCard(recommendation.steady[index], SchoolType.steady);
      },
    );
  }

  /// 保底标签
  Widget _buildSafeTab(RecommendationResult recommendation) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: recommendation.safe.length,
      itemBuilder: (context, index) {
        return _buildSchoolCard(recommendation.safe[index], SchoolType.safe);
      },
    );
  }

  /// 获取院校类型
  SchoolType _getSchoolType(RecommendationResult recommendation, SchoolRecommendation school) {
    if (recommendation.sprint.any((s) => s.schoolId == school.schoolId)) {
      return SchoolType.sprint;
    } else if (recommendation.steady.any((s) => s.schoolId == school.schoolId)) {
      return SchoolType.steady;
    } else {
      return SchoolType.safe;
    }
  }

  /// 院校卡片
  Widget _buildSchoolCard(SchoolRecommendation school, SchoolType type) {
    Color backgroundColor;
    Color borderColor;
    Color accentColor;
    String typeLabel;

    switch (type) {
      case SchoolType.sprint:
        backgroundColor = const Color(0xFFFFF5F5);
        borderColor = const Color(0xFFFF6B6B).withOpacity(0.3);
        accentColor = const Color(0xFFFF6B6B);
        typeLabel = '冲刺';
        break;
      case SchoolType.steady:
        backgroundColor = const Color(0xFFF0FFF4);
        borderColor = const Color(0xFF51CF66).withOpacity(0.3);
        accentColor = const Color(0xFF51CF66);
        typeLabel = '稳妥';
        break;
      case SchoolType.safe:
        backgroundColor = const Color(0xFFE7F5FF);
        borderColor = const Color(0xFF339AF0).withOpacity(0.3);
        accentColor = const Color(0xFF339AF0);
        typeLabel = '保底';
        break;
    }

    return Consumer<RecommendationProvider>(
      builder: (context, provider, child) {
        final isFavorite = provider.isFavorite(school.schoolId);

        return GestureDetector(
          onTap: () => _showSchoolDetail(context, school),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 顶部区域
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Logo
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: school.logo != null
                              ? Image.network(
                                  school.logo!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return _buildDefaultLogo(school.schoolName);
                                  },
                                )
                              : _buildDefaultLogo(school.schoolName),
                        ),
                      ),
                      const SizedBox(width: 16),
                      // 院校信息
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: accentColor,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    typeLabel,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    school.schoolName,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // 层次标签
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                ...school.levelTags.map((tag) => _buildTag(tag, accentColor)),
                                if (school.category != null)
                                  _buildTag(school.category!, AppTheme.textSecondary),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // 位置信息
                            Row(
                              children: [
                                Icon(
                                  Icons.location_on_outlined,
                                  size: 14,
                                  color: AppTheme.textTertiary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${school.province}${school.city != null ? ' · ${school.city}' : ''}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textTertiary,
                                  ),
                                ),
                                if (school.rank != null) ...[
                                  const SizedBox(width: 12),
                                  Icon(
                                    Icons.trending_up,
                                    size: 14,
                                    color: AppTheme.textTertiary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '全国排名 ${school.rank}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textTertiary,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      // 收藏按钮
                      IconButton(
                        icon: Icon(
                          isFavorite ? Icons.favorite : Icons.favorite_border,
                          color: isFavorite ? Colors.red : AppTheme.textTertiary,
                        ),
                        onPressed: () {
                          provider.toggleFavorite(school.schoolId);
                        },
                      ),
                    ],
                  ),
                ),
                // 分割线
                Divider(height: 1, color: borderColor),
                // 底部区域
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      // 录取概率
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '录取概率',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.textTertiary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  school.probabilityText,
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: accentColor,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // 概率进度条
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: school.admissionProbability,
                                      backgroundColor: Colors.white,
                                      valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                                      minHeight: 8,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 24),
                      // 匹配分数
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '匹配度',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textTertiary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            school.matchScoreText,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // 推荐专业
                if (school.recommendedMajors.isNotEmpty) ...[
                  Divider(height: 1, color: borderColor),
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '推荐专业',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: school.recommendedMajors.take(4).map((major) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: borderColor),
                              ),
                              child: Text(
                                major.majorName,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  /// 默认Logo
  Widget _buildDefaultLogo(String schoolName) {
    return Container(
      color: AppTheme.primaryColor.withOpacity(0.1),
      child: Center(
        child: Text(
          schoolName.substring(0, 1),
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryColor,
          ),
        ),
      ),
    );
  }

  /// 标签
  Widget _buildTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  /// 浮动操作按钮
  Widget? _buildFloatingActionButton() {
    return Consumer<RecommendationProvider>(
      builder: (context, provider, child) {
        if (provider.currentRecommendation == null) return const SizedBox.shrink();

        return FloatingActionButton.extended(
          onPressed: () => _showExportOptions(context),
          backgroundColor: AppTheme.primaryColor,
          icon: const Icon(Icons.download),
          label: const Text('导出结果'),
        );
      },
    );
  }

  /// 显示导出选项
  void _showExportOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                '导出推荐结果',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              _buildExportOption(
                icon: Icons.picture_as_pdf,
                title: '导出为PDF',
                subtitle: '生成PDF格式的推荐报告',
                onTap: () {
                  Navigator.pop(context);
                  _exportToPdf();
                },
              ),
              const SizedBox(height: 12),
              _buildExportOption(
                icon: Icons.image,
                title: '导出为图片',
                subtitle: '保存为图片格式便于分享',
                onTap: () {
                  Navigator.pop(context);
                  _exportToImage();
                },
              ),
              const SizedBox(height: 12),
              _buildExportOption(
                icon: Icons.table_chart,
                title: '导出为Excel',
                subtitle: '导出院校列表到Excel表格',
                onTap: () {
                  Navigator.pop(context);
                  _exportToExcel();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  /// 导出选项项
  Widget _buildExportOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.primaryColor),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  /// 导出为PDF
  void _exportToPdf() {
    // TODO: 实现PDF导出
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('PDF导出功能开发中...')),
    );
  }

  /// 导出为图片
  void _exportToImage() {
    // TODO: 实现图片导出
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('图片导出功能开发中...')),
    );
  }

  /// 导出为Excel
  void _exportToExcel() {
    // TODO: 实现Excel导出
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Excel导出功能开发中...')),
    );
  }

  /// 显示更多选项
  void _showMoreOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.refresh),
                title: const Text('重新生成推荐'),
                onTap: () {
                  Navigator.pop(context);
                  _regenerateRecommendation();
                },
              ),
              ListTile(
                leading: const Icon(Icons.history),
                title: const Text('查看历史记录'),
                onTap: () {
                  Navigator.pop(context);
                  // 导航到历史记录页面
                },
              ),
              ListTile(
                leading: const Icon(Icons.feedback_outlined),
                title: const Text('提交反馈'),
                onTap: () {
                  Navigator.pop(context);
                  _showFeedbackDialog();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  /// 重新生成推荐
  void _regenerateRecommendation() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('重新生成推荐'),
          content: const Text('确定要重新生成推荐方案吗？当前方案将被替换。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                // 重新生成推荐
                final studentProvider = Provider.of<StudentProvider>(context, listen: false);
                final recommendationProvider = Provider.of<RecommendationProvider>(context, listen: false);
                if (studentProvider.currentStudent != null) {
                  recommendationProvider.generateRecommendation(
                    studentProvider.currentStudent!.id,
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  /// 显示反馈对话框
  void _showFeedbackDialog() {
    int rating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('推荐反馈'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('您对本次推荐结果满意吗？'),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        icon: Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                        ),
                        onPressed: () {
                          setState(() {
                            rating = index + 1;
                          });
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: commentController,
                    decoration: const InputDecoration(
                      hintText: '请输入您的建议或意见（选填）',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('取消'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    final provider = Provider.of<RecommendationProvider>(context, listen: false);
                    if (provider.currentRecommendation != null) {
                      provider.submitFeedback(
                        provider.currentRecommendation!.recommendationId,
                        rating,
                        comment: commentController.text.isNotEmpty
                            ? commentController.text
                            : null,
                      );
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('感谢您的反馈！')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                  ),
                  child: const Text('提交'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// 显示院校详情
  void _showSchoolDetail(BuildContext context, SchoolRecommendation school) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RecommendationDetailPage(school: school),
      ),
    );
  }
}

/// 院校类型枚举
enum SchoolType {
  sprint,   // 冲刺
  steady,   // 稳妥
  safe,     // 保底
}

/// Sliver TabBar 委托
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _SliverTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
