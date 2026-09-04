import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/cabins_repository_impl.dart';
import '../../domain/cabin_entity.dart';
import '../../domain/cabins_repository.dart';
import '../../../payments/data/payments_repository.dart';
import '../../../payments/services/razorpay_service.dart';

enum CheckoutStatus {
  idle,
  reserving,
  creatingPaymentOrder,
  launchingRazorpay,
  success,
  error,
}

class BookingCheckoutState {
  final CabinEntity? selectedCabin;
  final String selectedShift; // 'reserved', 'morning_shift', 'day_shift', 'night_shift'
  final DateTime startDate;
  final CheckoutStatus status;
  final String? errorMessage;
  final String? createdBookingId;
  final String? paymentId;
  final int totalAmountInPaise;

  const BookingCheckoutState({
    this.selectedCabin,
    this.selectedShift = 'reserved',
    required this.startDate,
    this.status = CheckoutStatus.idle,
    this.errorMessage,
    this.createdBookingId,
    this.paymentId,
    this.totalAmountInPaise = 0,
  });

  bool get isProcessing =>
      status == CheckoutStatus.reserving ||
      status == CheckoutStatus.creatingPaymentOrder ||
      status == CheckoutStatus.launchingRazorpay;

  BookingCheckoutState copyWith({
    CabinEntity? selectedCabin,
    String? selectedShift,
    DateTime? startDate,
    CheckoutStatus? status,
    String? errorMessage,
    String? createdBookingId,
    String? paymentId,
    int? totalAmountInPaise,
    bool clearError = false,
  }) {
    return BookingCheckoutState(
      selectedCabin: selectedCabin ?? this.selectedCabin,
      selectedShift: selectedShift ?? this.selectedShift,
      startDate: startDate ?? this.startDate,
      status: status ?? this.status,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      createdBookingId: createdBookingId ?? this.createdBookingId,
      paymentId: paymentId ?? this.paymentId,
      totalAmountInPaise: totalAmountInPaise ?? this.totalAmountInPaise,
    );
  }
}

final bookingCheckoutNotifierProvider = StateNotifierProvider.autoDispose<
    BookingCheckoutNotifier, BookingCheckoutState>((ref) {
  final cabinsRepo = ref.watch(cabinsRepositoryProvider);
  final paymentsRepo = ref.watch(paymentsRepositoryProvider);
  final razorpayService = ref.watch(razorpayServiceProvider);

  return BookingCheckoutNotifier(
    cabinsRepository: cabinsRepo,
    paymentsRepository: paymentsRepo,
    razorpayService: razorpayService,
  );
});

class BookingCheckoutNotifier extends StateNotifier<BookingCheckoutState> {
  final CabinsRepository cabinsRepository;
  final PaymentsRepository paymentsRepository;
  final RazorpayService razorpayService;

  BookingCheckoutNotifier({
    required this.cabinsRepository,
    required this.paymentsRepository,
    required this.razorpayService,
  }) : super(BookingCheckoutState(startDate: DateTime.now()));

  void selectCabin(CabinEntity cabin, CabinPricingEntity pricing, bool isFirstBooking) {
    // Default to first available shift
    String shift = 'reserved';
    if (cabin.isShiftBooked('reserved')) {
      if (!cabin.isShiftBooked('morning_shift')) {
        shift = 'morning_shift';
      } else if (!cabin.isShiftBooked('day_shift')) {
        shift = 'day_shift';
      } else if (!cabin.isShiftBooked('night_shift')) {
        shift = 'night_shift';
      }
    }

    final totalPaise = _calculateTotalPaise(shift, pricing, isFirstBooking, state.startDate);

    state = state.copyWith(
      selectedCabin: cabin,
      selectedShift: shift,
      totalAmountInPaise: totalPaise,
      clearError: true,
      status: CheckoutStatus.idle,
    );
  }

