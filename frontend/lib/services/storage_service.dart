import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  Future<void> setToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  Future<void> removeToken() async {
    await _secureStorage.delete(key: _tokenKey);
  }

  // T033: Refresh Token管理
  Future<void> setRefreshToken(String token) async {
    await _secureStorage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  Future<void> removeRefreshToken() async {
    await _secureStorage.delete(key: _refreshTokenKey);
  }

  Future<void> setUserInfo(Map<String, dynamic> userInfo) async {
    final jsonStr = userInfo.toString();
    await _secureStorage.write(key: _userKey, value: jsonStr);
  }

  Future<Map<String, dynamic>?> getUserInfo() async {
    final jsonStr = await _secureStorage.read(key: _userKey);
    if (jsonStr == null) return null;
    return {};
  }

  Future<void> removeUserInfo() async {
    await _secureStorage.delete(key: _userKey);
  }

  Future<void> setPhone(String phone) async {
    await _secureStorage.write(key: _phoneKey, value: phone);
  }

  Future<String?> getPhone() async {
    return await _secureStorage.read(key: _phoneKey);
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
