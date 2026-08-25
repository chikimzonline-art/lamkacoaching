import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class CabinFeaturesRow extends StatelessWidget {
  const CabinFeaturesRow({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final features = [
      (icon: LucideIcons.wifi, text: 'High-speed Wi-Fi'),
      (icon: LucideIcons.airVent, text: 'Air Conditioned'),
      (icon: LucideIcons.zap, text: 'Power Socket'),
      (icon: LucideIcons.shieldCheck, text: 'CCTV Monitored'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Row(
          children: features.map((f) {
            return Padding(
              padding: const EdgeInsets.only(right: 14),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(f.icon, size: 14, color: const Color(0xFF059669)),
                  const SizedBox(width: 5),
                  Text(
                    f.text,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
