import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:excel/excel.dart';

/// T058: 志愿表导出服务
class ExportService {
  /// 导出志愿表为PDF
  static Future<void> exportToPDF({
    required BuildContext context,
    required String studentName,
    required int totalScore,
    required int rank,
    required List<Map<String, dynamic>> recommendations,
    required String exportType, // 'all', 'sprint', 'steady', 'safe'
  }) async {
    try {
      // 筛选数据
      final filteredRecommendations = _filterRecommendations(
        recommendations,
        exportType,
      );

      // 创建PDF文档
      final pdf = pw.Document();

      // 添加页面
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          header: (context) => _buildPDFHeader(studentName, totalScore, rank),
          footer: (context) => _buildPDFFooter(context.pageNumber, context.pagesCount),
          build: (context) => [
            _buildPDFContent(filteredRecommendations),
          ],
        ),
      );

      // 保存并分享
      final bytes = await pdf.save();
      await _saveAndShareFile(
        bytes: bytes,
        fileName: '志愿表_${studentName}_${DateTime.now().millisecondsSinceEpoch}.pdf',
        mimeType: 'application/pdf',
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PDF导出成功')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('导出失败: $e')),
        );
      }
    }
  }

  /// 导出志愿表为Excel
  static Future<void> exportToExcel({
    required BuildContext context,
    required String studentName,
    required int totalScore,
    required int rank,
    required List<Map<String, dynamic>> recommendations,
    required String exportType,
  }) async {
    try {
      // 筛选数据
      final filteredRecommendations = _filterRecommendations(
        recommendations,
        exportType,
      );

      // 创建Excel
      final excel = Excel.createExcel();
      
      // 创建汇总表
      final summarySheet = excel['志愿表汇总'];
      _buildSummarySheet(summarySheet, studentName, totalScore, rank, filteredRecommendations);

      // 创建详细表
      final detailSheet = excel['志愿详情'];
      _buildDetailSheet(detailSheet, filteredRecommendations);

      // 删除默认Sheet
      excel.delete('Sheet1');

      // 保存并分享
      final bytes = excel.encode();
      if (bytes != null) {
        await _saveAndShareFile(
          bytes: Uint8List.fromList(bytes),
          fileName: '志愿表_${studentName}_${DateTime.now().millisecondsSinceEpoch}.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Excel导出成功')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('导出失败: $e')),
        );
      }
    }
  }

  /// 筛选推荐数据
  static List<Map<String, dynamic>> _filterRecommendations(
    List<Map<String, dynamic>> recommendations,
    String exportType,
  ) {
    if (exportType == 'all') {
      return recommendations;
    }
    return recommendations.where((item) => item['type'] == exportType).toList();
  }

  /// 构建PDF头部
  static pw.Widget _buildPDFHeader(String studentName, int totalScore, int rank) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 20),
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          bottom: pw.BorderSide(width: 2, color: PdfColors.blue),
        ),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            '高考志愿填报表',
            style: pw.TextStyle(
              fontSize: 24,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.blue,
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Row(
            children: [
              pw.Text('考生: $studentName', style: const pw.TextStyle(fontSize: 12)),
              pw.SizedBox(width: 30),
              pw.Text('总分: $totalScore', style: const pw.TextStyle(fontSize: 12)),
              pw.SizedBox(width: 30),
              pw.Text('位次: $rank', style: const pw.TextStyle(fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  /// 构建PDF页脚
  static pw.Widget _buildPDFFooter(int pageNumber, int totalPages) {
    return pw.Container(
      alignment: pw.Alignment.centerRight,
      margin: const pw.EdgeInsets.only(top: 10),
      child: pw.Text(
        '第 $pageNumber / $totalPages 页',
        style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey),
      ),
    );
  }

  /// 构建PDF内容
  static pw.Widget _buildPDFContent(List<Map<String, dynamic>> recommendations) {
    final sprintList = recommendations.where((r) => r['type'] == 'sprint').toList();
    final steadyList = recommendations.where((r) => r['type'] == 'steady').toList();
    final safeList = recommendations.where((r) => r['type'] == 'safe').toList();

    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        if (sprintList.isNotEmpty) ...[
          _buildPDFSection('冲刺院校', sprintList, PdfColors.orange),
          pw.SizedBox(height: 20),
        ],
        if (steadyList.isNotEmpty) ...[
          _buildPDFSection('稳妥院校', steadyList, PdfColors.blue),
          pw.SizedBox(height: 20),
        ],
        if (safeList.isNotEmpty) ...[
          _buildPDFSection('保底院校', safeList, PdfColors.green),
        ],
      ],
    );
  }

  /// 构建PDF章节
  static pw.Widget _buildPDFSection(
    String title,
    List<Map<String, dynamic>> items,
    PdfColor color,
  ) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          decoration: pw.BoxDecoration(
            color: color,
            borderRadius: pw.BorderRadius.circular(4),
          ),
          child: pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 14,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
            ),
          ),
        ),
        pw.SizedBox(height: 10),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey300),
          columnWidths: {
            0: const pw.FlexColumnWidth(3),
            1: const pw.FlexColumnWidth(3),
            2: const pw.FlexColumnWidth(2),
            3: const pw.FlexColumnWidth(2),
          },
          children: [
            // 表头
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: PdfColors.grey100),
              children: [
                _buildPDFCell('院校', isHeader: true),
                _buildPDFCell('专业', isHeader: true),
                _buildPDFCell('2024分数', isHeader: true),
                _buildPDFCell('2024位次', isHeader: true),
              ],
            ),
            // 数据行
            ...items.map((item) => pw.TableRow(
              children: [
                _buildPDFCell(item['school_name'] ?? ''),
                _buildPDFCell(item['major_name'] ?? ''),
                _buildPDFCell('${item['min_score'] ?? '-'}'),
                _buildPDFCell('${item['min_rank'] ?? '-'}'),
              ],
            )),
          ],
        ),
      ],
    );
  }

  /// 构建PDF单元格
  static pw.Widget _buildPDFCell(String text, {bool isHeader = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 11 : 10,
          fontWeight: isHeader ? pw.FontWeight.bold : null,
        ),
      ),
    );
  }

  /// 构建Excel汇总表
  static void _buildSummarySheet(
    Sheet sheet,
    String studentName,
    int totalScore,
    int rank,
    List<Map<String, dynamic>> recommendations,
  ) {
    final sprintCount = recommendations.where((r) => r['type'] == 'sprint').length;
    final steadyCount = recommendations.where((r) => r['type'] == 'steady').length;
    final safeCount = recommendations.where((r) => r['type'] == 'safe').length;

    var row = 0;
    
    // 标题
    sheet.merge(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row),
                CellIndex.indexByColumnRow(columnIndex: 3, rowIndex: row));
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '高考志愿填报表'
      ..cellStyle = CellStyle(
        bold: true,
        fontSize: 18,
        horizontalAlign: HorizontalAlign.Center,
      );
    row += 2;

    // 考生信息
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '考生姓名'
      ..cellStyle = CellStyle(bold: true);
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = studentName;
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '高考总分'
      ..cellStyle = CellStyle(bold: true);
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = totalScore;
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '全省位次'
      ..cellStyle = CellStyle(bold: true);
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = rank;
    row += 2;

    // 统计信息
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '推荐统计'
      ..cellStyle = CellStyle(bold: true, fontSize: 14);
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '冲刺院校'
      ..cellStyle = CellStyle(backgroundColorHex: '#FFE4B5');
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = sprintCount;
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '稳妥院校'
      ..cellStyle = CellStyle(backgroundColorHex: '#ADD8E6');
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = steadyCount;
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '保底院校'
      ..cellStyle = CellStyle(backgroundColorHex: '#90EE90');
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = safeCount;
    row++;

    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
      ..value = '总计'
      ..cellStyle = CellStyle(bold: true);
    sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
      ..value = recommendations.length
      ..cellStyle = CellStyle(bold: true);
  }

  /// 构建Excel详细表
  static void _buildDetailSheet(Sheet sheet, List<Map<String, dynamic>> recommendations) {
    // 表头
    final headers = ['类型', '院校名称', '专业名称', '2024最低分', '2024最低位次', '录取概率', '备注'];
    for (var i = 0; i < headers.length; i++) {
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: i, rowIndex: 0))
        ..value = headers[i]
        ..cellStyle = CellStyle(
          bold: true,
          backgroundColorHex: '#4472C4',
          fontColorHex: '#FFFFFF',
        );
    }

    // 数据
    for (var i = 0; i < recommendations.length; i++) {
      final item = recommendations[i];
      final row = i + 1;
      
      final type = item['type'] as String? ?? '';
      String typeText;
      String bgColor;
      switch (type) {
        case 'sprint':
          typeText = '冲刺';
          bgColor = '#FFE4B5';
          break;
        case 'steady':
          typeText = '稳妥';
          bgColor = '#ADD8E6';
          break;
        case 'safe':
          typeText = '保底';
          bgColor = '#90EE90';
          break;
        default:
          typeText = type;
          bgColor = '#FFFFFF';
      }

      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 0, rowIndex: row))
        ..value = typeText
        ..cellStyle = CellStyle(backgroundColorHex: bgColor);
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 1, rowIndex: row))
        ..value = item['school_name'] ?? '';
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 2, rowIndex: row))
        ..value = item['major_name'] ?? '';
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 3, rowIndex: row))
        ..value = item['min_score'] ?? '';
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 4, rowIndex: row))
        ..value = item['min_rank'] ?? '';
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 5, rowIndex: row))
        ..value = '${item['probability'] ?? '-'}%';
      sheet.cell(CellIndex.indexByColumnRow(columnIndex: 6, rowIndex: row))
        ..value = item['notes'] ?? '';
    }

    // 设置列宽
    sheet.setColumnWidth(0, 10);
    sheet.setColumnWidth(1, 25);
    sheet.setColumnWidth(2, 30);
    sheet.setColumnWidth(3, 12);
    sheet.setColumnWidth(4, 12);
    sheet.setColumnWidth(5, 12);
    sheet.setColumnWidth(6, 20);
  }

  /// 保存并分享文件
  static Future<void> _saveAndShareFile({
    required Uint8List bytes,
    required String fileName,
    required String mimeType,
  }) async {
    // 获取临时目录
    final tempDir = await getTemporaryDirectory();
    final filePath = '${tempDir.path}/$fileName';
    
    // 保存文件
    final file = File(filePath);
    await file.writeAsBytes(bytes);
    
    // 分享文件
    await Share.shareXFiles(
      [XFile(filePath, mimeType: mimeType)],
      subject: fileName,
    );
  }
}
