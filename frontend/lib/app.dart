import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'pages/splash_page.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';
import 'theme/app_theme.dart';

class ZhiyuanApp extends StatelessWidget {
  const ZhiyuanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '志愿填报助手',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          switch (authProvider.authState) {
            case AuthState.initial:
            case AuthState.loading:
              return const SplashPage();
            case AuthState.authenticated:
              return const HomePage();
            case AuthState.unauthenticated:
              return const LoginPage();
          }
        },
      ),
    );
  }
}
