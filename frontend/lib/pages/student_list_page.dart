import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/student_provider.dart';
import '../theme/app_theme.dart';
import 'student_form_page.dart';
import 'score_form_page.dart';

/// 学生列表页面
class StudentListPage extends StatefulWidget {
  const StudentListPage({Key? key}) : super(key: key);

  @override
  State<StudentListPage> createState() => _StudentListPageState();
}

class _StudentListPageState extends State<StudentListPage> {
  @override
  void initState() {
    super.initState();
    // 延迟加载，确保context可用
    Future.delayed(Duration.zero, () {
      _loadStudents();
    });
  }

  Future<void> _loadStudents() async {
    try {
      final provider = context.read<StudentProvider>();
      await provider.loadStudents();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载失败: $e'),
            backgroundColor: AppTheme.errorColor,
            action: SnackBarAction(
              label: '重试',
              textColor: Colors.white,
              onPressed: _loadStudents,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('学生管理'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _navigateToAddStudent(),
          ),
        ],
      ),
      body: Consumer<StudentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.students.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: _loadStudents,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.students.length,
              itemBuilder: (context, index) {
                final student = provider.students[index];
                final isSelected = provider.currentStudent?.id == student.id;
                return _buildStudentCard(student, isSelected, provider);
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToAddStudent(),
        icon: const Icon(Icons.person_add),
        label: const Text('添加学生'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.person_outline,
            size: 80,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            '还没有添加学生',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角"+"添加学生信息',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _navigateToAddStudent(),
            icon: const Icon(Icons.add),
            label: const Text('添加学生'),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(Student student, bool isSelected, StudentProvider provider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isSelected ? 4 : 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: () => provider.setCurrentStudent(student),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 头像
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isSelected
                        ? [AppTheme.primaryColor, AppTheme.accentColor]
                        : [Colors.grey.shade300, Colors.grey.shade400],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  student.gender == 'male' ? Icons.boy : Icons.girl,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              // 信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          student.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              '当前',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildInfoChip(
                          Icons.location_on_outlined,
                          student.province,
                        ),
                        const SizedBox(width: 8),
                        _buildInfoChip(
                          Icons.school_outlined,
                          student.category,
                        ),
                      ],
                    ),
                    if (student.score != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          _buildInfoChip(
                            Icons.grade,
                            '${student.score}分',
                            color: AppTheme.successColor,
                          ),
                          const SizedBox(width: 8),
                          if (student.rank != null)
                            _buildInfoChip(
                              Icons.emoji_events,
                              '第${student.rank}名',
                              color: AppTheme.warningColor,
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              // 操作按钮
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert),
                onSelected: (value) {
                  if (value == 'edit') {
                    _navigateToEditStudent(student);
                  } else if (value == 'score') {
                    _navigateToScoreForm(student);
                  } else if (value == 'delete') {
                    _confirmDelete(student);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'score',
                    child: Row(
                      children: [
                        Icon(Icons.grade, size: 20, color: AppTheme.successColor),
                        SizedBox(width: 8),
                        Text('录入成绩', style: TextStyle(color: AppTheme.successColor)),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 20),
                        SizedBox(width: 8),
                        Text('编辑'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, size: 20, color: AppTheme.errorColor),
                        SizedBox(width: 8),
                        Text('删除', style: TextStyle(color: AppTheme.errorColor)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, {Color? color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (color ?? AppTheme.textSecondary).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: color ?? AppTheme.textSecondary,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color ?? AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _navigateToAddStudent() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const StudentFormPage(),
      ),
    );

    if (result == true) {
      _loadStudents();
    }
  }

  Future<void> _navigateToEditStudent(Student student) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentFormPage(student: student),
      ),
    );

    if (result == true) {
      _loadStudents();
    }
  }

  Future<void> _navigateToScoreForm(Student student) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ScoreFormPage(student: student),
      ),
    );

    if (result == true) {
      _loadStudents();
    }
  }

  Future<void> _confirmDelete(Student student) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除学生"${student.name}"吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.errorColor,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: 实现删除功能
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('删除功能待实现')),
      );
    }
  }
}
