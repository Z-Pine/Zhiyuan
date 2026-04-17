import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/recommendation_provider.dart';
import '../providers/student_provider.dart';
import '../theme/app_theme.dart';
import 'recommendation_result_page.dart';

class RecommendationTab extends StatelessWidget {
  const RecommendationTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader()),
            SliverToBoxAdapter(child: _buildStudentInfo(context)),
            SliverToBoxAdapter(child: _buildGenerateButton(context)),
            SliverToBoxAdapter(child: _buildQuickPreview(context)),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '智能推荐',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 8),
          Text(
            '基于AI算法，为您推荐最适合的院校和专业',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentInfo(BuildContext context) {
    return Consumer<StudentProvider>(
      builder: (context, provider, child) {
        final student = provider.currentStudent;
        
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryColor, AppTheme.accentColor],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.person, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student?.name ?? '未选择学生',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        student != null 
                            ? '${student.category} · ${student.score}分 · 全省${student.rank}名'
                            : '请先选择或添加学生信息',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: student != null 
                        ? AppTheme.successColor.withOpacity(0.1)
                        : AppTheme.warningColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    student != null ? '数据完整' : '待完善',
                    style: TextStyle(
                      fontSize: 12,
                      color: student != null ? AppTheme.successColor : AppTheme.warningColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGenerateButton(BuildContext context) {
    return Consumer2<StudentProvider, RecommendationProvider>(
      builder: (context, studentProvider, recommendationProvider, child) {
        final hasStudent = studentProvider.currentStudent != null;
        final isGenerating = recommendationProvider.isGenerating;

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: hasStudent && !isGenerating
                      ? () => _generateRecommendation(context)
                      : null,
                  icon: isGenerating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.auto_awesome),
                  label: Text(
                    isGenerating ? '生成中...' : '一键生成推荐方案',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              if (recommendationProvider.currentRecommendation != null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () => _viewRecommendationResult(context),
                    icon: const Icon(Icons.visibility),
                    label: const Text(
                      '查看推荐结果',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: BorderSide(color: AppTheme.primaryColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickPreview(BuildContext context) {
    return Consumer<RecommendationProvider>(
      builder: (context, provider, child) {
        final recommendation = provider.currentRecommendation;
        
        if (recommendation == null) {
          return _buildEmptyPreview();
        }

        return Container(
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '推荐概览',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () => _viewRecommendationResult(context),
                    child: const Text('查看全部'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildPreviewCard(
                      '冲刺',
                      recommendation.sprintCount.toString(),
                      const Color(0xFFFF6B6B),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPreviewCard(
                      '稳妥',
                      recommendation.steadyCount.toString(),
                      const Color(0xFF51CF66),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPreviewCard(
                      '保底',
                      recommendation.safeCount.toString(),
                      const Color(0xFF339AF0),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (recommendation.sprint.isNotEmpty)
                _buildPreviewSchool('冲刺推荐', recommendation.sprint.first, const Color(0xFFFF6B6B)),
              if (recommendation.steady.isNotEmpty) ...[
                const SizedBox(height: 8),
                _buildPreviewSchool('稳妥推荐', recommendation.steady.first, const Color(0xFF51CF66)),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyPreview() {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        children: [
          Icon(
            Icons.lightbulb_outline,
            size: 48,
            color: AppTheme.textTertiary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            '生成推荐方案后，这里将显示推荐概览',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textTertiary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewCard(String title, String count, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
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
        ],
      ),
    );
  }

  Widget _buildPreviewSchool(String label, SchoolRecommendation school, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              school.schoolName,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            school.probabilityText,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _generateRecommendation(BuildContext context) async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final recommendationProvider = Provider.of<RecommendationProvider>(context, listen: false);
    
    if (studentProvider.currentStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先选择学生')),
      );
      return;
    }

    final success = await recommendationProvider.generateRecommendation(
      studentProvider.currentStudent!.id,
    );

    if (success && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('推荐方案生成成功！')),
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(recommendationProvider.errorMessage ?? '生成失败'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _viewRecommendationResult(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const RecommendationResultPage(),
      ),
    );
  }
}
