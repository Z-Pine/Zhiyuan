import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/student_provider.dart';
import 'providers/recommendation_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final storageService = StorageService();
  await storageService.init();

  final apiService = ApiService();
  final authService = AuthService(apiService, storageService);

  runApp(
    MultiProvider(
      providers: [
        Provider<StorageService>.value(value: storageService),
        Provider<ApiService>.value(value: apiService),
        Provider<AuthService>.value(value: authService),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(authService),
        ),
        ChangeNotifierProvider(
          create: (_) => StudentProvider(apiService),
        ),
        ChangeNotifierProvider(
          create: (_) => RecommendationProvider(apiService),
        ),
      ],
      child: const ZhiyuanApp(),
    ),
  );
}
