// Immutable domain entities representing student dashboard data,
// schedules, active cabin bookings, and institute announcements.

/// Represents an active or past course enrollment for a student.
class EnrollmentEntity {
  final String id;
  final String studentId;
  final String courseId;
  final String courseName;
  final String departmentName;
  final String? batchId;
  final String? batchName;
  final String? batchTiming;
  final String? rollNumber;
  final int? totalFee;
  final int? paidAmount;
  final String status;
  final DateTime? enrolledAt;

  const EnrollmentEntity({
    required this.id,
    required this.studentId,
    required this.courseId,
    required this.courseName,
    required this.departmentName,
    this.batchId,
    this.batchName,
    this.batchTiming,
    this.rollNumber,
    this.totalFee,
    this.paidAmount,
    this.status = 'active',
    this.enrolledAt,
  });

  bool get isActive => status.toLowerCase() == 'active';

  factory EnrollmentEntity.fromJson(Map<String, dynamic> json) {
    final course = json['course'] as Map<String, dynamic>?;
    final dept = course?['department'] as Map<String, dynamic>?;
    final batch = json['batch'] as Map<String, dynamic>?;

    return EnrollmentEntity(
      id: json['id'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      courseId: json['courseId'] as String? ?? course?['id'] as String? ?? '',
      courseName: course?['name'] as String? ?? json['courseName'] as String? ?? 'Course',
      departmentName: dept?['name'] as String? ?? json['departmentName'] as String? ?? 'General',
      batchId: batch?['id'] as String? ?? json['batchId'] as String?,
      batchName: batch?['batchName'] as String? ?? json['batchName'] as String?,
      batchTiming: batch?['timing'] as String? ?? json['batchTiming'] as String?,
      rollNumber: json['rollNumber'] as String?,
      totalFee: json['totalFee'] as int?,
      paidAmount: json['paidAmount'] as int?,
      status: json['status'] as String? ?? 'active',
      enrolledAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'studentId': studentId,
    'courseId': courseId,
    'courseName': courseName,
    'departmentName': departmentName,
    'batchId': batchId,
    'batchName': batchName,
    'batchTiming': batchTiming,
    'rollNumber': rollNumber,
    'totalFee': totalFee,
    'paidAmount': paidAmount,
    'status': status,
    'enrolledAt': enrolledAt?.toIso8601String(),
  };
}

/// Official broadcast notice or pinned bulletin from the institute.
class NoticeEntity {
  final String id;
  final String title;
  final String content;
  final String? category;
  final bool pinned;
  final DateTime createdAt;

  const NoticeEntity({
    required this.id,
    required this.title,
    required this.content,
    this.category,
    this.pinned = false,
    required this.createdAt,
  });

  factory NoticeEntity.fromJson(Map<String, dynamic> json) {
    return NoticeEntity(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      category: json['category'] as String? ?? 'Announcement',
      pinned: json['pinned'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'content': content,
    'category': category,
    'pinned': pinned,
    'createdAt': createdAt.toIso8601String(),
  };
}

/// Live timeline schedule item representing today's batches/classes.
class StudentScheduleItem {
  final String id;
  final String subject;
  final String batchName;
  final String timing;
  final String? roomOrCabin;
  final String? instructor;
  final String status; // 'in_session', 'upcoming', 'completed'

  const StudentScheduleItem({
    required this.id,
    required this.subject,
    required this.batchName,
    required this.timing,
    this.roomOrCabin,
    this.instructor,
    this.status = 'upcoming',
  });

  bool get isInSession => status == 'in_session';
  bool get isUpcoming => status == 'upcoming';
  bool get isCompleted => status == 'completed';
}

/// Active study cabin reservation for a student.
class ActiveDeskBookingEntity {
  final String id;
  final int cabinNum;
  final int floor;
  final String type; // 'morning_shift', 'day_shift', 'night_shift', 'reserved'
  final String? startTime;
  final String? endTime;
  final DateTime startDate;
  final DateTime? endDate;
  final String status;

  const ActiveDeskBookingEntity({
    required this.id,
    required this.cabinNum,
    required this.floor,
    required this.type,
    this.startTime,
    this.endTime,
    required this.startDate,
    this.endDate,
    this.status = 'active',
  });

  String get formattedType {
    switch (type) {
      case 'morning_shift':
        return 'Morning Shift (5 AM - 10 AM)';
      case 'day_shift':
        return 'Day Shift (10 AM - 5 PM)';
      case 'night_shift':
        return 'Night Shift (5 PM - 12 AM)';
      case 'reserved':
        return 'Dedicated 24/7 Reserved';
      default:
        return type.replaceAll('_', ' ').toUpperCase();
    }
  }

  factory ActiveDeskBookingEntity.fromJson(Map<String, dynamic> json) {
    final cabin = json['cabin'] as Map<String, dynamic>?;
    return ActiveDeskBookingEntity(
      id: json['id'] as String? ?? '',
      cabinNum: cabin?['cabinNum'] as int? ?? json['cabinNum'] as int? ?? 0,
      floor: cabin?['floor'] as int? ?? json['floor'] as int? ?? 1,
      type: json['type'] as String? ?? 'day_shift',
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      status: json['status'] as String? ?? 'active',
    );
  }
}

/// Complete aggregated dashboard state for the student home screen.
class StudentDashboardSummary {
  final List<EnrollmentEntity> enrollments;
  final List<StudentScheduleItem> todaySchedule;
  final List<NoticeEntity> notices;
  final ActiveDeskBookingEntity? activeBooking;
  final String? dailyQuote;

  const StudentDashboardSummary({
    this.enrollments = const [],
    this.todaySchedule = const [],
    this.notices = const [],
    this.activeBooking,
    this.dailyQuote,
  });

  bool get hasActiveEnrollments => enrollments.isNotEmpty;
  bool get hasActiveDesk => activeBooking != null;
  bool get hasScheduleToday => todaySchedule.isNotEmpty;

  StudentDashboardSummary copyWith({
    List<EnrollmentEntity>? enrollments,
    List<StudentScheduleItem>? todaySchedule,
    List<NoticeEntity>? notices,
    ActiveDeskBookingEntity? activeBooking,
    String? dailyQuote,
  }) {
    return StudentDashboardSummary(
      enrollments: enrollments ?? this.enrollments,
      todaySchedule: todaySchedule ?? this.todaySchedule,
      notices: notices ?? this.notices,
      activeBooking: activeBooking ?? this.activeBooking,
      dailyQuote: dailyQuote ?? this.dailyQuote,
    );
  }
}
