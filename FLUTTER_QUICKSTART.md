# 🚀 Flutter前端快速启动指南

**目标**: 30分钟内完成Flutter项目初始化和基础配置

---

## 📋 前置要求

### 1. 安装Flutter SDK

```bash
# Windows (使用Chocolatey)
choco install flutter

# macOS (使用Homebrew)
brew install flutter

# 或者从官网下载
# https://flutter.dev/docs/get-started/install
```

### 2. 验证安装

```bash
flutter doctor
```

确保以下项目都有绿色勾号：
- ✅ Flutter SDK
- ✅ Android toolchain
- ✅ Chrome (用于Web开发)
- ✅ VS Code / Android Studio

---

## 🎯 快速开始（30分钟）

### 步骤1: 创建项目（5分钟）

```bash
# 进入frontend目录
cd frontend

# 如果frontend目录已存在Flutter项目，跳过创建
# 否则创建新项目
flutter create . --org com.gaokao --project-name gaokao_helper

# 安装依赖
flutter pub add dio                    # HTTP客户端
flutter pub add provider               # 状态管理
flutter pub add shared_preferences     # 本地存储
flutter pub add fl_chart              # 图表
flutter pub add intl                  # 国际化
flutter pub add flutter_svg           # SVG支持

# 开发依赖
flutter pub add --dev flutter_test
```

### 步骤2: 配置项目结构（5分钟）

创建以下目录结构：

```bash
mkdir -p lib/config
mkdir -p lib/models
mkdir -p lib/services
mkdir -p lib/providers
mkdir -p lib/screens/auth
mkdir -p lib/screens/student
mkdir -p lib/screens/score
mkdir -p lib/screens/profile
mkdir -p lib/screens/recommendation
mkdir -p lib/widgets/common
mkdir -p lib/widgets/recommendation
```

### 步骤3: 创建配置文件（5分钟）

#### lib/config/api_config.dart

```dart
class ApiConfig {
  // 开发环境
  static const String devBaseUrl = 'http://localhost:3000/api';
  
  // 生产环境
  static const String prodBaseUrl = 'https://your-domain.com/api';
  
  // 当前环境
  static const bool isProduction = false;
  
  static String get baseUrl => isProduction ? prodBaseUrl : devBaseUrl;
  
  // API端点
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String sendCode = '/auth/send-code';
  static const String students = '/students';
  static const String scores = '/scores';
  static const String profiles = '/profiles';
  static const String schools = '/schools';
  static const String majors = '/majors';
  static const String recommendations = '/recommendations';
}
```

#### lib/config/routes.dart

```dart
import 'package:flutter/material.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/student/student_list_screen.dart';
import '../screens/student/student_form_screen.dart';
import '../screens/score/score_form_screen.dart';
import '../screens/profile/profile_form_screen.dart';
import '../screens/recommendation/recommendation_screen.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String studentList = '/students';
  static const String studentForm = '/students/form';
  static const String scoreForm = '/scores/form';
  static const String profileForm = '/profiles/form';
  static const String recommendation = '/recommendation';

  static Map<String, WidgetBuilder> getRoutes() {
    return {
      login: (context) => const LoginScreen(),
      register: (context) => const RegisterScreen(),
      studentList: (context) => const StudentListScreen(),
      studentForm: (context) => const StudentFormScreen(),
      scoreForm: (context) => const ScoreFormScreen(),
      profileForm: (context) => const ProfileFormScreen(),
      recommendation: (context) => const RecommendationScreen(),
    };
  }
}
```

### 步骤4: 创建API服务（10分钟）

#### lib/services/api_service.dart

```dart
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late Dio _dio;
  final StorageService _storage = StorageService();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // 请求拦截器
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // 添加Token
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // 统一错误处理
        if (error.response?.statusCode == 401) {
          // Token过期，跳转到登录页
          _storage.clearToken();
        }
        return handler.next(error);
      },
    ));
  }

  // GET请求
  Future<Response> get(String path, {Map<String, dynamic>? params}) async {
    return await _dio.get(path, queryParameters: params);
  }

  // POST请求
  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  // PUT请求
  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  // DELETE请求
  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }
}
```

#### lib/services/storage_service.dart

```dart
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';

  // 保存Token
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  // 获取Token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // 清除Token
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
  }

  // 保存用户ID
  Future<void> saveUserId(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userIdKey, userId);
  }

  // 获取用户ID
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userIdKey);
  }

  // 检查是否已登录
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
```

#### lib/services/auth_service.dart

