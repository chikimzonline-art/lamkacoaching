import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';
import '../../application/notification_service.dart';
import '../controllers/notifications_controller.dart';

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

  Future<void> _onRefresh() async {
    await ref.read(notificationsControllerProvider.notifier).fetchNotifications(all: true);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final notificationsState = ref.watch(notificationsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications Hub'),
        actions: [
          if (notificationsState.hasValue && notificationsState.value!.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.checklist_rtl_rounded),
              tooltip: 'Mark all as read',
              onPressed: () {
                ref.read(notificationsControllerProvider.notifier).markAsRead([]);
              },
            ),
        ],
      ),
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
                        Expanded(
                          child: Column(
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
                child: RefreshIndicator(
                  onRefresh: _onRefresh,
                  child: notificationsState.when(
                    data: (notifications) {
                      if (notifications.isEmpty) {
                        return ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            const SizedBox(height: 48),
                            Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.notifications_off_outlined,
                                    size: 48,
                                    color: isDark
                                        ? AppColors.darkTextTertiary
                                        : AppColors.lightTextTertiary,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No recent notifications',
                                    style: theme.textTheme.titleMedium?.copyWith(
                                      color: isDark
                                          ? AppColors.darkTextSecondary
                                          : AppColors.lightTextSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      }

                      return ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: notifications.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final notification = notifications[index];
                          final isUnread = !notification.read;

                          return GestureDetector(
                            onTap: () {
                              if (isUnread) {
                                ref
                                    .read(notificationsControllerProvider.notifier)
                                    .markAsRead([notification.id]);
                              }
                              
                              if (notification.link != null && notification.link!.isNotEmpty) {
                                if (notification.link!.contains('notices')) {
                                  context.push(AppRoutes.notices);
                                } else if (notification.link!.contains('courses')) {
                                  context.push(AppRoutes.courses);
                                } else if (notification.link!.contains('cabins')) {
                                  context.push(AppRoutes.cabins);
                                } else if (notification.link!.contains('payment')) {
                                  context.push(AppRoutes.paymentHistory);
                                }
                              }
                            },
                            child: AppCard(
                              padding: const EdgeInsets.all(16),
                              backgroundColor: isUnread
                                  ? (isDark
                                      ? AppColors.darkAccentTeal.withValues(alpha: 0.1)
                                      : AppColors.lightAccentSky.withValues(alpha: 0.1))
                                  : null,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (isUnread) ...[
                                    Container(
                                      margin: const EdgeInsets.only(top: 6, right: 12),
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppColors.info,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ],
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          notification.title,
                                          style: theme.textTheme.titleSmall?.copyWith(
                                            fontWeight: isUnread
                                                ? FontWeight.w700
                                                : FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          notification.message,
                                          style: theme.textTheme.bodySmall,
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          DateFormat('MMM d, yyyy • h:mm a').format(notification.createdAt),
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            fontSize: 10,
                                            color: isDark
                                                ? AppColors.darkTextTertiary
                                                : AppColors.lightTextTertiary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        const SizedBox(height: 48),
                        Center(
                          child: Text(
                            'Failed to load notifications:\n$err',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
