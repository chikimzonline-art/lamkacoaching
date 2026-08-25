import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/cabin_entity.dart';

class PricingOverviewGrid extends StatelessWidget {
  final CabinPricingEntity pricing;

  const PricingOverviewGrid({super.key, required this.pricing});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _PriceCard(
                icon: LucideIcons.calendarDays,
                iconColor: const Color(0xFF059669),
                bgColor: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5),
                borderColor: isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0),
                title: 'Reserved',
                price: '₹${pricing.reservedRate}',
                subtitle: '24/7 access',
                highlightPriceColor: const Color(0xFF047857),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _PriceCard(
                icon: LucideIcons.clock,
                iconColor: const Color(0xFF10B981),
                bgColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                title: 'Morning Shift',
                price: '₹${pricing.morningShiftRate}',
                subtitle: '5am - 10am',
                highlightPriceColor: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _PriceCard(
                icon: LucideIcons.clock,
                iconColor: const Color(0xFF10B981),
                bgColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                title: 'Day Shift',
                price: '₹${pricing.dayShiftRate}',
                subtitle: '10am - 5pm',
                highlightPriceColor: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _PriceCard(
                icon: LucideIcons.clock,
                iconColor: const Color(0xFF10B981),
                bgColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                title: 'Night Shift',
                price: '₹${pricing.nightShiftRate}',
                subtitle: '5pm - 12am',
                highlightPriceColor: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PriceCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final Color borderColor;
  final String title;
  final String price;
  final String subtitle;
  final Color highlightPriceColor;

  const _PriceCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.borderColor,
    required this.title,
    required this.price,
    required this.subtitle,
    required this.highlightPriceColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: iconColor),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : const Color(0xFF0F172A),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: price,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: highlightPriceColor,
                  ),
                ),
                TextSpan(
                  text: '/mo',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.normal,
                    color: isDark ? Colors.white54 : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 10,
              color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
