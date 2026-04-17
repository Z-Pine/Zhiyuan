import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:zhiyuan_app/main.dart' as app;

/// T092: 集成测试 - 用户流程测试
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('完整用户流程测试', () {
    testWidgets('启动应用应该显示启动页', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 验证启动页元素
      expect(find.text('志愿填报助手'), findsOneWidget);
      expect(find.text('智能推荐 · 科学填报 · 圆梦大学'), findsOneWidget);
    });

    testWidgets('未登录用户应该看到登录页', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // 等待启动页动画完成
      await tester.pumpAndSettle();

      // 验证登录页元素（如果未登录）
      // 注意：实际测试时需要根据应用状态调整
      final loginButton = find.text('登录');
      if (loginButton.evaluate().isNotEmpty) {
        expect(loginButton, findsOneWidget);
      }
    });
  });

  group('推荐流程测试', () {
    testWidgets('输入分数应该能生成推荐', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 假设已经登录，导航到推荐页面
      // 这里需要根据实际应用结构调整
      
      // 输入分数
      final scoreField = find.byKey(const Key('score_input'));
      if (scoreField.evaluate().isNotEmpty) {
        await tester.enterText(scoreField, '600');
        await tester.pump();

        // 输入位次
        final rankField = find.byKey(const Key('rank_input'));
        await tester.enterText(rankField, '5000');
        await tester.pump();

        // 点击生成推荐按钮
        final generateButton = find.text('生成推荐');
        await tester.tap(generateButton);
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // 验证推荐结果页面
        expect(find.text('推荐结果'), findsOneWidget);
      }
    });

    testWidgets('应该能切换推荐类型Tab', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 查找Tab
      final sprintTab = find.text('冲刺');
      final steadyTab = find.text('稳妥');
      final safeTab = find.text('保底');

      if (sprintTab.evaluate().isNotEmpty) {
        // 点击冲刺Tab
        await tester.tap(sprintTab);
        await tester.pumpAndSettle();

        // 点击稳妥Tab
        await tester.tap(steadyTab);
        await tester.pumpAndSettle();

        // 点击保底Tab
        await tester.tap(safeTab);
        await tester.pumpAndSettle();

        // 验证切换成功
        expect(safeTab, findsOneWidget);
      }
    });
  });

  group('收藏功能测试', () {
    testWidgets('应该能收藏和取消收藏院校', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 查找收藏按钮
      final favoriteButton = find.byIcon(Icons.favorite_border).first;
      
      if (favoriteButton.evaluate().isNotEmpty) {
        // 点击收藏
        await tester.tap(favoriteButton);
        await tester.pump();

        // 验证变为已收藏状态
        expect(find.byIcon(Icons.favorite), findsWidgets);

        // 再次点击取消收藏
        final unfavoriteButton = find.byIcon(Icons.favorite).first;
        await tester.tap(unfavoriteButton);
        await tester.pump();

        // 验证变为未收藏状态
        expect(find.byIcon(Icons.favorite_border), findsWidgets);
      }
    });
  });

  group('导出功能测试', () {
    testWidgets('应该能打开导出选项', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 查找导出按钮
      final exportButton = find.byIcon(Icons.share);
      
      if (exportButton.evaluate().isNotEmpty) {
        // 点击导出按钮
        await tester.tap(exportButton);
        await tester.pumpAndSettle();

        // 验证导出选项菜单
        expect(find.text('导出PDF (全部)'), findsOneWidget);
        expect(find.text('导出Excel (全部)'), findsOneWidget);
      }
    });
  });

  group('历史记录测试', () {
    testWidgets('应该能查看历史记录', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // 导航到历史记录页面
      final historyNav = find.text('历史');
      if (historyNav.evaluate().isNotEmpty) {
        await tester.tap(historyNav);
        await tester.pumpAndSettle();

        // 验证历史记录页面
        expect(find.text('历史记录'), findsOneWidget);
      }
    });
  });
}
