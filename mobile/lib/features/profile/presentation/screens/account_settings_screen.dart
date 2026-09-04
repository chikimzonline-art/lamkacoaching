import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/domain/user_entity.dart';
import '../../../dashboard/presentation/widgets/digital_id_pass_modal.dart';

/// Screen for viewing the student profile overview card, editing personal details,
/// and updating account security credentials.
class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  // Personal Info Form Controllers
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _addressController;

  // Security Form Controllers
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  bool _isSavingProfile = false;
  bool _isUpdatingPassword = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authNotifierProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _addressController = TextEditingController(text: user?.address ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSaveProfile() async {
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();

    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Phone number cannot be empty.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSavingProfile = true);

    final result = await ref.read(authNotifierProvider.notifier).updateProfile(
      phone: phone,
      email: email.isEmpty ? null : email,
      address: address.isEmpty ? null : address,
    );

    if (!mounted) return;
    setState(() => _isSavingProfile = false);

    result.fold(
      (failure) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(failure.message),
            backgroundColor: AppColors.error,
          ),
        );
      },
      (updatedUser) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      },
    );
  }

  Future<void> _handleChangePassword() async {
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (currentPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your current password.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (newPassword.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('New password must be at least 6 characters.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (newPassword != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('New passwords do not match.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isUpdatingPassword = true);

    final result = await ref.read(authNotifierProvider.notifier).changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );

    if (!mounted) return;
    setState(() => _isUpdatingPassword = false);

    result.fold(
      (failure) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(failure.message),
            backgroundColor: AppColors.error,
          ),
        );
      },
      (_) {
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Settings'),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ==========================================
            // 1. Profile Overview Card (Matching Web UI)
            // ==========================================
            _buildProfileOverviewCard(context, user, isDark),
            const SizedBox(height: 16),

            // ==========================================
            // 2. Digital Student ID Card Pass Action
            // ==========================================
            _buildDigitalIdCardBanner(context, user, isDark),
            const SizedBox(height: 20),

            // ==========================================
            // 3. Personal Information Form
            // ==========================================
            _buildPersonalInfoCard(context, isDark),
            const SizedBox(height: 20),

            // ==========================================
            // 4. Security & Password Update
            // ==========================================
            _buildSecurityCard(context, isDark),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  /// Profile Overview Card matching the website profile screenshot
  Widget _buildProfileOverviewCard(BuildContext context, UserEntity? user, bool isDark) {
    final theme = Theme.of(context);
    final initial = (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : 'S';

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        children: [
          // Circular Avatar with soft blue glow
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDark
                  ? const Color(0xFF0C4A6E).withValues(alpha: 0.5)
                  : const Color(0xFFE0F2FE),
              border: Border.all(
                color: isDark ? const Color(0xFF0284C7) : const Color(0xFFBAE6FD),
                width: 2,
              ),
            ),
            child: Center(
              child: Text(
                initial,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0284C7),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Student Name & Username
          Text(
            user?.name ?? 'Student',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            user?.username ?? 'student',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),

          const Divider(height: 1),
          const SizedBox(height: 16),

          // Contact details list matching website
          _buildInfoRow(
            icon: Icons.phone_outlined,
            text: user?.phone ?? 'Not provided',
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Icons.mail_outline_rounded,
            text: (user?.email?.isNotEmpty ?? false) ? user!.email! : 'Not provided',
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Icons.location_on_outlined,
            text: (user?.address?.isNotEmpty ?? false) ? user!.address! : 'Not provided',
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String text,
    required bool isDark,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ),
      ],
    );
  }

  /// Digital Student ID Card Banner
  Widget _buildDigitalIdCardBanner(BuildContext context, UserEntity? user, bool isDark) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: isDark ? AppColors.darkSurfaceElevated : const Color(0xFFF0FDF4),
            ),
            child: const Center(
              child: Text(
                '🪪',
                style: TextStyle(fontSize: 22),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Digital Student ID',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                Text(
                  'View official QR pass for attendance check-ins',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: user != null
                ? () => DigitalIdPassModal.show(context, user: user)
                : null,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              visualDensity: VisualDensity.compact,
            ),
            child: const Text('View Pass', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  /// Personal Information Card
  Widget _buildPersonalInfoCard(BuildContext context, bool isDark) {
    final theme = Theme.of(context);

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Personal Information',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 2),
          Text(
            'Update your contact details.',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 18),

          // Full Name (read-only)
          TextField(
            controller: _nameController,
            enabled: false,
            decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person_outline, size: 20),
              suffixIcon: Icon(Icons.lock_outline, size: 18),
              border: OutlineInputBorder(),
              helperText: 'Contact administration to change your name.',
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),

          // Phone Number (editable)
          TextField(
            controller: _phoneController,
            keyboardType: TextInputKeyboards.phone,
            decoration: const InputDecoration(
              labelText: 'Phone Number',
              hintText: 'e.g. 9876543210',
              prefixIcon: Icon(Icons.phone_outlined, size: 20),
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),

          // Email Address (editable)
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email Address',
              hintText: 'john@example.com',
              prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),

          // Home Address (editable)
          TextField(
            controller: _addressController,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Home Address',
              hintText: 'Main Road, Churachandpur',
              prefixIcon: Icon(Icons.location_on_outlined, size: 20),
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 20),

          // Save Changes Button
          AppButton(
            text: 'Save Changes',
            icon: const Icon(Icons.save_outlined, size: 18),
            isLoading: _isSavingProfile,
            onPressed: _handleSaveProfile,
          ),
        ],
      ),
    );
  }

  /// Security / Password Update Card
  Widget _buildSecurityCard(BuildContext context, bool isDark) {
    final theme = Theme.of(context);

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 20, color: AppColors.info),
              const SizedBox(width: 8),
              Text(
                'Security',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'Change your account password.',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 18),

          // Current Password
          TextField(
            controller: _currentPasswordController,
            obscureText: _obscureCurrent,
            decoration: InputDecoration(
              labelText: 'Current Password',
              prefixIcon: const Icon(Icons.lock_outline, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureCurrent ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
              ),
              border: const OutlineInputBorder(),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),

          // New Password
          TextField(
            controller: _newPasswordController,
            obscureText: _obscureNew,
            decoration: InputDecoration(
              labelText: 'New Password',
              prefixIcon: const Icon(Icons.key_outlined, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureNew ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
              ),
              border: const OutlineInputBorder(),
              helperText: 'Minimum 6 characters.',
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),

          // Confirm New Password
          TextField(
            controller: _confirmPasswordController,
            obscureText: _obscureConfirm,
            decoration: InputDecoration(
              labelText: 'Confirm New Password',
              prefixIcon: const Icon(Icons.key_outlined, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
              border: const OutlineInputBorder(),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 20),

          // Update Password Button
          AppButton(
            text: 'Update Password',
            variant: AppButtonVariant.outline,
            icon: const Icon(Icons.lock_reset_rounded, size: 18),
            isLoading: _isUpdatingPassword,
            onPressed: _handleChangePassword,
          ),
        ],
      ),
    );
  }
}

class TextInputKeyboards {
  static const TextInputType phone = TextInputType.phone;
}
