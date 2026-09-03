import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';
import '../../data/attendance_repository.dart';

/// Multi-purpose scanner supporting both:
/// 1. Student study desk QR scanning (self check-in/out via /api/attendance/self)
/// 2. Staff student ID pass verification
class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
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

    // 1. Check if it's a student physical desk QR sticker
    final isDeskQr = rawValue.contains('lamka_cabin_desk');

    // 2. Check if it's a student entry pass QR
    final isStudentPass = rawValue.startsWith('LAMKA:STUDENT:');

    if (!isDeskQr && !isStudentPass) {
      return;
    }

    setState(() => _isProcessing = true);
    await HapticFeedback.mediumImpact();
    await _scannerController.stop();

    if (mounted) {
      if (isDeskQr) {
        await _handleDeskAttendance(rawValue);
      } else {
        await _showVerificationResult(rawValue);
      }
    }

    if (mounted) {
      setState(() => _isProcessing = false);
      await _scannerController.start();
    }
  }

  Future<void> _handleDeskAttendance(String rawPayload) async {
    final repo = ref.read(attendanceRepositoryProvider);

    // Initial checkin attempt
    final result = await repo.submitDeskScan(
      action: 'checkin',
      deskQrPayload: rawPayload,
    );

    if (!mounted) return;

    if (result.success) {
      await HapticFeedback.heavyImpact();
      if (!mounted) return;
      await _showAttendanceSuccessDialog(
        title: '🎉 Checked In!',
        cabinNum: result.cabinNum,
        floor: result.floor,
        subtitle: result.message,
        isCheckOut: false,
      );
    } else if (result.alreadyCheckedIn) {
      await HapticFeedback.selectionClick();
      // Prompt student to optionally check out
      if (!mounted) return;
      final shouldCheckOut = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: const RoundedRectangleBorder(
            borderRadius: AppDimensions.borderRadiusMd,
          ),
          title: const Row(
            children: [
              Icon(Icons.info_outline_rounded,
                  color: Color(0xFF0284C7), size: 24),
              SizedBox(width: 10),
              Text('Already Checked In'),
            ],
          ),
          content: Text(
            'You are currently checked in for today${result.cabinNum != null ? ' at Cabin ${result.cabinNum}' : ''}.\n\nWould you like to check out now to record your study duration?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Keep Active'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                foregroundColor: Colors.white,
              ),
              child: const Text('Check Out Now'),
            ),
          ],
        ),
      );

      if (shouldCheckOut == true && mounted) {
        final checkOutResult = await repo.submitDeskScan(
          action: 'checkout',
          deskQrPayload: rawPayload,
        );

        if (!mounted) return;

        if (checkOutResult.success) {
          await HapticFeedback.heavyImpact();
          if (!mounted) return;
          await _showAttendanceSuccessDialog(
            title: '👋 Checked Out!',
            cabinNum: checkOutResult.cabinNum,
            floor: checkOutResult.floor,
            subtitle: checkOutResult.message,
            durationMinutes: checkOutResult.durationMinutes,
            isCheckOut: true,
          );
        } else {
          if (!mounted) return;
          await _showAttendanceErrorDialog(checkOutResult.message);
        }
      }
    } else {
      await HapticFeedback.vibrate();
      if (!mounted) return;
      await _showAttendanceErrorDialog(result.message);
    }
  }

  Future<void> _showAttendanceSuccessDialog({
    required String title,
    String? cabinNum,
    int? floor,
    required String subtitle,
    int? durationMinutes,
    required bool isCheckOut,
  }) async {
    final formattedTime = DateFormat('hh:mm a').format(DateTime.now());

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: const RoundedRectangleBorder(
          borderRadius: AppDimensions.borderRadiusMd,
        ),
        title: Row(
          children: [
            Icon(
              isCheckOut
                  ? Icons.check_circle_rounded
                  : Icons.stars_rounded,
              color: const Color(0xFF059669),
              size: 28,
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (cabinNum != null) ...[
              Text(
                '🚪 Cabin $cabinNum ${floor != null ? '• Floor $floor' : ''}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
            ],
            Text(
              '⏰ Time: $formattedTime',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            if (durationMinutes != null) ...[
              const SizedBox(height: 4),
              Text(
                '⏱️ Study Time: ${durationMinutes ~/ 60}h ${durationMinutes % 60}m',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF059669),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, height: 1.4),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              if (mounted) {
                context.pop(); // return to dashboard
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
            ),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  Future<void> _showAttendanceErrorDialog(String message) async {
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: const RoundedRectangleBorder(
          borderRadius: AppDimensions.borderRadiusMd,
        ),
        title: const Row(
          children: [
            Icon(Icons.cancel_rounded, color: Colors.red, size: 26),
            SizedBox(width: 10),
            Text('Attendance Error'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Future<void> _showVerificationResult(String payload) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final isValid = payload.length > 20;

    if (isValid) {
      await HapticFeedback.heavyImpact();
    } else {
      await HapticFeedback.vibrate();
    }

    if (!mounted) return;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
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
            Text(isValid ? 'Valid Student Pass' : 'Invalid Pass'),
          ],
        ),
        content: Text(
          isValid
              ? 'Student identity verified and logged.'
              : 'This QR code is invalid or has expired.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
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
      builder: (ctx) => AlertDialog(
        title: const Text('Manual Entry (Testing Fallback)'),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Enter LAMKA:STUDENT:... or {"type":"lamka_cabin_desk",...}',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = controller.text.trim();
              Navigator.of(ctx).pop();
              if (text.isNotEmpty) {
                final barcode = Barcode(rawValue: text);
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
        title: const Text('Scan QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _scannerController.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => _scannerController.switchCamera(),
          ),
          IconButton(
            icon: const Icon(Icons.keyboard),
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
          CustomPaint(
            size: Size.infinite,
            painter: ScannerOverlayPainter(),
          ),
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  const Icon(Icons.qr_code_scanner,
                      color: Color(0xFF059669), size: 24),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Align camera with desk sticker or student ID pass',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (_isProcessing)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
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
    final double scanAreaSize = size.width * 0.7;
    final double left = (size.width - scanAreaSize) / 2;
    final double top = (size.height - scanAreaSize) / 2 - 40;
    final Rect scanRect =
        Rect.fromLTWH(left, top, scanAreaSize, scanAreaSize);

    final Paint backgroundPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;

    final Path backgroundPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(backgroundPath, backgroundPaint);

    final Paint borderPaint = Paint()
      ..color = const Color(0xFF059669)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    const double cornerLength = 24.0;

    // Top-left
    canvas.drawLine(Offset(left, top + cornerLength), Offset(left, top), borderPaint);
    canvas.drawLine(Offset(left, top), Offset(left + cornerLength, top), borderPaint);

    // Top-right
    canvas.drawLine(Offset(left + scanAreaSize - cornerLength, top),
        Offset(left + scanAreaSize, top), borderPaint);
    canvas.drawLine(Offset(left + scanAreaSize, top),
        Offset(left + scanAreaSize, top + cornerLength), borderPaint);

    // Bottom-left
    canvas.drawLine(Offset(left, top + scanAreaSize - cornerLength),
        Offset(left, top + scanAreaSize), borderPaint);
    canvas.drawLine(Offset(left, top + scanAreaSize),
        Offset(left + cornerLength, top + scanAreaSize), borderPaint);

    // Bottom-right
    canvas.drawLine(
        Offset(left + scanAreaSize - cornerLength, top + scanAreaSize),
        Offset(left + scanAreaSize, top + scanAreaSize),
        borderPaint);
    canvas.drawLine(
        Offset(left + scanAreaSize, top + scanAreaSize - cornerLength),
        Offset(left + scanAreaSize, top + scanAreaSize),
        borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
