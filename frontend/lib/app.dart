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
          // 优化：只在initial状态显示SplashPage
          // loading状态保持当前页面，避免闪烁
          if (authProvider.authState == AuthState.initial) {
            return const SplashPage();
          }
          
          if (authProvider.authState == AuthState.authenticated) {
            return const HomePage();
          }
          
          // unauthenticated 或其他状态显示登录页
          return const LoginPage();
        },
      ),
    );
  }
}
