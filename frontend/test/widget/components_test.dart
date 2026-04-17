import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zhiyuan_app/widgets/skeleton.dart';
import 'package:zhiyuan_app/widgets/export_button.dart';

/// T091: Widget测试 - 组件渲染测试
void main() {
  group('骨架屏组件测试', () {
    testWidgets('SkeletonContainer应该正确渲染', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SkeletonContainer(
              width: 100,
              height: 50,
            ),
          ),
        ),
      );

      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('AnimatedSkeleton应该正确渲染', (WidgetTester tester) async {
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

      expect(find.byType(AnimatedBuilder), findsOneWidget);
    });

    testWidgets('ListTileSkeleton应该正确渲染', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ListTileSkeleton(),
          ),
        ),
      );

      expect(find.byType(Row), findsWidgets);
      expect(find.byType(Column), findsWidgets);
    });

    testWidgets('CardSkeleton应该正确渲染', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CardSkeleton(height: 120),
          ),
        ),
      );

      expect(find.byType(Card), findsOneWidget);
    });
  });

  group('按钮组件测试', () {
    testWidgets('ExportButton应该显示导出图标', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ExportButton(
              studentName: '测试考生',
              totalScore: 600,
              rank: 5000,
              recommendations: const [],
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.share), findsOneWidget);
    });

    testWidgets('点击ExportButton应该显示菜单', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ExportButton(
              studentName: '测试考生',
              totalScore: 600,
              rank: 5000,
              recommendations: const [],
            ),
          ),
        ),
      );

      // 点击按钮
      await tester.tap(find.byIcon(Icons.share));
      await tester.pumpAndSettle();

      // 验证菜单项
      expect(find.text('导出PDF (全部)'), findsOneWidget);
      expect(find.text('导出Excel (全部)'), findsOneWidget);
    });
  });

  group('输入验证测试', () {
    testWidgets('TextField应该接受输入', (WidgetTester tester) async {
      final controller = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextField(
              controller: controller,
              key: const Key('test_input'),
            ),
          ),
        ),
      );

      // 输入文本
      await tester.enterText(find.byKey(const Key('test_input')), '测试文本');
      expect(controller.text, '测试文本');
    });

    testWidgets('手机号输入应该限制长度', (WidgetTester tester) async {
      final controller = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              maxLength: 11,
              key: const Key('phone_input'),
            ),
          ),
        ),
      );

      // 输入超过11位的数字
      await tester.enterText(find.byKey(const Key('phone_input')), '13800138000123');
      await tester.pump();

      // 应该只保留11位
      expect(controller.text.length, lessThanOrEqualTo(11));
    });
  });

  group('列表组件测试', () {
    testWidgets('ListView应该正确渲染列表项', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 5,
              itemBuilder: (context, index) => ListTile(
                title: Text('Item $index'),
              ),
            ),
          ),
        ),
      );

      // 验证列表项
      expect(find.text('Item 0'), findsOneWidget);
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 4'), findsOneWidget);
    });

    testWidgets('GridView应该正确渲染网格项', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GridView.count(
              crossAxisCount: 2,
              children: List.generate(
                4,
                (index) => Container(
                  key: Key('grid_item_$index'),
                ),
              ),
            ),
          ),
        ),
      );

      // 验证网格项
      expect(find.byKey(const Key('grid_item_0')), findsOneWidget);
      expect(find.byKey(const Key('grid_item_3')), findsOneWidget);
    });
  });

  group('对话框测试', () {
    testWidgets('AlertDialog应该正确显示', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('测试标题'),
                      content: const Text('测试内容'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('确定'),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text('显示对话框'),
              ),
            ),
          ),
        ),
      );

      // 点击按钮显示对话框
      await tester.tap(find.text('显示对话框'));
      await tester.pumpAndSettle();

      // 验证对话框内容
      expect(find.text('测试标题'), findsOneWidget);
      expect(find.text('测试内容'), findsOneWidget);
      expect(find.text('确定'), findsOneWidget);
    });
  });

  group('导航测试', () {
    testWidgets('页面导航应该正常工作', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          initialRoute: '/',
          routes: {
            '/': (context) => const Scaffold(
                  body: Text('首页'),
                ),
            '/second': (context) => const Scaffold(
                  body: Text('第二页'),
                ),
          },
        ),
      );

      // 验证首页
      expect(find.text('首页'), findsOneWidget);

      // 导航到第二页
      Navigator.of(tester.element(find.text('首页'))).pushNamed('/second');
      await tester.pumpAndSettle();

      // 验证第二页
      expect(find.text('第二页'), findsOneWidget);
    });
  });
}
