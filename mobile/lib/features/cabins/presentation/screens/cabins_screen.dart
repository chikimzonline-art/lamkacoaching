import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../controllers/booking_checkout_notifier.dart';
import '../controllers/cabins_notifier.dart';
import '../widgets/cabin_booking_bottom_sheet.dart';
import '../widgets/cabin_features_row.dart';
import '../widgets/cabin_list_item.dart';
import '../widgets/floor_filter_tabs.dart';
import '../widgets/my_cabins_tab.dart';
import '../widgets/pending_checkout_banner.dart';
import '../widgets/pricing_overview_grid.dart';
import '../widgets/booking_success_dialog.dart';

class CabinsScreen extends ConsumerStatefulWidget {
  final String? initialTab;

  const CabinsScreen({super.key, this.initialTab});

  @override
  ConsumerState<CabinsScreen> createState() => _CabinsScreenState();
}

class _CabinsScreenState extends ConsumerState<CabinsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    if (widget.initialTab == 'my-cabins' || widget.initialTab == 'my-desks') {
      _tabController.index = 1;
    }
  }

  @override
  void didUpdateWidget(covariant CabinsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialTab != oldWidget.initialTab &&
        (widget.initialTab == 'my-cabins' || widget.initialTab == 'my-desks')) {
      _tabController.animateTo(1);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cabinsNotifierProvider);
    final notifier = ref.read(cabinsNotifierProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B1120) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Study Cabins',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19),
        ),
        centerTitle: false,
        elevation: 0,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            height: 38,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: isDark ? const Color(0xFF059669) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: isDark
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: isDark ? Colors.white : const Color(0xFF0F172A),
              unselectedLabelColor: isDark ? Colors.white54 : const Color(0xFF64748B),
              labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              tabs: [
                const Tab(text: 'Explore & Book'),
                Tab(
                  text: (state.dashboardData.valueOrNull?.myBookings.isNotEmpty ?? false)
                      ? 'My Active Desks (${state.dashboardData.valueOrNull!.myBookings.length})'
                      : 'My Active Desks',
                ),
              ],
            ),
          ),
        ),
      ),
      body: state.dashboardData.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF059669)),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.alertCircle, size: 40, color: Color(0xFFDC2626)),
                const SizedBox(height: 12),
                Text(
                  'Failed to load study cabins',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  err.toString().replaceAll('Exception: ', ''),
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => notifier.loadCabins(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          final pending = data.pendingCheckout;

          return TabBarView(
            controller: _tabController,
            children: [
              // Tab 1: Explore & Book Cabins
              RefreshIndicator(
                color: const Color(0xFF059669),
                onRefresh: () => notifier.loadCabins(),
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  children: [
                    // Pending Checkout Alert Banner
                    if (pending != null)
                      PendingCheckoutBanner(
                        pendingCheckout: pending,
                        onCompletePayment: () {
                          final cabin = data.cabins.firstWhere(
                            (c) => c.id == pending.cabinId,
                            orElse: () => data.cabins.first,
                          );
                          ref
                              .read(bookingCheckoutNotifierProvider.notifier)
                              .selectCabin(cabin, data.pricing, data.isFirstBooking);

                          CabinBookingBottomSheet.show(
                            context,
                            cabin: cabin,
                            pricing: data.pricing,
                            isFirstBooking: data.isFirstBooking,
                            onBookingSuccess: () {
                              notifier.loadCabins();
                              BookingSuccessDialog.show(
                                context,
                                cabinNum: cabin.cabinNum,
                                floorLabel: cabin.floorLabel,
                                shiftName: pending.type,
                                onDismiss: () {
                                  _tabController.animateTo(1);
                                },
                              );
                            },
                          );
                        },
                        onCancel: () => notifier.cancelPendingCheckout(pending.id),
                      ),

                    // Header Subtitle & Available Count Pill
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Study Cabins Seat Matrix',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Book a personal study space with AC & Wi-Fi',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : const Color(0xFF64748B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Text(
                            '${data.availableCabins} Free',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF047857),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 2x2 Pricing Grid
                    PricingOverviewGrid(pricing: data.pricing),
                    const SizedBox(height: 10),

                    // Cabin Features Chips Row
                    const CabinFeaturesRow(),
                    const SizedBox(height: 14),

                    // Floor Selector Pills
                    FloorFilterTabs(
                      floorGroups: data.cabinsByFloor,
                      selectedFloor: state.selectedFloor,
                      onFloorSelected: (f) => notifier.selectFloor(f),
                    ),
                    const SizedBox(height: 10),

                    // Filter Status Row + Available Only Toggle Chip
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'SHOWING ${state.filteredCabins.length} CABINS',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilterChip(
                          avatar: Icon(
                            state.showAvailableOnly
                                ? Icons.check_circle_rounded
                                : Icons.filter_alt_outlined,
                            size: 14,
                            color: state.showAvailableOnly
                                ? Colors.white
                                : (isDark ? Colors.white70 : const Color(0xFF475569)),
                          ),
                          label: const Text('Available Only'),
                          selected: state.showAvailableOnly,
                          onSelected: (_) => notifier.toggleAvailableOnly(),
                          selectedColor: const Color(0xFF059669),
                          labelStyle: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: state.showAvailableOnly
                                ? Colors.white
                                : (isDark ? Colors.white70 : const Color(0xFF475569)),
                          ),
                          backgroundColor: isDark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF1F5F9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          side: BorderSide(
                            color: state.showAvailableOnly
                                ? Colors.transparent
                                : (isDark
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFE2E8F0)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Cabin List Items
                    ...state.filteredCabins.map((cabin) {
                      return CabinListItem(
                        cabin: cabin,
                        showFloorLabel: state.selectedFloor == null,
                        onSelect: () {
                          ref
                              .read(bookingCheckoutNotifierProvider.notifier)
                              .selectCabin(cabin, data.pricing, data.isFirstBooking);

                          CabinBookingBottomSheet.show(
                            context,
                            cabin: cabin,
                            pricing: data.pricing,
                            isFirstBooking: data.isFirstBooking,
                            onBookingSuccess: () {
                              notifier.loadCabins();
                              final checkout = ref.read(bookingCheckoutNotifierProvider);
                              BookingSuccessDialog.show(
                                context,
                                cabinNum: cabin.cabinNum,
                                floorLabel: cabin.floorLabel,
                                shiftName: checkout.selectedShift,
                                onDismiss: () {
                                  _tabController.animateTo(1);
                                },
                              );
                            },
                          );
                        },
                      );
                    }),
                    const SizedBox(height: 40),
                  ],
                ),
              ),

              // Tab 2: My Active Cabins
              RefreshIndicator(
                color: const Color(0xFF059669),
                onRefresh: () => notifier.loadCabins(),
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  children: [
                    MyCabinsTab(
                      bookings: data.myBookings,
                      onExploreTap: () => _tabController.animateTo(0),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
