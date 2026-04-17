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
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
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
