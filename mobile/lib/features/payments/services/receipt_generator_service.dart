
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';

class ReceiptGeneratorService {
  Future<void> generateAndPrintReceipt({
    required String studentName,
    required String invoiceId,
    required double amount,
    required String itemName,
    required DateTime date,
  }) async {
    final pdf = pw.Document();

    // In a real scenario, you'd load the logo from assets or network
    // final logoImage = await imageFromAssetBundle('assets/images/logo.png');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'LAMKA COACHING CENTER',
                        style: const pw.TextStyle(
                          fontSize: 24,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.blue900,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text('IB Road, Churachandpur'),
                      pw.Text('Manipur, India'),
                      pw.Text('Website: lamkacoaching.com'),
                    ],
                  ),
                  pw.Container(
                    height: 50,
                    width: 50,
                    decoration: const pw.BoxDecoration(
                      color: PdfColors.grey200,
                      shape: pw.BoxShape.circle,
                    ),
                    child: pw.Center(child: pw.Text('LOGO')),
                  ),
                ],
              ),
              pw.SizedBox(height: 40),

              // Title
              pw.Center(
                child: pw.Text(
                  'PAYMENT RECEIPT',
                  style: const pw.TextStyle(
                    fontSize: 20,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.SizedBox(height: 30),

              // Details
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Billed To:', style: const pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      pw.Text(studentName),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Receipt No: $invoiceId'),
                      pw.Text('Date: ${DateFormat('dd MMM yyyy').format(date)}'),
                      pw.Text('Payment Method: Razorpay'),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 30),

              // Table
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400),
                columnWidths: {
                  0: const pw.FlexColumnWidth(3),
                  1: const pw.FlexColumnWidth(1),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8.0),
                        child: pw.Text('Description', style: const pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8.0),
                        child: pw.Text('Amount (INR)', style: const pw.TextStyle(fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.right),
                      ),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8.0),
                        child: pw.Text(itemName),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8.0),
                        child: pw.Text('₹${amount.toStringAsFixed(2)}', textAlign: pw.TextAlign.right),
                      ),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Total
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Text(
                    'Total Paid: ₹${amount.toStringAsFixed(2)}',
                    style: const pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
                  ),
                ],
              ),
              pw.SizedBox(height: 50),

              // Watermark/Footer
              pw.Center(
                child: pw.Text(
                  'PAID IN FULL',
                  style: const pw.TextStyle(
                    fontSize: 40,
                    color: PdfColors.green100,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.Spacer(),
              pw.Divider(),
              pw.Center(
                child: pw.Text(
                  'This is a computer generated receipt and does not require a physical signature.',
                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                ),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Lamka_Receipt_$invoiceId.pdf',
    );
  }
}
