import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// T078: 参考来源组件
/// 用于展示数据来源和参考资料
class ReferenceSource extends StatelessWidget {
  final List<Map<String, String>> sources;
  final bool showTitle;
  final EdgeInsets padding;

  const ReferenceSource({
    Key? key,
    required this.sources,
    this.showTitle = true,
    this.padding = const EdgeInsets.all(16),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showTitle) ...[
            Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 16,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 8),
                Text(
                  '参考来源',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          ...sources.asMap().entries.map((entry) {
            final index = entry.key + 1;
            final source = entry.value;
            return _buildSourceItem(index, source);
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildSourceItem(int index, Map<String, String> source) {
    final title = source['title'] ?? '';
    final url = source['url'];
    final description = source['description'];

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Center(
              child: Text(
                '$index',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (url != null)
                  GestureDetector(
                    onTap: () => _launchUrl(url),
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue.shade600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  )
                else
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                    ),
                  ),
                if (description != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

/// 底部参考来源栏
class ReferenceSourceFooter extends StatelessWidget {
  final List<Map<String, String>> sources;

  const ReferenceSourceFooter({
    Key? key,
    required this.sources,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(
          top: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.link,
                size: 14,
                color: Colors.grey.shade500,
              ),
              const SizedBox(width: 6),
              Text(
                '数据来源',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: sources.map((source) {
              return _buildSourceChip(source);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceChip(Map<String, String> source) {
    final title = source['title'] ?? '';
    final url = source['url'];

    return GestureDetector(
      onTap: url != null ? () => _launchUrl(url) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              url != null ? Icons.open_in_new : Icons.source,
              size: 12,
              color: Colors.grey.shade500,
            ),
            const SizedBox(width: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                color: url != null ? Colors.blue.shade600 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

/// 数据更新时间组件
class DataUpdateTime extends StatelessWidget {
  final DateTime updateTime;
  final String dataSource;

  const DataUpdateTime({
    Key? key,
    required this.updateTime,
    required this.dataSource,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final diff = now.difference(updateTime);
    String timeText;

    if (diff.inDays > 365) {
      timeText = '${diff.inDays ~/ 365}年前';
    } else if (diff.inDays > 30) {
      timeText = '${diff.inDays ~/ 30}个月前';
    } else if (diff.inDays > 0) {
      timeText = '${diff.inDays}天前';
    } else if (diff.inHours > 0) {
      timeText = '${diff.inHours}小时前';
    } else if (diff.inMinutes > 0) {
      timeText = '${diff.inMinutes}分钟前';
    } else {
      timeText = '刚刚';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.update,
            size: 14,
            color: Colors.blue.shade600,
          ),
          const SizedBox(width: 6),
          Text(
            '$dataSource · $timeText更新',
            style: TextStyle(
              fontSize: 12,
              color: Colors.blue.shade700,
            ),
          ),
        ],
      ),
    );
  }
}

/// 数据可信度标识
class DataReliabilityBadge extends StatelessWidget {
  final String level; // 'high', 'medium', 'low'
  final String? description;

  const DataReliabilityBadge({
    Key? key,
    required this.level,
    this.description,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    IconData icon;

    switch (level) {
      case 'high':
        color = Colors.green;
        label = '数据可靠';
        icon = Icons.verified;
        break;
      case 'medium':
        color = Colors.orange;
        label = '仅供参考';
        icon = Icons.info;
        break;
      case 'low':
        color = Colors.red;
        label = '数据有限';
        icon = Icons.warning;
        break;
      default:
        color = Colors.grey;
        label = '未知';
        icon = Icons.help;
    }

    return Tooltip(
      message: description ?? _getDefaultDescription(level),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getDefaultDescription(String level) {
    switch (level) {
      case 'high':
        return '数据来源于官方渠道，准确度高';
      case 'medium':
        return '数据经过整理计算，仅供参考';
      case 'low':
        return '数据样本有限，建议多方核实';
      default:
        return '数据可靠性未知';
    }
  }
}
