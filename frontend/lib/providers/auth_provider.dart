import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

enum AuthState { initial, loading, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  
  AuthState _authState = AuthState.initial;
  Map<String, dynamic>? _user;
  String? _errorMessage;

  AuthProvider(this._authService) {
    _checkLoginStatus();
  }

  AuthState get authState => _authState;
  Map<String, dynamic>? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _authState == AuthState.authenticated;

  Future<void> _checkLoginStatus() async {
    _authState = AuthState.loading;
    notifyListeners();

    final isLoggedIn = await _authService.checkLoginStatus();
    
    if (isLoggedIn) {
      _authState = AuthState.authenticated;
    } else {
      _authState = AuthState.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> sendCode(String phone) async {
    try {
      final result = await _authService.sendCode(phone);
      if (result == null) return false;
      return result['success'] == true || (result['success'] == null && result['message'] != null);
    } catch (e) {
      return false;
    }
  }

  Future<bool> login(String phone, String password) async {
    _authState = AuthState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.login(phone, password);

    if (result['success'] == true) {
      _user = result['user'];
      _authState = AuthState.authenticated;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message'];
      _authState = AuthState.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String phone, String password, String code) async {
    _authState = AuthState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.register(phone, password, code);

    if (result['success'] == true) {
      _user = result['user'];
      _authState = AuthState.authenticated;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message'];
      _authState = AuthState.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _authState = AuthState.unauthenticated;
    notifyListeners();
  }

  /// T033: Token刷新
  Future<bool> refreshToken() async {
    final success = await _authService.refreshToken();
    if (!success) {
      // 刷新失败，需要重新登录
      _authState = AuthState.unauthenticated;
      notifyListeners();
    }
    return success;
  }

  /// T032: 找回密码
  Future<bool> resetPassword(String phone, String password, String code) async {
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.resetPassword(phone, password, code);

    if (result['success'] == true) {
      return true;
    } else {
      _errorMessage = result['message'];
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
