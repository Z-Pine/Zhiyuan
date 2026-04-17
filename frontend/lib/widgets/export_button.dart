import 'package:flutter/material.dart';
import '../services/export_service.dart';

/// T058: 导出按钮组件
class ExportButton extends StatelessWidget {
  final String studentName;
  final int totalScore;
  final int rank;
  final List<Map<String, dynamic>> recommendations;

  const ExportButton({
    Key? key,
    required this.studentName,
    required this.totalScore,
    required this.rank,
    required this.recommendations,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.share, color: Colors.blue),
      tooltip: '导出志愿表',
      onSelected: (value) => _handleExport(context, value),
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'pdf_all',
          child: Row(
            children: [
              Icon(Icons.picture_as_pdf, color: Colors.red),
              SizedBox(width: 8),
              Text('导出PDF (全部)'),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'excel_all',
          child: Row(
            children: [
              Icon(Icons.table_chart, color: Colors.green),
              SizedBox(width: 8),
              Text('导出Excel (全部)'),
            ],
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem(
          value: 'pdf_sprint',
          child: Row(
            children: [
              Icon(Icons.picture_as_pdf, color: Colors.orange),
              SizedBox(width: 8),
              Text('导出PDF (仅冲刺)'),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'pdf_steady',
          child: Row(
            children: [
              Icon(Icons.picture_as_pdf, color: Colors.blue),
              SizedBox(width: 8),
              Text('导出PDF (仅稳妥)'),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'pdf_safe',
          child: Row(
            children: [
              Icon(Icons.picture_as_pdf, color: Colors.green),
              SizedBox(width: 8),
              Text('导出PDF (仅保底)'),
            ],
          ),
        ),
      ],
    );
  }

  void _handleExport(BuildContext context, String value) {
    switch (value) {
      case 'pdf_all':
        ExportService.exportToPDF(
          context: context,
          studentName: studentName,
          totalScore: totalScore,
          rank: rank,
          recommendations: recommendations,
          exportType: 'all',
        );
        break;
      case 'excel_all':
        ExportService.exportToExcel(
          context: context,
          studentName: studentName,
          totalScore: totalScore,
          rank: rank,
          recommendations: recommendations,
          exportType: 'all',
        );
        break;
      case 'pdf_sprint':
        ExportService.exportToPDF(
          context: context,
          studentName: studentName,
          totalScore: totalScore,
          rank: rank,
          recommendations: recommendations,
          exportType: 'sprint',
        );
        break;
      case 'pdf_steady':
        ExportService.exportToPDF(
          context: context,
          studentName: studentName,
          totalScore: totalScore,
          rank: rank,
          recommendations: recommendations,
          exportType: 'steady',
        );
        break;
      case 'pdf_safe':
        ExportService.exportToPDF(
          context: context,
          studentName: studentName,
          totalScore: totalScore,
          rank: rank,
          recommendations: recommendations,
          exportType: 'safe',
        );
        break;
    }
  }
}

/// 底部导出栏组件
class ExportBottomBar extends StatelessWidget {
  final String studentName;
  final int totalScore;
  final int rank;
  final List<Map<String, dynamic>> recommendations;
  final VoidCallback? onSave;

  const ExportBottomBar({
    Key? key,
    required this.studentName,
    required this.totalScore,
    required this.rank,
    required this.recommendations,
    this.onSave,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // 保存按钮
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: onSave,
                icon: const Icon(Icons.save),
                label: const Text('保存志愿表'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // 导出按钮
            Expanded(
              flex: 2,
              child: OutlinedButton.icon(
                onPressed: () => _showExportOptions(context),
                icon: const Icon(Icons.download),
                label: const Text('导出'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.blue,
                  side: const BorderSide(color: Colors.blue),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showExportOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '导出志愿表',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
              title: const Text('导出为 PDF'),
              subtitle: const Text('适合打印和分享'),
              onTap: () {
                Navigator.pop(context);
                _showPDFOptions(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.table_chart, color: Colors.green),
              title: const Text('导出为 Excel'),
              subtitle: const Text('适合编辑和分析'),
              onTap: () {
                Navigator.pop(context);
                ExportService.exportToExcel(
                  context: context,
                  studentName: studentName,
                  totalScore: totalScore,
                  rank: rank,
                  recommendations: recommendations,
                  exportType: 'all',
                );
              },
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('取消'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPDFOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '选择导出范围',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.select_all, color: Colors.blue),
              title: const Text('全部院校'),
              onTap: () {
                Navigator.pop(context);
                ExportService.exportToPDF(
                  context: context,
                  studentName: studentName,
                  totalScore: totalScore,
                  rank: rank,
                  recommendations: recommendations,
                  exportType: 'all',
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.trending_up, color: Colors.orange),
              title: const Text('仅冲刺院校'),
              onTap: () {
                Navigator.pop(context);
                ExportService.exportToPDF(
                  context: context,
                  studentName: studentName,
                  totalScore: totalScore,
                  rank: rank,
                  recommendations: recommendations,
                  exportType: 'sprint',
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.blue),
              title: const Text('仅稳妥院校'),
              onTap: () {
                Navigator.pop(context);
                ExportService.exportToPDF(
                  context: context,
                  studentName: studentName,
                  totalScore: totalScore,
                  rank: rank,
                  recommendations: recommendations,
                  exportType: 'steady',
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.security, color: Colors.green),
              title: const Text('仅保底院校'),
              onTap: () {
                Navigator.pop(context);
                ExportService.exportToPDF(
                  context: context,
                  studentName: studentName,
                  totalScore: totalScore,
                  rank: rank,
                  recommendations: recommendations,
                  exportType: 'safe',
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
