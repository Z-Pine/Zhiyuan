import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/student_provider.dart';
import '../providers/profile_provider.dart';
import '../theme/app_theme.dart';

/// 学生画像问卷页面
class ProfileFormPage extends StatefulWidget {
  final Student student;

  const ProfileFormPage({Key? key, required this.student}) : super(key: key);

  @override
  State<ProfileFormPage> createState() => _ProfileFormPageState();
}

class _ProfileFormPageState extends State<ProfileFormPage> {
  int _currentStep = 0;
  bool _isLoading = false;

  // 性格测评
  String? _mbtiType;
  
  // 职业兴趣
  final List<String> _selectedInterests = [];
  
  // 能力特长
  final List<String> _selectedAbilities = [];
  
  // 职业偏好
  String _careerPreference = 'stable';
  String _studyStyle = 'theory';
  String _riskPreference = 'low';
  
  // 地域偏好
  final List<String> _selectedProvinces = [];
  bool _stayNearHome = false;
  
  // 院校类型偏好
  final List<String> _selectedUniversityTypes = [];
  
  // 家庭期望
  final _familyExpectationsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _familyExpectationsController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    // TODO: 加载已有画像数据
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('学生画像'),
        actions: [
          TextButton(
            onPressed: _currentStep < 4 ? null : _handleSubmit,
            child: Text(
              '完成',
              style: TextStyle(
                color: _currentStep < 4 ? Colors.grey : Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildProgressIndicator(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _buildStepContent(),
          ),
        ],
      ),
      bottomNavigationBar: _buildNavigationButtons(),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: List.generate(5, (index) {
              final isCompleted = index < _currentStep;
              final isCurrent = index == _currentStep;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index < 4 ? 8 : 0),
                  decoration: BoxDecoration(
                    color: isCompleted || isCurrent
                        ? AppTheme.primaryColor
                        : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          Text(
            _getStepTitle(_currentStep),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '第${_currentStep + 1}步，共5步',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  String _getStepTitle(int step) {
    switch (step) {
      case 0:
        return '性格特点';
      case 1:
        return '兴趣爱好';
      case 2:
        return '职业倾向';
      case 3:
        return '地域偏好';
      case 4:
        return '家庭期望';
      default:
        return '';
    }
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildPersonalityStep();
      case 1:
        return _buildInterestsStep();
      case 2:
        return _buildCareerStep();
      case 3:
        return _buildLocationStep();
      case 4:
        return _buildFamilyStep();
      default:
        return Container();
    }
  }

  // 第1步：性格特点
  Widget _buildPersonalityStep() {
    final mbtiTypes = [
      {'code': 'INTJ', 'name': '建筑师', 'desc': '理性、独立、善于规划'},
      {'code': 'INTP', 'name': '逻辑学家', 'desc': '创新、好奇、善于分析'},
      {'code': 'ENTJ', 'name': '指挥官', 'desc': '果断、领导力强'},
      {'code': 'ENTP', 'name': '辩论家', 'desc': '机智、善于辩论'},
      {'code': 'INFJ', 'name': '提倡者', 'desc': '理想主义、有洞察力'},
      {'code': 'INFP', 'name': '调停者', 'desc': '理想主义、富有同情心'},
      {'code': 'ENFJ', 'name': '主人公', 'desc': '有魅力、善于激励他人'},
      {'code': 'ENFP', 'name': '竞选者', 'desc': '热情、创造力强'},
      {'code': 'ISTJ', 'name': '物流师', 'desc': '务实、可靠、有条理'},
      {'code': 'ISFJ', 'name': '守卫者', 'desc': '细心、负责、忠诚'},
      {'code': 'ESTJ', 'name': '总经理', 'desc': '高效、善于管理'},
      {'code': 'ESFJ', 'name': '执政官', 'desc': '热心、善于合作'},
      {'code': 'ISTP', 'name': '鉴赏家', 'desc': '灵活、善于解决问题'},
      {'code': 'ISFP', 'name': '探险家', 'desc': '灵活、艺术气质'},
      {'code': 'ESTP', 'name': '企业家', 'desc': '精力充沛、善于冒险'},
      {'code': 'ESFP', 'name': '表演者', 'desc': '热情、善于社交'},
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          '请选择最符合孩子性格的类型',
          style: TextStyle(
            fontSize: 15,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        ...mbtiTypes.map((type) => _buildMBTIOption(
              type['code']!,
              type['name']!,
              type['desc']!,
            )),
      ],
    );
  }

  Widget _buildMBTIOption(String code, String name, String desc) {
    final isSelected = _mbtiType == code;
    return GestureDetector(
      onTap: () => setState(() => _mbtiType = code),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryColor
                    : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  code.substring(0, 2),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$code - $name',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? AppTheme.primaryColor
                          : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: AppTheme.primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  // 第2步：兴趣爱好
  Widget _buildInterestsStep() {
    final interests = [
      {'id': 'science', 'name': '科学研究', 'icon': Icons.science},
      {'id': 'technology', 'name': '技术开发', 'icon': Icons.computer},
      {'id': 'art', 'name': '艺术创作', 'icon': Icons.palette},
      {'id': 'business', 'name': '商业管理', 'icon': Icons.business},
      {'id': 'social', 'name': '社会服务', 'icon': Icons.people},
      {'id': 'education', 'name': '教育培训', 'icon': Icons.school},
      {'id': 'medical', 'name': '医疗健康', 'icon': Icons.local_hospital},
      {'id': 'law', 'name': '法律政治', 'icon': Icons.gavel},
      {'id': 'media', 'name': '传媒文化', 'icon': Icons.movie},
      {'id': 'sports', 'name': '体育运动', 'icon': Icons.sports_basketball},
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          '请选择孩子感兴趣的领域（可多选）',
          style: TextStyle(
            fontSize: 15,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: interests.map((interest) {
            final isSelected = _selectedInterests.contains(interest['id']);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedInterests.remove(interest['id']);
                  } else {
                    _selectedInterests.add(interest['id'] as String);
                  }
                });
              },
              child: Container(
                width: (MediaQuery.of(context).size.width - 64) / 2,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primaryColor.withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.primaryColor
                        : Colors.grey.shade300,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      interest['icon'] as IconData,
                      size: 32,
                      color: isSelected
                          ? AppTheme.primaryColor
                          : Colors.grey.shade600,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      interest['name'] as String,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.normal,
                        color: isSelected
                            ? AppTheme.primaryColor
                            : AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // 第3步：职业倾向
  Widget _buildCareerStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionTitle('职业发展偏好'),
        const SizedBox(height: 12),
        _buildRadioOption(
          '稳定优先',
          '希望工作稳定，收入稳定',
          'stable',
          _careerPreference,
          (value) => setState(() => _careerPreference = value!),
        ),
        _buildRadioOption(
          '高薪优先',
          '追求高收入，愿意承担压力',
          'high_salary',
          _careerPreference,
          (value) => setState(() => _careerPreference = value!),
        ),
        _buildRadioOption(
          '兴趣优先',
          '从事感兴趣的工作，薪资其次',
          'interest',
          _careerPreference,
          (value) => setState(() => _careerPreference = value!),
        ),
        _buildRadioOption(
          '发展优先',
          '看重职业发展空间和晋升机会',
          'development',
          _careerPreference,
          (value) => setState(() => _careerPreference = value!),
        ),
        const SizedBox(height: 24),
        _buildSectionTitle('学习风格'),
        const SizedBox(height: 12),
        _buildRadioOption(
          '理论研究型',
          '喜欢深入研究理论知识',
          'theory',
          _studyStyle,
          (value) => setState(() => _studyStyle = value!),
        ),
        _buildRadioOption(
          '实践应用型',
          '喜欢动手实践，解决实际问题',
          'practice',
          _studyStyle,
          (value) => setState(() => _studyStyle = value!),
        ),
        _buildRadioOption(
          '综合平衡型',
          '理论与实践并重',
          'balanced',
          _studyStyle,
          (value) => setState(() => _studyStyle = value!),
        ),
      ],
    );
  }

  // 第4步：地域偏好
  Widget _buildLocationStep() {
    final provinces = ['广东', '北京', '上海', '江苏', '浙江', '湖北', '湖南', '四川'];
    final universityTypes = [
      '985工程',
      '211工程',
      '双一流',
      '普通本科',
      '特色院校',
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionTitle('地域偏好'),
        const SizedBox(height: 12),
        CheckboxListTile(
          title: const Text('希望留在本省或周边'),
          value: _stayNearHome,
          onChanged: (value) => setState(() => _stayNearHome = value!),
          controlAffinity: ListTileControlAffinity.leading,
        ),
        const SizedBox(height: 12),
        const Text(
          '可接受的省份（可多选）',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: provinces.map((province) {
            final isSelected = _selectedProvinces.contains(province);
            return FilterChip(
              label: Text(province),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _selectedProvinces.add(province);
                  } else {
                    _selectedProvinces.remove(province);
                  }
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        _buildSectionTitle('院校类型偏好'),
        const SizedBox(height: 12),
        ...universityTypes.map((type) {
          final isSelected = _selectedUniversityTypes.contains(type);
          return CheckboxListTile(
            title: Text(type),
            value: isSelected,
            onChanged: (value) {
              setState(() {
                if (value!) {
                  _selectedUniversityTypes.add(type);
                } else {
                  _selectedUniversityTypes.remove(type);
                }
              });
            },
            controlAffinity: ListTileControlAffinity.leading,
          );
        }),
      ],
    );
  }

  // 第5步：家庭期望
  Widget _buildFamilyStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildSectionTitle('家庭期望'),
        const SizedBox(height: 12),
        const Text(
          '请描述您对孩子未来职业发展的期望',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _familyExpectationsController,
          maxLines: 8,
          decoration: const InputDecoration(
            hintText: '例如：希望孩子从事稳定的工作，最好是教师或公务员...',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.successColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            children: [
              Icon(Icons.check_circle, color: AppTheme.successColor),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  '完成画像后，系统将为您生成个性化的志愿推荐方案',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.successColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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

  Widget _buildRadioOption(
    String title,
    String subtitle,
    String value,
    String groupValue,
    ValueChanged<String?> onChanged,
  ) {
    return RadioListTile<String>(
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
      ),
      value: value,
      groupValue: groupValue,
      onChanged: onChanged,
      controlAffinity: ListTileControlAffinity.leading,
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('上一步'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _currentStep < 4 ? _handleNext : _handleSubmit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(_currentStep < 4 ? '下一步' : '完成'),
            ),
          ),
        ],
      ),
    );
  }

  void _handleNext() {
    // 验证当前步骤
    if (_currentStep == 0 && _mbtiType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请选择性格类型')),
      );
      return;
    }
    if (_currentStep == 1 && _selectedInterests.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请至少选择一个兴趣领域')),
      );
      return;
    }

    setState(() => _currentStep++);
  }

  Future<void> _handleSubmit() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final profileData = {
        'mbti_type': _mbtiType,
        'interests': _selectedInterests,
        'abilities': _selectedAbilities,
        'career_preferences': {
          'career_preference': _careerPreference,
          'study_style': _studyStyle,
          'risk_preference': _riskPreference,
        },
        'province_preferences': _selectedProvinces,
        'university_type_preferences': _selectedUniversityTypes,
        'family_expectations': _familyExpectationsController.text.trim(),
      };

      final provider = context.read<ProfileProvider>();
      await provider.saveProfile(widget.student.id, profileData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('学生画像保存成功'),
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
