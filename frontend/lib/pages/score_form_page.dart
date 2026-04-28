import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/student_provider.dart';
import '../theme/app_theme.dart';

/// 成绩录入页面
class ScoreFormPage extends StatefulWidget {
  final Student student;

  const ScoreFormPage({Key? key, required this.student}) : super(key: key);

  @override
  State<ScoreFormPage> createState() => _ScoreFormPageState();
}

class _ScoreFormPageState extends State<ScoreFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _totalScoreController = TextEditingController();
  final _rankController = TextEditingController();
  
  // 各科成绩控制器
  final _chineseController = TextEditingController();
  final _mathController = TextEditingController();
  final _englishController = TextEditingController();
  final _subject1Controller = TextEditingController();
  final _subject2Controller = TextEditingController();
  final _subject3Controller = TextEditingController();

  int _year = DateTime.now().year;
  bool _isLoading = false;
  bool _showSubjectScores = true; // 默认展开各科成绩

  @override
  void initState() {
    super.initState();
    // 如果学生已有成绩，填充表单
    if (widget.student.score != null) {
      _totalScoreController.text = widget.student.score.toString();
    }
    if (widget.student.rank != null) {
      _rankController.text = widget.student.rank.toString();
    }
  }

  @override
  void dispose() {
    _totalScoreController.dispose();
    _rankController.dispose();
    _chineseController.dispose();
    _mathController.dispose();
    _englishController.dispose();
    _subject1Controller.dispose();
    _subject2Controller.dispose();
    _subject3Controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('成绩录入'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildStudentInfo(),
            const SizedBox(height: 24),
            _buildSectionTitle('高考信息'),
            const SizedBox(height: 16),
            _buildYearField(),
            const SizedBox(height: 16),
            _buildCategoryInfo(),
            const SizedBox(height: 24),
            _buildSectionTitle('成绩信息'),
            const SizedBox(height: 16),
            _buildTotalScoreField(),
            const SizedBox(height: 16),
            _buildRankField(),
            const SizedBox(height: 24),
            _buildSubjectScoresToggle(),
            if (_showSubjectScores) ...[
              const SizedBox(height: 16),
              _buildSubjectScoresSection(),
            ],
            const SizedBox(height: 32),
            _buildSubmitButton(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.accentColor],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              widget.student.gender == 'male' ? Icons.boy : Icons.girl,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.student.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.student.province} · ${widget.student.category}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: AppTheme.textPrimary,
      ),
    );
  }

  Widget _buildYearField() {
    return DropdownButtonFormField<int>(
      value: _year,
      decoration: const InputDecoration(
        labelText: '高考年份',
        prefixIcon: Icon(Icons.calendar_today),
      ),
      items: List.generate(5, (index) {
        final year = DateTime.now().year - 2 + index;
        return DropdownMenuItem(
          value: year,
          child: Text('$year年'),
        );
      }),
      onChanged: (value) {
        if (value != null) {
          setState(() => _year = value);
        }
      },
    );
  }

  Widget _buildCategoryInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '科类: ${widget.student.category}',
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTotalScoreField() {
    return TextFormField(
      controller: _totalScoreController,
      keyboardType: TextInputType.number,
      decoration: const InputDecoration(
        labelText: '高考总分',
        hintText: '请输入高考总分',
        prefixIcon: Icon(Icons.grade),
        suffixText: '分',
        helperText: '满分750分',
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入高考总分';
        }
        final score = int.tryParse(value);
        if (score == null || score < 0 || score > 750) {
          return '请输入0-750之间的分数';
        }
        return null;
      },
    );
  }

  Widget _buildRankField() {
    return TextFormField(
      controller: _rankController,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: '省排名',
        hintText: '请输入省排名',
        prefixIcon: const Icon(Icons.emoji_events),
        suffixText: '名',
        helperText: '请参考省考试院发布的"一分一段表"',
        helperMaxLines: 2,
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入省排名';
        }
        final rank = int.tryParse(value);
        if (rank == null || rank < 1) {
          return '请输入有效的排名';
        }
        return null;
      },
    );
  }

  Widget _buildSubjectScoresToggle() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              '各科成绩（必填）',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
          ),
          InkWell(
            onTap: () => setState(() => _showSubjectScores = !_showSubjectScores),
            child: Row(
              children: [
                Text(
                  _showSubjectScores ? '收起' : '展开',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Icon(
                  _showSubjectScores ? Icons.expand_less : Icons.expand_more,
                  color: AppTheme.primaryColor,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectScoresSection() {
    return Column(
      children: [
        _buildSubjectScoreField('语文', _chineseController, 150),
        const SizedBox(height: 12),
        _buildSubjectScoreField('数学', _mathController, 150),
        const SizedBox(height: 12),
        _buildSubjectScoreField('英语', _englishController, 150),
        const SizedBox(height: 12),
        _buildSubjectScoreField(
          _getSubject1Name(),
          _subject1Controller,
          100,
        ),
        const SizedBox(height: 12),
        _buildSubjectScoreField(
          _getSubject2Name(),
          _subject2Controller,
          100,
        ),
        const SizedBox(height: 12),
        _buildSubjectScoreField(
          _getSubject3Name(),
          _subject3Controller,
          100,
        ),
      ],
    );
  }

  Widget _buildSubjectScoreField(
    String label,
    TextEditingController controller,
    int maxScore,
  ) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: '$label *',
        hintText: '请输入$label成绩',
        suffixText: '分',
        helperText: '满分$maxScore分',
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入$label成绩';
        }
        final score = int.tryParse(value);
        if (score == null || score < 0 || score > maxScore) {
          return '请输入0-$maxScore之间的分数';
        }
        return null;
      },
    );
  }

  String _getSubject1Name() {
    if (widget.student.subjectType == 'physics') {
      return '物理';
    } else {
      return '历史';
    }
  }

  String _getSubject2Name() {
    return '选科2';
  }

  String _getSubject3Name() {
    return '选科3';
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleSubmit,
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                '保存成绩',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final totalScore = int.parse(_totalScoreController.text.trim());
      final rank = int.parse(_rankController.text.trim());

      // 构建各科成绩JSON
      final subjectScores = <String, int>{};
      if (_chineseController.text.isNotEmpty) {
        subjectScores['chinese'] = int.parse(_chineseController.text);
      }
      if (_mathController.text.isNotEmpty) {
        subjectScores['math'] = int.parse(_mathController.text);
      }
      if (_englishController.text.isNotEmpty) {
        subjectScores['english'] = int.parse(_englishController.text);
      }
      if (_subject1Controller.text.isNotEmpty) {
        subjectScores['subject1'] = int.parse(_subject1Controller.text);
      }
      if (_subject2Controller.text.isNotEmpty) {
        subjectScores['subject2'] = int.parse(_subject2Controller.text);
      }
      if (_subject3Controller.text.isNotEmpty) {
        subjectScores['subject3'] = int.parse(_subject3Controller.text);
      }

      // 更新学生信息（包含各科成绩）
      final provider = context.read<StudentProvider>();
      await provider.updateStudentWithScores(
        widget.student.id,
        totalScore,
        rank,
        subjectScores,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('成绩保存成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('保存失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
