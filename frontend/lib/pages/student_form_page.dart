import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/student_provider.dart';
import '../theme/app_theme.dart';

/// 学生表单页面（添加/编辑）
class StudentFormPage extends StatefulWidget {
  final Student? student;

  const StudentFormPage({Key? key, this.student}) : super(key: key);

  @override
  State<StudentFormPage> createState() => _StudentFormPageState();
}

class _StudentFormPageState extends State<StudentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _cityController = TextEditingController();
  final _highSchoolController = TextEditingController();
  final _scoreController = TextEditingController();
  final _rankController = TextEditingController();

  String _gender = 'male';
  String _province = '广东';
  String _subjectType = 'physics';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.student != null) {
      _nameController.text = widget.student!.name;
      _gender = widget.student!.gender;
      _province = widget.student!.province;
      _cityController.text = widget.student!.city ?? '';
      _highSchoolController.text = widget.student!.highSchool ?? '';
      _subjectType = widget.student!.subjectType;
      if (widget.student!.score != null) {
        _scoreController.text = widget.student!.score.toString();
      }
      if (widget.student!.rank != null) {
        _rankController.text = widget.student!.rank.toString();
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _highSchoolController.dispose();
    _scoreController.dispose();
    _rankController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.student != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? '编辑学生' : '添加学生'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildSectionTitle('基本信息'),
            const SizedBox(height: 16),
            _buildNameField(),
            const SizedBox(height: 16),
            _buildGenderField(),
            const SizedBox(height: 24),
            _buildSectionTitle('地区信息'),
            const SizedBox(height: 16),
            _buildProvinceField(),
            const SizedBox(height: 16),
            _buildCityField(),
            const SizedBox(height: 16),
            _buildHighSchoolField(),
            const SizedBox(height: 24),
            _buildSectionTitle('考试信息'),
            const SizedBox(height: 16),
            _buildSubjectTypeField(),
            const SizedBox(height: 16),
            _buildScoreField(),
            const SizedBox(height: 16),
            _buildRankField(),
            const SizedBox(height: 32),
            _buildSubmitButton(isEdit),
            const SizedBox(height: 20),
          ],
        ),
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

  Widget _buildNameField() {
    return TextFormField(
      controller: _nameController,
      decoration: const InputDecoration(
        labelText: '姓名',
        hintText: '请输入学生姓名',
        prefixIcon: Icon(Icons.person),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入姓名';
        }
        return null;
      },
    );
  }

  Widget _buildGenderField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '性别',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildGenderOption('male', '男生', Icons.boy),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildGenderOption('female', '女生', Icons.girl),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderOption(String value, String label, IconData icon) {
    final isSelected = _gender == value;
    return InkWell(
      onTap: () => setState(() => _gender = value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : AppTheme.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProvinceField() {
    return DropdownButtonFormField<String>(
      value: _province,
      decoration: const InputDecoration(
        labelText: '省份',
        prefixIcon: Icon(Icons.location_on),
      ),
      items: const [
        DropdownMenuItem(value: '广东', child: Text('广东')),
        DropdownMenuItem(value: '湖北', child: Text('湖北')),
        DropdownMenuItem(value: '湖南', child: Text('湖南')),
        DropdownMenuItem(value: '江苏', child: Text('江苏')),
        DropdownMenuItem(value: '福建', child: Text('福建')),
        DropdownMenuItem(value: '河北', child: Text('河北')),
        DropdownMenuItem(value: '辽宁', child: Text('辽宁')),
        DropdownMenuItem(value: '重庆', child: Text('重庆')),
      ],
      onChanged: (value) {
        if (value != null) {
          setState(() => _province = value);
        }
      },
    );
  }

  Widget _buildCityField() {
    return TextFormField(
      controller: _cityController,
      decoration: const InputDecoration(
        labelText: '城市（选填）',
        hintText: '请输入城市',
        prefixIcon: Icon(Icons.location_city),
      ),
    );
  }

  Widget _buildHighSchoolField() {
    return TextFormField(
      controller: _highSchoolController,
      decoration: const InputDecoration(
        labelText: '高中学校（选填）',
        hintText: '请输入高中学校名称',
        prefixIcon: Icon(Icons.school),
      ),
    );
  }

  Widget _buildSubjectTypeField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '选科类型',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildSubjectOption('physics', '物理类', Icons.science),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSubjectOption('history', '历史类', Icons.history_edu),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSubjectOption(String value, String label, IconData icon) {
    final isSelected = _subjectType == value;
    return InkWell(
      onTap: () => setState(() => _subjectType = value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : AppTheme.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreField() {
    return TextFormField(
      controller: _scoreController,
      keyboardType: TextInputType.number,
      decoration: const InputDecoration(
        labelText: '高考总分（选填）',
        hintText: '请输入高考总分',
        prefixIcon: Icon(Icons.grade),
        suffixText: '分',
      ),
      validator: (value) {
        if (value != null && value.isNotEmpty) {
          final score = int.tryParse(value);
          if (score == null || score < 0 || score > 750) {
            return '请输入0-750之间的分数';
          }
        }
        return null;
      },
    );
  }

  Widget _buildRankField() {
    return TextFormField(
      controller: _rankController,
      keyboardType: TextInputType.number,
      decoration: const InputDecoration(
        labelText: '省排名（选填）',
        hintText: '请输入省排名',
        prefixIcon: Icon(Icons.emoji_events),
        suffixText: '名',
      ),
      validator: (value) {
        if (value != null && value.isNotEmpty) {
          final rank = int.tryParse(value);
          if (rank == null || rank < 1) {
            return '请输入有效的排名';
          }
        }
        return null;
      },
    );
  }

  Widget _buildSubmitButton(bool isEdit) {
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
            : Text(
                isEdit ? '保存修改' : '添加学生',
                style: const TextStyle(
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
      final student = Student(
        id: widget.student?.id ?? '',
        name: _nameController.text.trim(),
        gender: _gender,
        province: _province,
        city: _cityController.text.trim().isEmpty
            ? null
            : _cityController.text.trim(),
        highSchool: _highSchoolController.text.trim().isEmpty
            ? null
            : _highSchoolController.text.trim(),
        subjectType: _subjectType,
        score: _scoreController.text.trim().isEmpty
            ? null
            : int.parse(_scoreController.text.trim()),
        rank: _rankController.text.trim().isEmpty
            ? null
            : int.parse(_rankController.text.trim()),
      );

      final provider = context.read<StudentProvider>();
      await provider.addStudent(student);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.student != null ? '修改成功' : '添加成功'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('操作失败: $e'),
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
