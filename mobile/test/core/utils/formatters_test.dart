import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/formatters.dart';

void main() {
  group('Formatters', () {
    test('formatDate handles null and valid dates', () {
      expect(Formatters.formatDate(null), equals('-'));
      final date = DateTime(2026, 8, 24);
      expect(Formatters.formatDate(date), equals('24 Aug 2026'));
    });

    test('formatTime handles null and valid dates', () {
      expect(Formatters.formatTime(null), equals('-'));
      final date = DateTime(2026, 8, 24, 15, 30);
      expect(Formatters.formatTime(date), equals('03:30 PM'));
    });

    test('formatDateTime handles null and valid dates', () {
      expect(Formatters.formatDateTime(null), equals('-'));
      final date = DateTime(2026, 8, 24, 15, 30);
      expect(Formatters.formatDateTime(date), equals('24 Aug 2026, 03:30 PM'));
    });

    test('formatShortDate handles null and valid dates', () {
      expect(Formatters.formatShortDate(null), equals('-'));
      final date = DateTime(2026, 8, 24);
      expect(Formatters.formatShortDate(date), equals('24/08/2026'));
    });

    test('formatCurrency handles null and valid amounts', () {
      expect(Formatters.formatCurrency(null), equals('₹0'));
      expect(Formatters.formatCurrency(1500), equals('₹1,500'));
      // Since decimalDigits is 0, it rounds the value
      expect(Formatters.formatCurrency(1500.50), equals('₹1,501'));
    });

    test('formatDurationMinutes formats correctly', () {
      expect(Formatters.formatDurationMinutes(45), equals('45m'));
      expect(Formatters.formatDurationMinutes(60), equals('1h'));
      expect(Formatters.formatDurationMinutes(150), equals('2h 30m'));
    });

    test('getGreeting returns correct greeting based on time of day', () {
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 5, 0)), equals('Good Morning'));
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 11, 59)), equals('Good Morning'));
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 12, 0)), equals('Good Afternoon'));
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 16, 59)), equals('Good Afternoon'));
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 17, 0)), equals('Good Evening'));
      expect(Formatters.getGreeting(DateTime(2026, 1, 1, 23, 59)), equals('Good Evening'));
    });
  });
}
