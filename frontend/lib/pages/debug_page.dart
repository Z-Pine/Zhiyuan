import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class DebugPage extends StatefulWidget {
  const DebugPage({Key? key}) : super(key: key);

  @override
  State<DebugPage> createState() => _DebugPageState();
}

class _DebugPageState extends State<DebugPage> {
  String _tokenInfo = '加载中...';
  String _apiTestResult = '';

  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  Future<void> _checkToken() async {
    final storage = context.read<StorageService>();
    final token = await storage.getToken();
    
    setState(() {
      if (token != null) {
        _tokenInfo = 'Token存在\n长度: ${token.length}\n前20字符: ${token.substring(0, 20)}...';
      } else {
        _tokenInfo = 'Token不存在';
      }
    });
  }

  Future<void> _testApi() async {
    setState(() => _apiTestResult = '测试中...');
    
    try {
      final apiService = context.read<ApiService>();
      final response = await apiService.get('/api/students');
      
      setState(() {
        if (apiService.getSuccess(response)) {
          final data = apiService.getResultData(response);
          _apiTestResult = '✅ API调用成功\n学生数量: ${(data as List).length}';
        } else {
          _apiTestResult = '❌ API调用失败\n${apiService.getMessage(response)}';
        }
      });
    } catch (e) {
      setState(() {
        _apiTestResult = '❌ 异常: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('调试信息'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
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
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(_tokenInfo),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _checkToken,
                    child: const Text('刷新Token信息'),
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
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_apiTestResult.isNotEmpty) ...[
                    Text(_apiTestResult),
                    const SizedBox(height: 12),
                  ],
                  ElevatedButton(
                    onPressed: _testApi,
                    child: const Text('测试API调用'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
