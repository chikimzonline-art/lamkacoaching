import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_dimensions.dart';
import '../utils/haptic_service.dart';

enum AppButtonVariant { primary, secondary, outline, danger, ghost }

enum AppButtonSize { small, medium, large }

/// Unified, high-contrast button adhering to 90/10 visual restraint.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final Widget? icon;
  final bool fullWidth;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.icon,
    this.fullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final double height = switch (size) {
      AppButtonSize.small => AppDimensions.buttonHeightSm,
      AppButtonSize.medium => AppDimensions.buttonHeightMd,
      AppButtonSize.large => AppDimensions.buttonHeightLg,
    };

    final double fontSize = switch (size) {
      AppButtonSize.small => 13.0,
      AppButtonSize.medium => 14.0,
      AppButtonSize.large => 16.0,
    };

    // Determine colors based on variant
    Color backgroundColor;
    Color foregroundColor;
    BorderSide? borderSide;

    switch (variant) {
      case AppButtonVariant.primary:
        backgroundColor = isDark
            ? AppColors.darkAccentTeal
            : AppColors.lightAccentSky;
        foregroundColor = Colors.white;
        borderSide = BorderSide.none;
        break;

      case AppButtonVariant.secondary:
        backgroundColor = isDark
            ? AppColors.darkSurfaceElevated
            : AppColors.lightSurfaceElevated;
        foregroundColor = isDark
            ? AppColors.darkTextPrimary
            : AppColors.lightTextPrimary;
        borderSide = BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1.0,
        );
        break;

      case AppButtonVariant.outline:
        backgroundColor = Colors.transparent;
        foregroundColor = isDark
            ? AppColors.darkTextPrimary
            : AppColors.lightTextPrimary;
        borderSide = BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1.0,
        );
        break;

      case AppButtonVariant.danger:
        backgroundColor = AppColors.error;
        foregroundColor = Colors.white;
        borderSide = BorderSide.none;
        break;

      case AppButtonVariant.ghost:
        backgroundColor = Colors.transparent;
        foregroundColor = isDark
            ? AppColors.darkAccentTeal
            : AppColors.lightAccentSky;
        borderSide = BorderSide.none;
        break;
    }

    final VoidCallback? effectiveOnPressed = isLoading || onPressed == null
        ? null
        : () {
            HapticService.lightImpact();
            onPressed!();
          };

    Widget buttonContent = isLoading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: AppDimensions.space8),
              ],
              Text(
                text,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w600,
                  color: effectiveOnPressed == null
                      ? foregroundColor.withValues(alpha: 0.5)
                      : foregroundColor,
                ),
              ),
            ],
          );

    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      disabledBackgroundColor: backgroundColor.withValues(alpha: 0.4),
      disabledForegroundColor: foregroundColor.withValues(alpha: 0.4),
      elevation: 0,
      side: borderSide,
      shape: const RoundedRectangleBorder(
        borderRadius: AppDimensions.borderRadiusMd,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
    );

    final button = SizedBox(
      height: height,
      child: ElevatedButton(
        style: buttonStyle,
        onPressed: effectiveOnPressed,
        child: buttonContent,
      ),
    );

    if (fullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }

    return button;
  }
}
