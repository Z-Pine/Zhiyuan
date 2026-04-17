import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recommendation_provider.dart';
import '../widgets/export_button.dart';
import '../widgets/skeleton.dart';

/// T074: 志愿表页
/// 展示和管理用户的志愿填报方案
class VolunteerTablePage extends StatefulWidget {
  final int? recommendationId;

  const VolunteerTablePage({
    Key? key,
    this.recommendationId,
  }) : super(key: key);

  @override
  State<VolunteerTablePage> createState() => _VolunteerTablePageState();
}

class _VolunteerTablePageState extends State<VolunteerTablePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Map<String, dynamic>> _selectedSchools = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // 加载推荐数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.recommendationId != null) {
        context.read<RecommendationProvider>().fetchRecommendationDetail(
          widget.recommendationId!,
        );
      }
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
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('我的志愿表'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey.shade600,
          indicatorColor: Colors.blue,
          tabs: const [
            Tab(text: '全部'),
            Tab(text: '已收藏'),
            Tab(text: '已填报'),
          ],
        ),
        actions: [
          // 导出按钮
          Consumer<RecommendationProvider>(
            builder: (context, provider, child) {
              if (provider.currentRecommendation == null) {
                return const SizedBox.shrink();
              }
              final data = provider.currentRecommendation!;
              return ExportButton(
                studentName: data['student_name'] ?? '考生',
                totalScore: data['total_score'] ?? 0,
                rank: data['rank'] ?? 0,
                recommendations: data['recommendations'] ?? [],
              );
            },
          ),
        ],
      ),
      body: Consumer<RecommendationProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const RecommendationSkeleton();
          }

          if (provider.error != null) {
            return _buildErrorView(provider.error!);
          }

          final recommendation = provider.currentRecommendation;
          if (recommendation == null) {
            return _buildEmptyView();
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildSchoolList(recommendation['recommendations'] ?? [], 'all'),
              _buildSchoolList(recommendation['recommendations'] ?? [], 'favorite'),
              _buildSchoolList(recommendation['recommendations'] ?? [], 'selected'),
            ],
          );
        },
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  /// 构建院校列表
  Widget _buildSchoolList(List<dynamic> recommendations, String filter) {
    List<dynamic> filtered = recommendations;
    
    if (filter == 'favorite') {
      filtered = recommendations.where((r) => r['is_favorite'] == true).toList();
    } else if (filter == 'selected') {
      filtered = recommendations.where((r) => r['is_selected'] == true).toList();
    }

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              filter == 'favorite' ? Icons.favorite_border : Icons.list,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              filter == 'favorite' ? '暂无收藏院校' : '暂无院校',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

    // 按类型分组
    final sprintList = filtered.where((r) => r['type'] == 'sprint').toList();
    final steadyList = filtered.where((r) => r['type'] == 'steady').toList();
    final safeList = filtered.where((r) => r['type'] == 'safe').toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (sprintList.isNotEmpty) ...[
          _buildSectionHeader('冲刺院校', sprintList.length, Colors.orange),
          ...sprintList.map((item) => _buildSchoolCard(item)),
          const SizedBox(height: 16),
        ],
        if (steadyList.isNotEmpty) ...[
          _buildSectionHeader('稳妥院校', steadyList.length, Colors.blue),
          ...steadyList.map((item) => _buildSchoolCard(item)),
          const SizedBox(height: 16),
        ],
        if (safeList.isNotEmpty) ...[
          _buildSectionHeader('保底院校', safeList.length, Colors.green),
          ...safeList.map((item) => _buildSchoolCard(item)),
        ],
      ],
    );
  }

  /// 构建分组标题
  Widget _buildSectionHeader(String title, int count, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$count所',
              style: TextStyle(
                fontSize: 12,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建院校卡片
  Widget _buildSchoolCard(Map<String, dynamic> item) {
    final schoolName = item['school_name'] ?? '未知院校';
    final majorName = item['major_name'] ?? '未知专业';
    final minScore = item['min_score'] ?? '-';
    final minRank = item['min_rank'] ?? '-';
    final probability = item['probability'] ?? 0;
    final isFavorite = item['is_favorite'] ?? false;
    final isSelected = item['is_selected'] ?? false;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? Colors.blue : Colors.grey.shade200,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 学校Logo占位
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.school,
                    size: 28,
                    color: Colors.grey.shade400,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schoolName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        majorName,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                // 操作按钮
                Column(
                  children: [
                    IconButton(
                      onPressed: () => _toggleFavorite(item),
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.grey,
                      ),
                    ),
                    Checkbox(
                      value: isSelected,
                      onChanged: (value) => _toggleSelected(item, value),
                      activeColor: Colors.blue,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            // 录取数据
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildDataItem('2024最低分', '$minScore'),
                _buildDataItem('最低位次', '$minRank'),
                _buildProbabilityItem(probability),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 构建数据项
  Widget _buildDataItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    );
  }

  /// 构建录取概率项
  Widget _buildProbabilityItem(int probability) {
    Color color;
    if (probability >= 80) {
      color = Colors.green;
    } else if (probability >= 50) {
      color = Colors.blue;
    } else {
      color = Colors.orange;
    }

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            '$probability%',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '录取概率',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    );
  }

  /// 构建底部栏
  Widget _buildBottomBar() {
    return Consumer<RecommendationProvider>(
      builder: (context, provider, child) {
        final recommendation = provider.currentRecommendation;
        if (recommendation == null) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '已选择 ${_selectedSchools.length} 所院校',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '建议填报 45 个志愿',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _selectedSchools.isEmpty ? null : _saveVolunteerTable,
                  icon: const Icon(Icons.save),
                  label: const Text('保存志愿表'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// 构建空视图
  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.table_chart_outlined,
            size: 80,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            '暂无志愿表',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '先生成推荐结果，再管理志愿表',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pushNamed('/recommendation');
            },
            icon: const Icon(Icons.add),
            label: const Text('生成推荐'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  /// 构建错误视图
  Widget _buildErrorView(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            '加载失败',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              if (widget.recommendationId != null) {
                context.read<RecommendationProvider>().fetchRecommendationDetail(
                  widget.recommendationId!,
                );
              }
            },
            icon: const Icon(Icons.refresh),
            label: const Text('重新加载'),
          ),
        ],
      ),
    );
  }

  /// 切换收藏状态
  void _toggleFavorite(Map<String, dynamic> item) {
    setState(() {
      item['is_favorite'] = !(item['is_favorite'] ?? false);
    });
    // TODO: 调用API保存状态
  }

  /// 切换选择状态
  void _toggleSelected(Map<String, dynamic> item, bool? value) {
    setState(() {
      item['is_selected'] = value ?? false;
      if (item['is_selected']) {
        if (!_selectedSchools.contains(item)) {
          _selectedSchools.add(item);
        }
      } else {
        _selectedSchools.remove(item);
      }
    });
  }

  /// 保存志愿表
  void _saveVolunteerTable() {
    // TODO: 调用API保存志愿表
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('志愿表已保存')),
    );
  }
}
