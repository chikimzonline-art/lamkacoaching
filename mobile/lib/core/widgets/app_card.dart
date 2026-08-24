import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_dimensions.dart';
import '../utils/haptic_service.dart';

/// Container card adhering strictly to the 90/10 visual design rules.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderRadius;
  final bool hasGlow;

  const AppCard({
    super.key,
    required this.child,
    this.padding = AppDimensions.cardPadding,
    this.onTap,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius = AppDimensions.radiusMd,
    this.hasGlow = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final effectiveBgColor =
        backgroundColor ??
        (isDark ? AppColors.darkSurface : AppColors.lightSurface);

    final effectiveBorderColor =
        borderColor ?? (isDark ? AppColors.darkBorder : AppColors.lightBorder);

    final decoration = BoxDecoration(
      color: effectiveBgColor,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: effectiveBorderColor, width: 1.0),
      boxShadow: hasGlow
          ? [
              BoxShadow(
                color: isDark
                    ? AppColors.darkAccentGlow
                    : AppColors.lightAccentGlow,
                blurRadius: 16,
                spreadRadius: 2,
              ),
            ]
          : null,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticService.selectionClick();
            onTap!();
          },
          borderRadius: BorderRadius.circular(borderRadius),
          child: Ink(decoration: decoration, padding: padding, child: child),
        ),
      );
    }

    return Container(decoration: decoration, padding: padding, child: child);
  }
}
