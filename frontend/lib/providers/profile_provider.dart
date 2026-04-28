import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class ProfileProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  Map<String, dynamic>? _currentProfile;
  bool _isLoading = false;
  String? _errorMessage;

  ProfileProvider(this._apiService);

  Map<String, dynamic>? get currentProfile => _currentProfile;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadProfile(String studentId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/api/profiles/$studentId');
      if (_apiService.getSuccess(response)) {
        _currentProfile = _apiService.getResultData(response);
      } else {
        _errorMessage = _apiService.getMessage(response);
      }
    } catch (e) {
      _errorMessage = '网络错误';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> saveProfile(String studentId, Map<String, dynamic> profileData) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/api/profiles/$studentId',
        data: profileData,
      );
      
      if (_apiService.getSuccess(response)) {
        _currentProfile = _apiService.getResultData(response);
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
}
