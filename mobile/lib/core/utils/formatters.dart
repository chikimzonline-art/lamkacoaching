import 'package:intl/intl.dart';

/// Formatting utilities for currency, dates, times, and strings.
class Formatters {
  Formatters._();

  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _timeFormat = DateFormat('hh:mm a');
  static final DateFormat _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');
  static final DateFormat _shortDateFormat = DateFormat('dd/MM/yyyy');
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  /// Format Date to "24 Aug 2026"
  static String formatDate(DateTime? date) {
    if (date == null) return '-';
    return _dateFormat.format(date);
  }

  /// Format Time to "03:30 PM"
  static String formatTime(DateTime? date) {
    if (date == null) return '-';
    return _timeFormat.format(date);
  }

  /// Format DateTime to "24 Aug 2026, 03:30 PM"
  static String formatDateTime(DateTime? date) {
    if (date == null) return '-';
    return _dateTimeFormat.format(date);
  }

  /// Format Date to "24/08/2026"
  static String formatShortDate(DateTime? date) {
    if (date == null) return '-';
    return _shortDateFormat.format(date);
  }

  /// Format Currency (e.g. ₹1,500)
  static String formatCurrency(num? amount) {
    if (amount == null) return '₹0';
    return _currencyFormat.format(amount);
  }

  /// Format duration in minutes into "2h 30m" or "45m"
  static String formatDurationMinutes(int totalMinutes) {
    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    }
    return '${minutes}m';
  }
}
