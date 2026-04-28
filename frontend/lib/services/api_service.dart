import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  static const String baseUrl = kDebugMode 
      ? 'http://localhost:3000' 
      : 'https://your-production-url.com';

  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),  // 缩短连接超时
      receiveTimeout: const Duration(seconds: 5),  // 缩短接收超时
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // 只在debug模式下启用详细日志
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: false,  // 减少日志输出
        responseBody: false,
        logPrint: (obj) {
          // 只打印关键信息
          if (obj.toString().contains('ERROR') || obj.toString().contains('DioException')) {
            print(obj);
          }
        },
      ));
    }
  }

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
    print('🔐 ApiService: Token已设置到请求头: Bearer ${token.substring(0, 20)}...');
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
    print('🔓 ApiService: Token已清除');
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    final authHeader = _dio.options.headers['Authorization'];
    print('📡 GET $path, Authorization: ${authHeader ?? "未设置"}');
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    final authHeader = _dio.options.headers['Authorization'];
    print('📡 POST $path, Authorization: ${authHeader ?? "未设置"}');
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }

  bool isSuccess(Response response) {
    return response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
  }

  Map<String, dynamic> getData(Response response) {
    if (response.data is Map<String, dynamic>) {
      return response.data;
    }
    return {};
  }

  bool getSuccess(Response response) {
    final data = getData(response);
    return data['success'] == true;
  }

  String? getMessage(Response response) {
    final data = getData(response);
    return data['message'];
  }

  dynamic getResultData(Response response) {
    final data = getData(response);
    return data['data'];
  }
}
