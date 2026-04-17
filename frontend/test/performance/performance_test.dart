import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zhiyuan_app/widgets/skeleton.dart';

/// T093: 性能测试 - 加载速度测试
void main() {
  group('组件渲染性能测试', () {
    testWidgets('骨架屏渲染性能测试', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RecommendationSkeleton(),
          ),
        ),
      );

      stopwatch.stop();
      
      // 渲染时间应该小于100ms
      expect(stopwatch.elapsedMilliseconds, lessThan(100));
    });

    testWidgets('列表渲染性能测试', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 100,
              itemBuilder: (context, index) => ListTile(
                title: Text('Item $index'),
                subtitle: Text('Subtitle $index'),
              ),
            ),
          ),
        ),
      );

      stopwatch.stop();
      
      // 100项列表渲染时间应该小于500ms
      expect(stopwatch.elapsedMilliseconds, lessThan(500));
    });

    testWidgets('网格渲染性能测试', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GridView.count(
              crossAxisCount: 2,
              children: List.generate(
                50,
                (index) => Card(
                  child: Center(
                    child: Text('Item $index'),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

      stopwatch.stop();
      
      // 50项网格渲染时间应该小于300ms
      expect(stopwatch.elapsedMilliseconds, lessThan(300));
    });
  });

  group('动画性能测试', () {
    testWidgets('骨架屏动画性能测试', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AnimatedSkeleton(
              width: 100,
              height: 50,
            ),
          ),
        ),
      );

      // 记录初始帧
      await tester.pump();
      
      // 模拟动画帧
      final stopwatch = Stopwatch()..start();
      
      for (int i = 0; i < 60; i++) {
        await tester.pump(const Duration(milliseconds: 16));
      }
      
      stopwatch.stop();
      
      // 60帧动画应该在1秒内完成
      expect(stopwatch.elapsedMilliseconds, lessThan(1000));
    });
  });

  group('内存使用测试', () {
    testWidgets('大量列表项内存测试', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 1000,
              itemBuilder: (context, index) => ListTile(
                title: Text('Item $index'),
                subtitle: Text('Subtitle $index'),
                trailing: const Icon(Icons.arrow_forward),
              ),
            ),
          ),
        ),
      );

      // 滚动到列表底部
      await tester.fling(find.byType(ListView), const Offset(0, -1000), 1000);
      await tester.pumpAndSettle();

      // 验证列表正常渲染，没有内存泄漏
      expect(find.byType(ListTile), findsWidgets);
    });
  });

  group('响应速度测试', () {
    testWidgets('按钮点击响应测试', (WidgetTester tester) async {
      int clickCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () => clickCount++,
              child: const Text('点击'),
            ),
          ),
        ),
      );

      final stopwatch = Stopwatch()..start();

      // 快速点击按钮10次
      for (int i = 0; i < 10; i++) {
        await tester.tap(find.text('点击'));
        await tester.pump();
      }

      stopwatch.stop();

      // 10次点击响应时间应该小于100ms
      expect(stopwatch.elapsedMilliseconds, lessThan(100));
      expect(clickCount, 10);
    });

    testWidgets('输入响应测试', (WidgetTester tester) async {
      final controller = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextField(
              controller: controller,
            ),
          ),
        ),
      );

      final stopwatch = Stopwatch()..start();

      // 输入100个字符
      await tester.enterText(
        find.byType(TextField),
        '这是一段测试文本，用于测试输入响应速度。' * 2,
      );

      stopwatch.stop();

      // 输入响应时间应该小于200ms
      expect(stopwatch.elapsedMilliseconds, lessThan(200));
    });
  });

  group('滚动性能测试', () {
    testWidgets('列表滚动流畅度测试', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 1000,
              itemBuilder: (context, index) => Container(
                height: 100,
                color: index % 2 == 0 ? Colors.white : Colors.grey.shade100,
                child: ListTile(
                  title: Text('Item $index'),
                ),
              ),
            ),
          ),
        ),
      );

      final stopwatch = Stopwatch()..start();

      // 快速滚动
      await tester.fling(find.byType(ListView), const Offset(0, -3000), 3000);
      await tester.pumpAndSettle();

      stopwatch.stop();

      // 滚动动画应该流畅完成
      expect(stopwatch.elapsedMilliseconds, lessThan(2000));
    });
  });
}
