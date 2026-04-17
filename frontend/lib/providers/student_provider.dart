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
      }
    } catch (e) {
      _errorMessage = '网络错误';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addStudent(Student student) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post('/api/students', data: student.toJson());
      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        _students.insert(0, Student.fromJson(data));
      } else {
        _errorMessage = _apiService.getMessage(response);
      }
    } catch (e) {
      _errorMessage = '网络错误';
    }

    _isLoading = false;
    notifyListeners();
  }

  void setCurrentStudent(Student student) {
    _currentStudent = student;
    notifyListeners();
  }
}

class Student {
  final int? id;
  final String name;
  final String province;
  final String? city;
  final String category;
  final String grade;

  Student({
    this.id,
    required this.name,
    this.province = '广东',
    this.city,
    this.category = '物理类',
    this.grade = '高三',
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'],
      name: json['name'],
      province: json['province'] ?? '广东',
      city: json['city'],
      category: json['category'] ?? '物理类',
      grade: json['grade'] ?? '高三',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'province': province,
      'city': city,
      'category': category,
      'grade': grade,
    };
  }
}
