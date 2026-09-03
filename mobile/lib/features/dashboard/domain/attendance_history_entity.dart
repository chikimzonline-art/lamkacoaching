import 'package:intl/intl.dart';

/// Single study cabin attendance check-in record.
class AttendanceRecordEntity {
  final String id;
  final DateTime date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final int? durationMinutes;
  final int cabinNum;
  final int floor;
  final String bookingType;

  const AttendanceRecordEntity({
    required this.id,
    required this.date,
    this.checkIn,
    this.checkOut,
    this.durationMinutes,
    required this.cabinNum,
    required this.floor,
    required this.bookingType,
  });

  bool get isActive => checkIn != null && checkOut == null;

  String get formattedDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final recordDay = DateTime(date.year, date.month, date.day);

    if (recordDay == today) {
      return 'Today, ${DateFormat('dd MMM').format(date)}';
    } else if (recordDay == today.subtract(const Duration(days: 1))) {
      return 'Yesterday, ${DateFormat('dd MMM').format(date)}';
    }
    return DateFormat('EEE, dd MMM yyyy').format(date);
  }

  String get formattedCheckIn {
    if (checkIn == null) return '--';
    return DateFormat('hh:mm a').format(checkIn!);
  }

  String get formattedCheckOut {
    if (checkOut == null) return isActive ? 'In Session' : '--';
    return DateFormat('hh:mm a').format(checkOut!);
  }

  String get formattedDuration {
    if (isActive && checkIn != null) {
      final elapsedMin = DateTime.now().difference(checkIn!).inMinutes;
      if (elapsedMin < 60) return '${elapsedMin}m so far';
      return '${elapsedMin ~/ 60}h ${elapsedMin % 60}m so far';
    }
    if (durationMinutes == null || durationMinutes! <= 0) return '--';
    final hours = durationMinutes! ~/ 60;
    final mins = durationMinutes! % 60;
    if (hours == 0) return '${mins}m';
    if (mins == 0) return '${hours}h';
    return '${hours}h ${mins}m';
  }

  String get formattedShift {
    switch (bookingType) {
      case 'morning_shift':
        return 'Morning Shift (5 AM - 10 AM)';
      case 'day_shift':
        return 'Day Shift (10 AM - 5 PM)';
      case 'night_shift':
        return 'Night Shift (5 PM - 12 AM)';
      case 'reserved':
        return '24/7 Dedicated Seat';
      default:
        return bookingType.replaceAll('_', ' ').toUpperCase();
    }
  }

  factory AttendanceRecordEntity.fromJson(Map<String, dynamic> json) {
    final cabin = json['cabin'] as Map<String, dynamic>?;

    return AttendanceRecordEntity(
      id: json['id'] as String? ?? '',
      date: json['date'] != null
          ? DateTime.tryParse(json['date'] as String) ?? DateTime.now()
          : DateTime.now(),
      checkIn: json['checkIn'] != null
          ? DateTime.tryParse(json['checkIn'] as String)
          : null,
      checkOut: json['checkOut'] != null
          ? DateTime.tryParse(json['checkOut'] as String)
          : null,
      durationMinutes: json['durationMinutes'] as int?,
      cabinNum: cabin?['cabinNum'] as int? ?? json['cabinNum'] as int? ?? 0,
      floor: cabin?['floor'] as int? ?? json['floor'] as int? ?? 1,
      bookingType: json['bookingType'] as String? ?? 'day_shift',
    );
  }
}

/// Aggregated response from GET /api/attendance/self.
class AttendanceHistoryResponse {
  final List<AttendanceRecordEntity> records;
  final int totalSessions;
  final double totalHours;

  const AttendanceHistoryResponse({
    required this.records,
    required this.totalSessions,
    required this.totalHours,
  });

  factory AttendanceHistoryResponse.fromJson(Map<String, dynamic> json) {
    final rawRecords = json['records'] as List<dynamic>? ?? [];
    final records = rawRecords
        .map((r) => AttendanceRecordEntity.fromJson(r as Map<String, dynamic>))
        .toList();

    return AttendanceHistoryResponse(
      records: records,
      totalSessions: json['totalSessions'] as int? ?? records.length,
      totalHours: (json['totalHours'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
