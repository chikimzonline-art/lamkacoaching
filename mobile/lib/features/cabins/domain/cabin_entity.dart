// Domain entities for the Study Cabins Seat Matrix & Slot Reservation Engine.
import '../../../../core/utils/formatters.dart';

class CabinShiftInfo {
  final String type;
  final String startTime;
  final String endTime;

  const CabinShiftInfo({
    required this.type,
    required this.startTime,
    required this.endTime,
  });

  String get formattedLabel {
    switch (type) {
      case 'morning_shift':
        return 'Morning (5AM - 10AM)';
      case 'day_shift':
        return 'Day (10AM - 5PM)';
      case 'night_shift':
        return 'Night (5PM - 12AM)';
      case 'reserved':
        return '24/7 Full Day';
      default:
        return type.replaceAll('_', ' ');
    }
  }

  factory CabinShiftInfo.fromJson(Map<String, dynamic> json) {
    return CabinShiftInfo(
      type: json['type'] as String? ?? '',
      startTime: json['startTime'] as String? ?? '',
      endTime: json['endTime'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type,
    'startTime': startTime,
    'endTime': endTime,
  };
}

class CabinEntity {
  final String id;
  final int floor;
  final int cabinNum;
  final String? notes;
  final bool isOccupied;
  final bool isBookedByMe;
  final List<String> bookedShifts;
  final List<CabinShiftInfo> activeShiftsToday;
  final int activeBookingsCount;

  const CabinEntity({
    required this.id,
    required this.floor,
    required this.cabinNum,
    this.notes,
    required this.isOccupied,
    this.isBookedByMe = false,
    this.bookedShifts = const [],
    this.activeShiftsToday = const [],
    this.activeBookingsCount = 0,
  });

  String get floorLabel {
    final suffixes = {1: 'st', 2: 'nd', 3: 'rd'};
    final suffix = suffixes[floor] ?? 'th';
    return '$floor$suffix Floor';
  }

  bool isShiftBooked(String shiftType) {
    if (isOccupied) return true;
    if (shiftType == 'reserved' && bookedShifts.isNotEmpty) return true;
    return bookedShifts.contains(shiftType);
  }

  bool get isFullyBooked {
    if (isOccupied) return true;
    if (bookedShifts.contains('reserved')) return true;
    return bookedShifts.length >= 3;
  }

  bool get hasAvailableShift => !isFullyBooked;

  bool isShiftAvailable(String shiftType) {
    if (isFullyBooked) return false;
    return !isShiftBooked(shiftType);
  }

  int get freeShiftsCount {
    if (isFullyBooked) return 0;
    int count = 0;
    if (!isShiftBooked('morning_shift')) count++;
    if (!isShiftBooked('day_shift')) count++;
    if (!isShiftBooked('night_shift')) count++;
    return count;
  }

  factory CabinEntity.fromJson(Map<String, dynamic> json) {
    final rawShifts = json['activeShiftsToday'] as List<dynamic>? ?? [];
    final rawBookedShifts = json['bookedShifts'] as List<dynamic>? ?? [];

    return CabinEntity(
      id: json['id'] as String? ?? '',
      floor: json['floor'] as int? ?? 1,
      cabinNum: json['cabinNum'] as int? ?? 0,
      notes: json['notes'] as String?,
      isOccupied: json['isOccupied'] as bool? ?? false,
      isBookedByMe: json['isBookedByMe'] as bool? ?? false,
      bookedShifts: rawBookedShifts.map((e) => e.toString()).toList(),
      activeShiftsToday: rawShifts
          .map((s) => CabinShiftInfo.fromJson(s as Map<String, dynamic>))
          .toList(),
      activeBookingsCount: json['activeBookingsCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'floor': floor,
    'cabinNum': cabinNum,
    'notes': notes,
    'isOccupied': isOccupied,
    'isBookedByMe': isBookedByMe,
    'bookedShifts': bookedShifts,
    'activeShiftsToday': activeShiftsToday.map((s) => s.toJson()).toList(),
    'activeBookingsCount': activeBookingsCount,
  };
}

class FloorGroupEntity {
  final int floor;
  final String label;
  final List<CabinEntity> cabins;

  const FloorGroupEntity({
    required this.floor,
    required this.label,
    required this.cabins,
  });

  int get availableCount => cabins.where((c) => !c.isOccupied).length;

  factory FloorGroupEntity.fromJson(Map<String, dynamic> json) {
    final rawCabins = json['cabins'] as List<dynamic>? ?? [];
    return FloorGroupEntity(
      floor: json['floor'] as int? ?? 1,
      label: json['label'] as String? ?? 'Floor ${json['floor'] ?? 1}',
      cabins: rawCabins
          .map((c) => CabinEntity.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CabinPricingEntity {
  final int registrationFee; // in paise
  final int reservedRate;     // in paise / month
  final int morningShiftRate; // in paise / month
  final int dayShiftRate;     // in paise / month
  final int nightShiftRate;   // in paise / month

  const CabinPricingEntity({
    this.registrationFee = 50000,
    this.reservedRate = 110000,
    this.morningShiftRate = 50000,
    this.dayShiftRate = 80000,
    this.nightShiftRate = 80000,
  });

  int rateForShift(String shiftType) {
    switch (shiftType) {
      case 'reserved':
        return reservedRate;
      case 'morning_shift':
        return morningShiftRate;
      case 'day_shift':
        return dayShiftRate;
      case 'night_shift':
        return nightShiftRate;
      default:
        return 0;
    }
  }

  factory CabinPricingEntity.fromJson(Map<String, dynamic> json) {
    return CabinPricingEntity(
      registrationFee: (json['registrationFee'] as int? ?? 500) * 100,
      reservedRate: (json['reservedRate'] as int? ?? 1100) * 100,
      morningShiftRate: (json['morningShiftRate'] as int? ?? 500) * 100,
      dayShiftRate: (json['dayShiftRate'] as int? ?? 800) * 100,
      nightShiftRate: (json['nightShiftRate'] as int? ?? 800) * 100,
    );
  }
}

class PendingCheckoutEntity {
  final String id;
  final String type;
  final DateTime? startDate;
  final DateTime? endDate;
  final int totalAmount; // in paise
  final String cabinId;
  final int cabinNum;
  final int floor;

  const PendingCheckoutEntity({
    required this.id,
    required this.type,
    this.startDate,
    this.endDate,
    required this.totalAmount,
    required this.cabinId,
    required this.cabinNum,
    required this.floor,
  });

  String get formattedTotalAmount => Formatters.formatPaiseToRupees(totalAmount);

  String get formattedType {
    switch (type) {
      case 'morning_shift':
        return 'Morning Shift';
      case 'day_shift':
        return 'Day Shift';
      case 'night_shift':
        return 'Night Shift';
      case 'reserved':
        return 'Dedicated Reserved';
      default:
        return type.replaceAll('_', ' ');
    }
  }

  factory PendingCheckoutEntity.fromJson(Map<String, dynamic> json) {
    final cabinInfo = json['cabinInfo'] as Map<String, dynamic>?;
    return PendingCheckoutEntity(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'reserved',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String)
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      totalAmount: json['totalAmount'] as int? ?? 0,
      cabinId: cabinInfo?['id'] as String? ?? '',
      cabinNum: cabinInfo?['cabinNum'] as int? ?? 0,
      floor: cabinInfo?['floor'] as int? ?? 1,
    );
  }
}

class MyCabinBookingEntity {
  final String id;
  final String cabinId;
  final int cabinNum;
  final int floor;
  final String type;
  final String status;
  final DateTime startDate;
  final DateTime? endDate;
  final String? startTime;
  final String? endTime;
  final int totalAmount;
  final int paidAmount;

  const MyCabinBookingEntity({
    required this.id,
    required this.cabinId,
    required this.cabinNum,
    required this.floor,
    required this.type,
    required this.status,
    required this.startDate,
    this.endDate,
    this.startTime,
    this.endTime,
    required this.totalAmount,
    required this.paidAmount,
  });

  bool get isActive => status == 'active';
  bool get isPendingPayment => status == 'pending_payment';

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
        return type.replaceAll('_', ' ');
    }
  }

  int? get daysRemaining {
    if (endDate == null) return null;
    final diff = endDate!.difference(DateTime.now()).inDays;
    return diff >= 0 ? diff : 0;
  }

  factory MyCabinBookingEntity.fromJson(Map<String, dynamic> json) {
    return MyCabinBookingEntity(
      id: json['id'] as String? ?? '',
      cabinId: json['cabinId'] as String? ?? '',
      cabinNum: json['cabinNum'] as int? ?? 0,
      floor: json['floor'] as int? ?? 1,
      type: json['type'] as String? ?? 'reserved',
      status: json['status'] as String? ?? 'active',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'] as String)
          : null,
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      totalAmount: json['totalAmount'] as int? ?? 0,
      paidAmount: json['paidAmount'] as int? ?? 0,
    );
  }
}

class StudentCabinDashboardData {
  final List<CabinEntity> cabins;
  final List<FloorGroupEntity> cabinsByFloor;
  final List<int> floors;
  final CabinPricingEntity pricing;
  final bool isFirstBooking;
  final bool isRegistrationWaived;
  final bool isSecondHalf;
  final DateTime? monthEndDate;
  final PendingCheckoutEntity? pendingCheckout;
  final List<MyCabinBookingEntity> myBookings;
  final int totalCabins;
  final int availableCabins;

  const StudentCabinDashboardData({
    required this.cabins,
    required this.cabinsByFloor,
    required this.floors,
    required this.pricing,
    this.isFirstBooking = false,
    this.isRegistrationWaived = false,
    this.isSecondHalf = false,
    this.monthEndDate,
    this.pendingCheckout,
    this.myBookings = const [],
    required this.totalCabins,
    required this.availableCabins,
  });

  factory StudentCabinDashboardData.fromJson(Map<String, dynamic> json) {
    final rawCabins = json['cabins'] as List<dynamic>? ?? [];
    final rawFloorsGroup = json['cabinsByFloor'] as List<dynamic>? ?? [];
    final rawFloors = json['floors'] as List<dynamic>? ?? [];
    final rawMyBookings = json['myBookings'] as List<dynamic>? ?? [];

    final isRegWaived = json['isRegistrationWaived'] as bool? ?? !(json['isFirstBooking'] as bool? ?? false);
    final monthEndStr = json['monthEndDate'] as String?;

    return StudentCabinDashboardData(
      cabins: rawCabins
          .map((c) => CabinEntity.fromJson(c as Map<String, dynamic>))
          .toList(),
      cabinsByFloor: rawFloorsGroup
          .map((f) => FloorGroupEntity.fromJson(f as Map<String, dynamic>))
          .toList(),
      floors: rawFloors.map((e) => (e as num).toInt()).toList(),
      pricing: json['pricing'] != null
          ? CabinPricingEntity.fromJson(json['pricing'] as Map<String, dynamic>)
          : const CabinPricingEntity(),
      isFirstBooking: json['isFirstBooking'] as bool? ?? !isRegWaived,
      isRegistrationWaived: isRegWaived,
      isSecondHalf: json['isSecondHalf'] as bool? ?? (DateTime.now().day > 15),
      monthEndDate: monthEndStr != null ? DateTime.tryParse(monthEndStr) : null,
      pendingCheckout: json['pendingCheckout'] != null
          ? PendingCheckoutEntity.fromJson(
              json['pendingCheckout'] as Map<String, dynamic>)
          : null,
      myBookings: rawMyBookings
          .map((b) => MyCabinBookingEntity.fromJson(b as Map<String, dynamic>))
          .toList(),
      totalCabins: json['totalCabins'] as int? ?? rawCabins.length,
      availableCabins: json['availableCabins'] as int? ?? 0,
    );
  }
}
