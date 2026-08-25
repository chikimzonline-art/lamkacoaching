import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';
import '../../application/notification_service.dart';

class NotificationsHubScreen extends ConsumerStatefulWidget {
  const NotificationsHubScreen({super.key});

  @override
  ConsumerState<NotificationsHubScreen> createState() => _NotificationsHubScreenState();
}

class _NotificationsHubScreenState extends ConsumerState<NotificationsHubScreen> {
  @override
  void initState() {
    super.initState();
    // Initialize notification service when hub is opened
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationServiceProvider).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications Hub')),
      body: SafeArea(
        child: Padding(
          padding: AppDimensions.screenPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.roleAdmin.withValues(alpha: 0.15),
                            borderRadius: AppDimensions.borderRadiusSm,
                          ),
                          child: const Icon(
                            Icons.notifications_active_rounded,
                            color: AppColors.roleAdmin,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: AppDimensions.space12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Push Alerts Active',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'Device registered for Firebase Messaging',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.space24),
              Text(
                'Recent Alerts',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppDimensions.space12),
              Expanded(
                child: ListView.separated(
                  itemCount: 3, // Mock data for display
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final titles = ['Cabin booking confirmed', 'New Batch Announcement', 'Payment Successful'];
                    final bodies = [
                      'Your booking for Cabin #12 is confirmed.',
                      'Enrollment for the new Science batch is now open.',
                      'Your receipt for ₹1500 has been generated.',
                    ];
                    return AppCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            titles[index],
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            bodies[index],
                            style: theme.textTheme.bodySmall,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Today, 10:00 AM',
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: 10,
                              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
