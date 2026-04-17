import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthService {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthService(this._apiService, this._storageService);

  Future<bool> checkLoginStatus() async {
    final token = await _storageService.getToken();
    if (token != null) {
      _apiService.setAuthToken(token);
      return true;
    }
    return false;
  }

  /// T033: Token刷新机制
  /// 使用refresh token获取新的access token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _apiService.post('/api/auth/refresh-token', data: {
        'refresh_token': refreshToken,
      });

      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        final newAccessToken = data['access_token'];
        final newRefreshToken = data['refresh_token'];

        await _storageService.setToken(newAccessToken);
        await _storageService.setRefreshToken(newRefreshToken);
        _apiService.setAuthToken(newAccessToken);

        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// T032: 找回密码
  Future<Map<String, dynamic>> resetPassword(String phone, String password, String code) async {
    try {
      final response = await _apiService.post('/api/auth/reset-password', data: {
        'phone': phone,
        'password': password,
        'code': code,
      });

      if (_apiService.getSuccess(response)) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': _apiService.getMessage(response) ?? '密码重置失败',
      };
    } catch (e) {
      return {'success': false, 'message': '网络错误'};
    }
  }

  Future<Map<String, dynamic>?> sendCode(String phone) async {
    try {
      final response = await _apiService.post('/api/auth/send-code', data: {'phone': phone});
      if (_apiService.getSuccess(response)) {
        return {
          'success': true,
          'code': _apiService.getData(response)['debugCode'],
        };
      }
      return {
        'success': false,
        'message': _apiService.getMessage(response) ?? '发送失败',
      };
    } catch (e) {
      return {
        'success': false,
        'message': '网络错误',
      };
    }
  }

  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final response = await _apiService.post('/api/auth/login', data: {
        'phone': phone,
        'password': password,
      });

      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        final accessToken = data['access_token'];
        final refreshToken = data['refresh_token'];
        final user = data['user'];

        await _storageService.setToken(accessToken);
        await _storageService.setRefreshToken(refreshToken);
        await _storageService.setPhone(phone);
        await _storageService.setUserInfo(user);

        _apiService.setAuthToken(accessToken);

        return {'success': true, 'user': user};
      }

      return {
        'success': false,
        'message': _apiService.getMessage(response) ?? '登录失败',
      };
    } catch (e) {
      return {'success': false, 'message': '网络错误'};
    }
  }

  Future<Map<String, dynamic>> register(String phone, String password, String code) async {
    try {
      final response = await _apiService.post('/api/auth/register', data: {
        'phone': phone,
        'password': password,
        'code': code,
      });

      if (_apiService.getSuccess(response)) {
        final data = _apiService.getResultData(response);
        final accessToken = data['access_token'];
        final refreshToken = data['refresh_token'];
        final user = data['user'];

        await _storageService.setToken(accessToken);
        await _storageService.setRefreshToken(refreshToken);
        await _storageService.setPhone(phone);
        await _storageService.setUserInfo(user);

        _apiService.setAuthToken(accessToken);

        return {'success': true, 'user': user};
      }

      return {
        'success': false,
        'message': _apiService.getMessage(response) ?? '注册失败',
      };
    } catch (e) {
      return {'success': false, 'message': '网络错误'};
    }
  }

  Future<void> logout() async {
    await _storageService.removeToken();
    await _storageService.removeUserInfo();
    _apiService.clearAuthToken();
  }

  Future<String?> getToken() async {
    return await _storageService.getToken();
  }
}
