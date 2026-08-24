import 'package:flutter/material.dart';

/// Semantic, high-contrast color tokens adhering strictly to the
/// 90/10 Visual Restraint Design System.
class AppColors {
  AppColors._();

  // ==========================================
  // DARK THEME (Obsidian & Minimal Teal)
  // ==========================================
  static const Color darkBackground = Color(0xFF0B0F19);
  static const Color darkSurface = Color(0xFF151C2E);
  static const Color darkSurfaceElevated = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF263047);
  static const Color darkBorderSubtle = Color(0xFF1E293B);

  static const Color darkAccentTeal = Color(0xFF0EA5E9);
  static const Color darkAccentTealHover = Color(0xFF38BDF8);
  static const Color darkAccentGlow = Color(0x330EA5E9);

  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextTertiary = Color(0xFF64748B);

  // ==========================================
  // LIGHT THEME (Apple Minimalist)
  // ==========================================
  static const Color lightBackground = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceElevated = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightBorderSubtle = Color(0xFFF1F5F9);

  static const Color lightAccentSky = Color(0xFF0284C7);
  static const Color lightAccentSkyHover = Color(0xFF0369A1);
  static const Color lightAccentGlow = Color(0x260284C7);

  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightTextTertiary = Color(0xFF94A3B8);

  // ==========================================
  // UNIVERSAL STATUS COLORS
  // ==========================================
  static const Color success = Color(0xFF10B981);
  static const Color successBg = Color(0x1A10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningBg = Color(0x1AF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color errorBg = Color(0x1AEF4444);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0x1A3B82F6);

  // ==========================================
  // ROLE ACCENTS
  // ==========================================
  static const Color roleAdmin = Color(0xFF8B5CF6);
  static const Color roleFaculty = Color(0xFFF59E0B);
  static const Color roleStudent = Color(0xFF0EA5E9);
}