  void selectShift(String shift, CabinPricingEntity pricing, bool isFirstBooking) {
    final totalPaise = _calculateTotalPaise(shift, pricing, isFirstBooking, state.startDate);
    state = state.copyWith(
      selectedShift: shift,
      totalAmountInPaise: totalPaise,
      clearError: true,
    );
  }

  void setStartDate(DateTime date, CabinPricingEntity pricing, bool isFirstBooking) {
    final totalPaise = _calculateTotalPaise(state.selectedShift, pricing, isFirstBooking, date);
    state = state.copyWith(
      startDate: date,
      totalAmountInPaise: totalPaise,
    );
  }

  int _calculateTotalPaise(String shift, CabinPricingEntity pricing, bool isFirstBooking, DateTime date) {
    int baseFee = pricing.rateForShift(shift);
    // After 15th of the month: 50% desk fee
    int deskFee = (date.day > 15) ? (baseFee ~/ 2) : baseFee;
    if (isFirstBooking) {
      deskFee += pricing.registrationFee;
    }
    return deskFee; // already in paise
  }

  /// Complete Checkout Pipeline:
  /// 1. Reserve temporary booking (10-min hold)
  /// 2. Generate Razorpay Order ID from backend
  /// 3. Open Razorpay Checkout (Native / Desktop Mock)
  /// 4. Discard draft on failure or return success
  Future<bool> proceedToPayment({
    required String studentId,
    required String studentName,
    required String studentPhone,
    String? studentEmail,
  }) async {
    final cabin = state.selectedCabin;
    if (cabin == null) return false;

    String? createdBookingId;
    state = state.copyWith(status: CheckoutStatus.reserving, clearError: true);

    try {
      // Step 1: Create pending booking record
      final dateStr = state.startDate.toIso8601String().split('T')[0];
      final res = await cabinsRepository.reserveCabin(
        cabinId: cabin.id,
        bookingType: state.selectedShift,
        startDate: dateStr,
      );

      createdBookingId = res.bookingId;
      state = state.copyWith(
        createdBookingId: createdBookingId,
        totalAmountInPaise: res.totalAmount,
        status: CheckoutStatus.creatingPaymentOrder,
      );

      // Step 2: Create Razorpay Order from Next.js server
      final order = await paymentsRepository.createOrder(
        amountInPaise: res.totalAmount > 0 ? res.totalAmount : state.totalAmountInPaise,
        type: 'cabin',
        itemId: cabin.id,
        studentId: studentId,
        bookingId: createdBookingId,
      );

      state = state.copyWith(status: CheckoutStatus.launchingRazorpay);

      // Step 3: Launch Razorpay SDK / Windows Mock
      final paymentResult = await razorpayService.openCheckout(
        orderId: order.orderId,
        amountInPaise: order.amount,
        name: 'Lamka Coaching Center',
        description: 'Booking for Cabin ${cabin.cabinNum} (${state.selectedShift.replaceAll('_', ' ')})',
        notes: {
          'studentId': studentId,
          'type': 'cabin',
          'itemId': cabin.id,
          'bookingId': createdBookingId,
        },
        customerName: studentName,
        customerPhone: studentPhone,
        customerEmail: studentEmail,
        keyId: order.keyId,
      );

      state = state.copyWith(
        status: CheckoutStatus.success,
        paymentId: paymentResult.paymentId,
      );

      return true;
    } catch (e) {
      debugPrint('[BookingCheckout] Checkout pipeline error: $e');

      // Cleanup 10-minute hold if payment cancelled or failed
      if (createdBookingId != null) {
        try {
          await cabinsRepository.cancelPendingBooking(createdBookingId);
        } catch (cleanupErr) {
          debugPrint('[BookingCheckout] Failed to auto-cancel pending reservation: $cleanupErr');
        }
      }

      state = state.copyWith(
        status: CheckoutStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );

      return false;
    }
  }

  void reset() {
    state = BookingCheckoutState(startDate: DateTime.now());
  }
}