```dart
import 'api_service.dart';
import 'storage_service.dart';
import '../config/api_config.dart';

class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  // 发送验证码
  Future<Map<String, dynamic>> sendCode(String phone) async {
    try {
      final response = await _api.post(
        ApiConfig.sendCode,
        data: {'phone': phone},
      );
      return response.data;
    } catch (e) {
      throw Exception('发送验证码失败: $e');
    }
  }

  // 登录
  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final response = await _api.post(
        ApiConfig.login,
        data: {
          'phone': phone,
          'password': password,
        },
      );
      
      if (response.data['success']) {
        final token = response.data['data']['access_token'];
        final userId = response.data['data']['user']['id'].toString();
        
        await _storage.saveToken(token);
        await _storage.saveUserId(userId);
      }
      
      return response.data;
    } catch (e) {
      throw Exception('登录失败: $e');
    }
  }

  // 注册
  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String code,
    String? name,
  }) async {
    try {
      final response = await _api.post(
        ApiConfig.register,
        data: {
          'phone': phone,
          'password': password,
          'verification_code': code,
          if (name != null) 'name': name,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('注册失败: $e');
    }
  }

  // 登出
  Future<void> logout() async {
    await _storage.clearToken();
  }

  // 检查登录状态
  Future<bool> isLoggedIn() async {
    return await _storage.isLoggedIn();
  }
}
```

### 步骤5: 创建数据模型（5分钟）

#### lib/models/user.dart

```dart
class User {
  final String id;
  final String phone;
  final String? name;
  final String? email;
  final DateTime createdAt;

  User({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      phone: json['phone'],
      name: json['name'],
      email: json['email'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'name': name,
      'email': email,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
```

#### lib/models/student.dart

```dart
class Student {
  final String id;
  final String name;
  final String gender;
  final String province;
  final String subjectType;
  final String? city;
  final String? highSchool;
  final DateTime createdAt;

  Student({
    required this.id,
    required this.name,
    required this.gender,
    required this.province,
    required this.subjectType,
    this.city,
    this.highSchool,
    required this.createdAt,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'].toString(),
      name: json['name'],
      gender: json['gender'],
      province: json['province'],
      subjectType: json['subject_type'],
      city: json['city'],
      highSchool: json['high_school'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'gender': gender,
      'province': province,
      'subject_type': subjectType,
      'city': city,
      'high_school': highSchool,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
```

### 步骤6: 更新main.dart（5分钟）

#### lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'services/storage_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: '高考志愿填报助手',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        home: const SplashScreen(),
        routes: AppRoutes.getRoutes(),
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final storage = StorageService();
    final isLoggedIn = await storage.isLoggedIn();
    
    await Future.delayed(const Duration(seconds: 1));
    
    if (mounted) {
      if (isLoggedIn) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.studentList);
      } else {
        Navigator.of(context).pushReplacementNamed(AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school,
              size: 100,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 20),
            const Text(
              '高考志愿填报助手',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
```

---

## ✅ 验证安装

### 1. 运行项目

```bash
# Web版本（推荐用于开发）
flutter run -d chrome

# Android模拟器
flutter run -d android

# iOS模拟器（仅macOS）
flutter run -d ios
```

### 2. 检查热重载

修改任意文件，按 `r` 键应该能看到热重载效果。

### 3. 检查API连接

确保后端服务正在运行：
```bash
cd backend
npm run dev
```

---

## 📱 下一步

现在基础框架已经搭建完成，接下来需要：

1. **创建登录页面** - `lib/screens/auth/login_screen.dart`
2. **创建注册页面** - `lib/screens/auth/register_screen.dart`
3. **创建学生列表页面** - `lib/screens/student/student_list_screen.dart`
4. **创建其他页面** - 按照路由配置逐个实现

---

## 🎨 UI设计建议

### 配色方案
- 主色: `#2196F3` (蓝色 - 代表知识和未来)
- 辅助色: `#4CAF50` (绿色 - 代表成长和希望)
- 强调色: `#FF9800` (橙色 - 代表活力和热情)

### 字体
- 标题: 24-32px, Bold
- 正文: 14-16px, Regular
- 小字: 12px, Regular

### 间距
- 页面边距: 16px
- 组件间距: 12px
- 小间距: 8px

---

## 🐛 常见问题

### 1. Flutter命令找不到
```bash
# 添加Flutter到PATH
export PATH="$PATH:`pwd`/flutter/bin"
```

### 2. 依赖安装失败
```bash
# 清除缓存重试
flutter clean
flutter pub get
```

### 3. 模拟器无法连接
```bash
# 检查可用设备
flutter devices

# 重启模拟器
```

### 4. 热重载不工作
```bash
# 完全重启
flutter run --hot
```

---

## 📚 学习资源

- [Flutter官方文档](https://flutter.dev/docs)
- [Dart语言教程](https://dart.dev/guides)
- [Provider状态管理](https://pub.dev/packages/provider)
- [Dio网络请求](https://pub.dev/packages/dio)

---

**准备好了吗？开始创建你的第一个页面吧！** 🚀

下一步: 查看 `LOGIN_SCREEN_GUIDE.md` 学习如何创建登录页面
