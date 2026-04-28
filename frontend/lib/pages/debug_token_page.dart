import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class DebugTokenPage extends StatefulWidget {
  const DebugTokenPage({super.key});

  @override
  State<DebugTokenPage> createState() => _DebugTokenPageState();
}

class _DebugTokenPageState extends State<DebugTokenPage> {
  String _tokenInfo = '正在检查...';
  String _apiTestResult = '';

  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  Future<void> _checkToken() async {
    final storageService = StorageService();
    await storageService.init();
    
    final token = await storageService.getToken();
    final phone = await storageService.getPhone();
    
    setState(() {
      if (token != null) {
        _tokenInfo = '''
✅ Token已找到
📱 手机号: $phone
🔑 Token前20字符: ${token.substring(0, 20)}...
📏 Token长度: ${token.length}
        ''';
      } else {
        _tokenInfo = '❌ 未找到Token，请重新登录';
      }
    });
  }

  Future<void> _testApi() async {
    setState(() {
      _apiTestResult = '正在测试API...';
    });

    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/students');
      
      setState(() {
        _apiTestResult = '''
✅ API测试成功
📊 状态码: ${response.statusCode}
📦 响应数据: ${response.data}
        ''';
      });
    } catch (e) {
      setState(() {
        _apiTestResult = '''
❌ API测试失败
🔴 错误信息: $e
        ''';
      });
    }
  }

  Future<void> _clearAndRelogin() async {
    final authProvider = context.read<AuthProvider>();
    await authProvider.logout();
    
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Token调试工具'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Token状态',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _tokenInfo,
                      style: const TextStyle(fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _checkToken,
                      child: const Text('重新检查'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'API测试',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_apiTestResult.isNotEmpty)
                      Text(
                        _apiTestResult,
                        style: const TextStyle(fontFamily: 'monospace'),
                      ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _testApi,
                      child: const Text('测试获取学生列表'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color: Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '⚠️ 如果Token有问题',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '1. 清除浏览器缓存（F12 → Application → Clear storage）\n'
                      '2. 点击下方按钮退出登录\n'
                      '3. 重新登录',
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _clearAndRelogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                      ),
                      child: const Text('清除Token并重新登录'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '💡 调试提示',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '打开浏览器控制台（F12 → Console）查看详细日志：\n\n'
                      '✅ 登录成功时应该看到：\n'
                      '  - Token已保存到SharedPreferences\n'
                      '  - Token已设置到ApiService\n'
                      '  - Token验证成功\n\n'
                      '📡 API请求时应该看到：\n'
                      '  - GET/POST路径\n'
                      '  - Authorization: Bearer ...\n\n'
                      '❌ 如果看到401错误：\n'
                      '  - 检查Token是否存在\n'
                      '  - 检查Authorization header是否正确',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
