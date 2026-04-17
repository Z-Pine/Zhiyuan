import 'package:flutter/material.dart';

/// T080: 加载骨架屏组件
/// 
/// 用于在数据加载时显示占位效果，提升用户体验

/// 基础骨架屏容器
class SkeletonContainer extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final EdgeInsets margin;

  const SkeletonContainer({
    Key? key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
    this.margin = EdgeInsets.zero,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// 带动画的骨架屏
class AnimatedSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const AnimatedSkeleton({
    Key? key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  }) : super(key: key);

  @override
  State<AnimatedSkeleton> createState() => _AnimatedSkeletonState();
}

class _AnimatedSkeletonState extends State<AnimatedSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _colorAnimation = ColorTween(
      begin: Colors.grey.shade200,
      end: Colors.grey.shade300,
    ).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _colorAnimation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: _colorAnimation.value,
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        );
      },
    );
  }
}

/// 列表项骨架屏
class ListTileSkeleton extends StatelessWidget {
  final bool hasLeading;
  final bool hasSubtitle;
  final int lineCount;

  const ListTileSkeleton({
    Key? key,
    this.hasLeading = true,
    this.hasSubtitle = true,
    this.lineCount = 1,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasLeading) ...[
            const AnimatedSkeleton(
              width: 48,
              height: 48,
              borderRadius: 24,
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AnimatedSkeleton(
                  width: double.infinity,
                  height: 16,
                ),
                if (hasSubtitle) ...[
                  const SizedBox(height: 8),
                  AnimatedSkeleton(
                    width: MediaQuery.of(context).size.width * 0.6,
                    height: 14,
                  ),
                ],
                if (lineCount > 1) ...[
                  const SizedBox(height: 8),
                  const AnimatedSkeleton(
                    width: double.infinity,
                    height: 14,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 卡片骨架屏
class CardSkeleton extends StatelessWidget {
  final double height;

  const CardSkeleton({
    Key? key,
    this.height = 120,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const AnimatedSkeleton(
                width: 40,
                height: 40,
                borderRadius: 8,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AnimatedSkeleton(
                      width: 120,
                      height: 16,
                    ),
                    const SizedBox(height: 8),
                    AnimatedSkeleton(
                      width: MediaQuery.of(context).size.width * 0.4,
                      height: 12,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Expanded(
            child: AnimatedSkeleton(
              width: double.infinity,
              height: double.infinity,
            ),
          ),
        ],
      ),
    );
  }
}

/// 推荐结果页骨架屏
class RecommendationSkeleton extends StatelessWidget {
  const RecommendationSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 顶部统计卡片
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
              ),
            ],
          ),
          child: Column(
            children: [
              const AnimatedSkeleton(
                width: 100,
                height: 20,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatSkeleton(),
                  _buildStatSkeleton(),
                  _buildStatSkeleton(),
                ],
              ),
            ],
          ),
        ),
        // Tab栏骨架
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: AnimatedSkeleton(
                  width: double.infinity,
                  height: 40,
                  borderRadius: 20,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AnimatedSkeleton(
                  width: double.infinity,
                  height: 40,
                  borderRadius: 20,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AnimatedSkeleton(
                  width: double.infinity,
                  height: 40,
                  borderRadius: 20,
                ),
              ),
            ],
          ),
        ),
        // 列表骨架
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: 5,
            itemBuilder: (context, index) => const CardSkeleton(height: 140),
          ),
        ),
      ],
    );
  }

  Widget _buildStatSkeleton() {
    return Column(
      children: [
        const AnimatedSkeleton(
          width: 48,
          height: 32,
          borderRadius: 4,
        ),
        const SizedBox(height: 8),
        AnimatedSkeleton(
          width: 60,
          height: 14,
          borderRadius: 4,
        ),
      ],
    );
  }
}

/// 学校详情页骨架屏
class SchoolDetailSkeleton extends StatelessWidget {
  const SchoolDetailSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // 头部骨架
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                Row(
                  children: [
                    const AnimatedSkeleton(
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const AnimatedSkeleton(
                            width: 150,
                            height: 20,
                          ),
                          const SizedBox(height: 8),
                          AnimatedSkeleton(
                            width: MediaQuery.of(context).size.width * 0.4,
                            height: 14,
                          ),
                          const SizedBox(height: 8),
                          const Row(
                            children: [
                              AnimatedSkeleton(
                                width: 50,
                                height: 20,
                                borderRadius: 4,
                              ),
                              SizedBox(width: 8),
                              AnimatedSkeleton(
                                width: 50,
                                height: 20,
                                borderRadius: 4,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const AnimatedSkeleton(
                  width: double.infinity,
                  height: 80,
                  borderRadius: 8,
                ),
              ],
            ),
          ),
        ),
        // 内容骨架
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => const CardSkeleton(height: 120),
            childCount: 4,
          ),
        ),
      ],
    );
  }
}

/// 通用列表骨架屏
class ListSkeleton extends StatelessWidget {
  final int itemCount;
  final EdgeInsets padding;

  const ListSkeleton({
    Key? key,
    this.itemCount = 5,
    this.padding = const EdgeInsets.all(16),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: padding,
      itemCount: itemCount,
      itemBuilder: (context, index) => const ListTileSkeleton(),
    );
  }
}

/// 网格骨架屏
class GridSkeleton extends StatelessWidget {
  final int crossAxisCount;
  final int itemCount;

  const GridSkeleton({
    Key? key,
    this.crossAxisCount = 2,
    this.itemCount = 6,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        childAspectRatio: 1.5,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => const AnimatedSkeleton(
        width: double.infinity,
        height: double.infinity,
        borderRadius: 12,
      ),
    );
  }
}
