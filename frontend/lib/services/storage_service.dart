import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user_info';
  static const String _phoneKey = 'user_phone';
  static const String _onboardingKey = 'onboarding_complete';

  late final FlutterSecureStorage _secureStorage;
  late final SharedPreferences _prefs;

  Future<void> init() async {
    _secureStorage = const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    );
    _prefs = await SharedPreferences.getInstance();
  }

  // Web平台使用SharedPreferences，移动端使用FlutterSecureStorage
  Future<void> setToken(String token) async {
    if (kIsWeb) {
      await _prefs.setString(_tokenKey, token);
      if (kDebugMode) {
        print('🔑 Token已保存到SharedPreferences: ${token.substring(0, 20)}...');
      }
    } else {
      await _secureStorage.write(key: _tokenKey, value: token);
    }
  }

  Future<String?> getToken() async {
    final token = kIsWeb 
        ? _prefs.getString(_tokenKey)
        : await _secureStorage.read(key: _tokenKey);
    if (kDebugMode && token != null) {
      print('🔑 读取到Token: ${token.substring(0, 20)}...');
    } else if (kDebugMode && token == null) {
      print('❌ 未找到Token');
    }
    return token;
  }

  Future<void> removeToken() async {
    if (kIsWeb) {
      await _prefs.remove(_tokenKey);
    } else {
      await _secureStorage.delete(key: _tokenKey);
    }
  }

  // T033: Refresh Token管理
  Future<void> setRefreshToken(String token) async {
    if (kIsWeb) {
      await _prefs.setString(_refreshTokenKey, token);
    } else {
      await _secureStorage.write(key: _refreshTokenKey, value: token);
    }
  }

  Future<String?> getRefreshToken() async {
    return kIsWeb 
        ? _prefs.getString(_refreshTokenKey)
        : await _secureStorage.read(key: _refreshTokenKey);
  }

  Future<void> removeRefreshToken() async {
    if (kIsWeb) {
      await _prefs.remove(_refreshTokenKey);
    } else {
      await _secureStorage.delete(key: _refreshTokenKey);
    }
  }

  Future<void> setUserInfo(Map<String, dynamic> userInfo) async {
    final jsonStr = userInfo.toString();
    if (kIsWeb) {
      await _prefs.setString(_userKey, jsonStr);
    } else {
      await _secureStorage.write(key: _userKey, value: jsonStr);
    }
  }

  Future<Map<String, dynamic>?> getUserInfo() async {
    final jsonStr = kIsWeb 
        ? _prefs.getString(_userKey)
        : await _secureStorage.read(key: _userKey);
    if (jsonStr == null) return null;
    return {};
  }

  Future<void> removeUserInfo() async {
    if (kIsWeb) {
      await _prefs.remove(_userKey);
    } else {
      await _secureStorage.delete(key: _userKey);
    }
  }

  Future<void> setPhone(String phone) async {
    if (kIsWeb) {
      await _prefs.setString(_phoneKey, phone);
    } else {
      await _secureStorage.write(key: _phoneKey, value: phone);
    }
  }

  Future<String?> getPhone() async {
    return kIsWeb 
        ? _prefs.getString(_phoneKey)
        : await _secureStorage.read(key: _phoneKey);
  }

  Future<void> setOnboardingComplete(bool complete) async {
    await _prefs.setBool(_onboardingKey, complete);
  }

  bool getOnboardingComplete() {
    return _prefs.getBool(_onboardingKey) ?? false;
  }

  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.clear();
  }

  // T032: 找回密码相关存储
  Future<void> setResetPasswordPhone(String phone) async {
    await _prefs.setString('reset_password_phone', phone);
  }

  String? getResetPasswordPhone() {
    return _prefs.getString('reset_password_phone');
  }

  Future<void> clearResetPasswordPhone() async {
    await _prefs.remove('reset_password_phone');
  }
}
