import 'dart:io';

/// 测试运行脚本
/// 运行所有测试并生成报告

void main() async {
  print('=================================');
  print('      志愿通测试套件启动');
  print('=================================');
  print('');

  final results = <String, TestResult>{};

  // 1. 单元测试
  print('📦 运行单元测试...');
  results['unit'] = await runTest('flutter test test/unit/utils_test.dart');
  print('');

  // 2. Widget测试
  print('🎨 运行Widget测试...');
  results['widget'] = await runTest('flutter test test/widget/components_test.dart');
  print('');

  // 3. 性能测试
  print('⚡ 运行性能测试...');
  results['performance'] = await runTest('flutter test test/performance/performance_test.dart');
  print('');

  // 4. 算法测试
  print('🧮 运行算法测试...');
  results['algorithm'] = await runTest('flutter test test/algorithm/recommendation_algorithm_test.dart');
  print('');

  // 5. 安全测试
  print('🔒 运行安全测试...');
  results['security'] = await runTest('flutter test test/security/security_test.dart');
  print('');

  // 生成测试报告
  print('=================================');
  print('          测试报告');
  print('=================================');
  print('');

  int totalPassed = 0;
  int totalFailed = 0;

  for (final entry in results.entries) {
    final result = entry.value;
    totalPassed += result.passed;
    totalFailed += result.failed;

    final status = result.failed == 0 ? '✅' : '❌';
    print('$status ${entry.key.toUpperCase()}测试: ${result.passed}通过, ${result.failed}失败');
  }

  print('');
  print('---------------------------------');
  print('总计: $totalPassed 通过, $totalFailed 失败');
  print('---------------------------------');

  final exitCode = totalFailed > 0 ? 1 : 0;
  exit(exitCode);
}

Future<TestResult> runTest(String command) async {
  try {
    final result = await Process.run(
      'cmd',
      ['/c', command],
      workingDirectory: Directory.current.path,
    );

    // 解析测试结果
    final output = result.stdout.toString();
    final passed = _extractPassedCount(output);
    final failed = _extractFailedCount(output);

    if (result.exitCode == 0 && failed == 0) {
      print('  ✅ 测试通过 ($passed 个测试)');
    } else {
      print('  ❌ 测试失败 ($passed 通过, $failed 失败)');
      if (output.contains('Some tests failed')) {
        print('  错误信息: ${output.split('\n').take(5).join('\n')}');
      }
    }

    return TestResult(passed: passed, failed: failed);
  } catch (e) {
    print('  ⚠️ 测试运行失败: $e');
    return TestResult(passed: 0, failed: 1);
  }
}

int _extractPassedCount(String output) {
  final regExp = RegExp(r'(\d+) passed');
  final match = regExp.firstMatch(output);
  return match != null ? int.parse(match.group(1)!) : 0;
}

int _extractFailedCount(String output) {
  final regExp = RegExp(r'(\d+) failed');
  final match = regExp.firstMatch(output);
  return match != null ? int.parse(match.group(1)!) : 0;
}

class TestResult {
  final int passed;
  final int failed;

  TestResult({required this.passed, required this.failed});
}
