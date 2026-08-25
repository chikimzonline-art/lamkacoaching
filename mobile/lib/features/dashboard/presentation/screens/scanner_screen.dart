import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  late MobileScannerController _scannerController;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _processBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    
    final barcode = barcodes.first;
    if (barcode.rawValue == null) return;

    final String rawValue = barcode.rawValue!;
    
    // Expecting LAMKA:STUDENT:<userId>:<timestamp>:<checksum>
    if (!rawValue.startsWith('LAMKA:STUDENT:')) {
      return;
    }

    setState(() => _isProcessing = true);
    await HapticFeedback.mediumImpact();

    // Pause scanner during verification
    await _scannerController.stop();

    if (mounted) {
      await _showVerificationResult(context, rawValue);
    }
    
    if (mounted) {
      setState(() => _isProcessing = false);
      await _scannerController.start();
    }
  }

  Future<void> _showVerificationResult(BuildContext context, String payload) async {
    // Simulated Backend Call for /api/cabins/verify-qr
    await Future.delayed(const Duration(milliseconds: 800));

    // Simple mock logic based on the payload length or just accept it
    final isValid = payload.length > 20;

    if (isValid) {
      await HapticFeedback.heavyImpact();
    } else {
      await HapticFeedback.vibrate();
    }

    if (!context.mounted) return;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: const RoundedRectangleBorder(
          borderRadius: AppDimensions.borderRadiusMd,
        ),
        title: Row(
          children: [
            Icon(
              isValid ? Icons.check_circle_rounded : Icons.cancel_rounded,
              color: isValid ? AppColors.success : AppColors.error,
              size: 28,
            ),
            const SizedBox(width: 12),
            Text(isValid ? 'Valid Pass' : 'Invalid Pass'),
          ],
        ),
        content: Text(
          isValid 
            ? 'Student identity verified and logged.' 
            : 'This QR code is invalid or has expired.',
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Continue Scanning'),
          ),
        ],
      ),
    );
  }

  void _showManualEntryFallback() {
    final TextEditingController controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manual Entry (Windows Fallback)'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Enter LAMKA:STUDENT:payload',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.pop();
              if (controller.text.isNotEmpty) {
                // Mock a barcode capture
                final barcode = Barcode(rawValue: controller.text);
                _processBarcode(BarcodeCapture(barcodes: [barcode]));
              }
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Student Pass'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _scannerController.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _scannerController.switchCamera(),
          ),
          IconButton(
            icon: const Icon(Icons.keyboard),
            tooltip: 'Manual Entry (Windows)',
            onPressed: _showManualEntryFallback,
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _processBarcode,
          ),
          
          // Viewfinder overlay
          CustomPaint(
            painter: ScannerOverlayPainter(),
            child: const SizedBox.expand(),
          ),
          
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: AppCard(
                  padding: EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text('Verifying Pass...'),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.fill;

    // Draw dark overlay
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    // Cut out clear center square
    final double rectSize = size.width * 0.7;
    final double left = (size.width - rectSize) / 2;
    final double top = (size.height - rectSize) / 2;
    final rect = Rect.fromLTWH(left, top, rectSize, rectSize);

    paint.blendMode = BlendMode.clear;
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(16)),
      paint,
    );

    // Draw scan lines/corners
    paint.blendMode = BlendMode.srcOver;
    paint.color = AppColors.lightAccentSky;
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 4;

    const double cornerLength = 30;
    
    // Top Left
    canvas.drawLine(Offset(left, top + cornerLength), Offset(left, top), paint);
    canvas.drawLine(Offset(left, top), Offset(left + cornerLength, top), paint);

    // Top Right
    canvas.drawLine(Offset(rect.right - cornerLength, top), Offset(rect.right, top), paint);
    canvas.drawLine(Offset(rect.right, top), Offset(rect.right, top + cornerLength), paint);

    // Bottom Left
    canvas.drawLine(Offset(left, rect.bottom - cornerLength), Offset(left, rect.bottom), paint);
    canvas.drawLine(Offset(left, rect.bottom), Offset(left + cornerLength, rect.bottom), paint);

    // Bottom Right
    canvas.drawLine(Offset(rect.right - cornerLength, rect.bottom), Offset(rect.right, rect.bottom), paint);
    canvas.drawLine(Offset(rect.right, rect.bottom), Offset(rect.right, rect.bottom - cornerLength), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
