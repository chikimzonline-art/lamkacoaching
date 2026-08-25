// Immutable domain entities representing departments, courses, and batch schedules.

/// Academic department category (e.g. SSC, Banking, UPSC, Railway, Computer).
class DepartmentEntity {
  final String id;
  final String name;
  final List<CourseEntity> courses;

  const DepartmentEntity({
    required this.id,
    required this.name,
    this.courses = const [],
  });

  factory DepartmentEntity.fromJson(Map<String, dynamic> json) {
    final rawCourses = json['courses'] as List<dynamic>? ?? [];
    return DepartmentEntity(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'General',
      courses: rawCourses
          .map((c) => CourseEntity.fromJson(c as Map<String, dynamic>, deptName: json['name'] as String?))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'courses': courses.map((c) => c.toJson()).toList(),
  };
}

/// Academic batch timetable and seat availability.
class BatchEntity {
  final String id;
  final String batchName;
  final DateTime startDate;
  final DateTime? endDate;
  final String timing;
  final int seatsAvailable;
  final int totalSeats;
  final String status; // 'enrolling', 'almost_full', 'full', 'closed'
  final String? description;

  const BatchEntity({
    required this.id,
    required this.batchName,
    required this.startDate,
    this.endDate,
    required this.timing,
    required this.seatsAvailable,
    required this.totalSeats,
    this.status = 'enrolling',
    this.description,
  });

  bool get isEnrolling => status == 'enrolling';
  bool get isAlmostFull => status == 'almost_full';
  bool get isFull => status == 'full';
  bool get isClosed => status == 'closed';
  bool get hasSeats => seatsAvailable > 0 && !isClosed;

  factory BatchEntity.fromJson(Map<String, dynamic> json) {
    final seats = json['seats'] as int? ?? json['seatsAvailable'] as int? ?? 0;
    final total = json['totalSeats'] as int? ?? seats;

    return BatchEntity(
      id: json['id'] as String? ?? '',
      batchName: json['batchName'] as String? ?? 'Batch',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      timing: json['timing'] as String? ?? 'Flexible Timing',
      seatsAvailable: seats,
      totalSeats: total,
      status: json['status'] as String? ?? 'enrolling',
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'batchName': batchName,
    'startDate': startDate.toIso8601String(),
    'endDate': endDate?.toIso8601String(),
    'timing': timing,
    'seatsAvailable': seatsAvailable,
    'totalSeats': totalSeats,
    'status': status,
    'description': description,
  };
}

/// Detailed course catalog entry with batch availability.
class CourseEntity {
  final String id;
  final String name;
  final String departmentId;
  final String departmentName;
  final String? duration;
  final int? durationValue;
  final String? durationUnit;
  final int totalFee; // in Rupees
  final String? description;
  final String status;
  final List<BatchEntity> batches;
  final BatchEntity? nextBatch;
  final BatchEntity? activeBatch;
  final bool isOngoing;
  final bool hasOpenBatches;

  const CourseEntity({
    required this.id,
    required this.name,
    required this.departmentId,
    required this.departmentName,
    this.duration,
    this.durationValue,
    this.durationUnit,
    this.totalFee = 0,
    this.description,
    this.status = 'active',
    this.batches = const [],
    this.nextBatch,
    this.activeBatch,
    this.isOngoing = false,
    this.hasOpenBatches = false,
  });

  BatchEntity? get effectiveNextBatch {
    if (nextBatch != null) return nextBatch;
    if (batches.isEmpty) return null;
    try {
      return batches.firstWhere(
        (b) => b.hasSeats,
        orElse: () => batches.first,
      );
    } catch (_) {
      return batches.first;
    }
  }


  factory CourseEntity.fromJson(Map<String, dynamic> json, {String? deptName}) {
    final rawBatches = json['batches'] as List<dynamic>? ?? [];
    final parsedBatches = rawBatches
        .map((b) => BatchEntity.fromJson(b as Map<String, dynamic>))
        .toList();

    BatchEntity? parsedNext;
    if (json['nextBatch'] != null) {
      parsedNext = BatchEntity.fromJson(json['nextBatch'] as Map<String, dynamic>);
    } else if (parsedBatches.isNotEmpty) {
      parsedNext = parsedBatches.firstWhere(
        (b) => b.hasSeats,
        orElse: () => parsedBatches.first,
      );
    }

    BatchEntity? parsedActive;
    if (json['activeBatch'] != null) {
      parsedActive = BatchEntity.fromJson(json['activeBatch'] as Map<String, dynamic>);
    }

    final rawFee = json['totalFee'];
    int feeInRupees = 0;
    if (rawFee is int) {
      // If fee is stored in paise (e.g. > 100000), convert to Rupees if needed, else take as rupees
      feeInRupees = rawFee;
    } else if (rawFee is num) {
      feeInRupees = rawFee.toInt();
    }

    return CourseEntity(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Course',
      departmentId: json['departmentId'] as String? ?? '',
      departmentName: deptName ?? json['departmentName'] as String? ?? 'General',
      duration: json['duration'] as String?,
      durationValue: json['durationValue'] as int?,
      durationUnit: json['durationUnit'] as String?,
      totalFee: feeInRupees,
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'active',
      batches: parsedBatches,
      nextBatch: parsedNext,
      activeBatch: parsedActive,
      isOngoing: json['isOngoing'] as bool? ?? (parsedActive != null),
      hasOpenBatches: json['hasOpenBatches'] as bool? ?? (parsedBatches.any((b) => b.hasSeats)),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'departmentId': departmentId,
    'departmentName': departmentName,
    'duration': duration,
    'durationValue': durationValue,
    'durationUnit': durationUnit,
    'totalFee': totalFee,
    'description': description,
    'status': status,
    'batches': batches.map((b) => b.toJson()).toList(),
    'nextBatch': nextBatch?.toJson(),
    'activeBatch': activeBatch?.toJson(),
    'isOngoing': isOngoing,
    'hasOpenBatches': hasOpenBatches,
  };
}
