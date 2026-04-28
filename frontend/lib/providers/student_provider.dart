import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class StudentProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  List<Student> _students = [];
  Student? _currentStudent;
  bool _isLoading = false;
  String? _errorMessage;

  StudentProvider(this._apiService);

  List<Student> get students => _students;
  Student? get currentStudent => _currentStudent;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadStudents() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/api/students');
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        _students = (data as List).map((e) => Student.fromJson(e)).toList();
      } else {
        _errorMessage = _apiService.getMessage(response);
        // 如果是401错误，清空学生列表但不抛出异常
        _students = [];
      }
    } catch (e) {
      _errorMessage = '网络错误: $e';
      _students = [];
      // 不抛出异常，让页面可以正常显示
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addStudent(Student student) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('📝 准备添加学生: ${student.name}');
      final response = await _apiService.post('/api/students', data: student.toJson());
      
      print('📝 收到响应: statusCode=${response.statusCode}');
      
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        _students.insert(0, Student.fromJson(data));
        print('✅ 学生添加成功');
      } else {
        _errorMessage = _apiService.getMessage(response) ?? '添加学生失败';
        print('❌ 添加学生失败: $_errorMessage');
        throw Exception(_errorMessage);
      }
    } catch (e) {
      print('❌ 添加学生异常: $e');
      if (e.toString().contains('401')) {
        _errorMessage = '登录已过期，请重新登录';
      } else {
        _errorMessage = '网络错误: $e';
      }
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStudent(Student student) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.put('/api/students/${student.id}', data: student.toJson());
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        final updatedStudent = Student.fromJson(data);
        final index = _students.indexWhere((s) => s.id == student.id);
        if (index != -1) {
          _students[index] = updatedStudent;
        }
        if (_currentStudent?.id == student.id) {
          _currentStudent = updatedStudent;
        }
      } else {
        _errorMessage = _apiService.getMessage(response);
        throw Exception(_errorMessage);
      }
    } catch (e) {
      _errorMessage = '网络错误';
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStudentWithScores(
    String studentId,
    int score,
    int rank,
    Map<String, int> subjectScores,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.put(
        '/api/students/$studentId',
        data: {
          'score': score,
          'rank': rank,
          'subject_scores': subjectScores,
        },
      );
      
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        final updatedStudent = Student.fromJson(data);
        final index = _students.indexWhere((s) => s.id == studentId);
        if (index != -1) {
          _students[index] = updatedStudent;
        }
        if (_currentStudent?.id == studentId) {
          _currentStudent = updatedStudent;
        }
      } else {
        _errorMessage = _apiService.getMessage(response);
        throw Exception(_errorMessage);
      }
    } catch (e) {
      _errorMessage = '网络错误';
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCurrentStudent(Student student) {
    _currentStudent = student;
    notifyListeners();
  }
}

class Student {
  final String id;  // 改为String类型，与后端UUID匹配
  final String name;
  final String gender;
  final String province;
  final String? city;
  final String? highSchool;
  final String subjectType;  // 对应后端的subject_type
  final int? score;          // 高考分数
  final int? rank;           // 省排名
  final Map<String, dynamic>? subjectScores; // 各科成绩

  Student({
    required this.id,
    required this.name,
    this.gender = 'male',
    this.province = '广东',
    this.city,
    this.highSchool,
    this.subjectType = 'physics',  // physics或history
    this.score,
    this.rank,
    this.subjectScores,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'].toString(),  // 确保转换为String
      name: json['name'],
      gender: json['gender'] ?? 'male',
      province: json['province'] ?? '广东',
      city: json['city'],
      highSchool: json['high_school'],
      subjectType: json['subject_type'] ?? 'physics',
      score: json['score'],
      rank: json['rank'],
      subjectScores: json['subject_scores'] != null 
          ? Map<String, dynamic>.from(json['subject_scores'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'gender': gender,
      'province': province,
      if (city != null) 'city': city,
      if (highSchool != null) 'high_school': highSchool,
      'subject_type': subjectType,
      if (score != null) 'score': score,
      if (rank != null) 'rank': rank,
      if (subjectScores != null) 'subject_scores': subjectScores,
    };
  }

  // 便捷属性
  String get category => subjectType == 'physics' ? '物理类' : '历史类';
  String get grade => '高三';  // 默认高三
}
