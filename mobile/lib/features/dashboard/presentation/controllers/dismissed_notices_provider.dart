import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider to track the IDs of global announcements (Notices)
/// that the user has dismissed from their dashboard during this session.
final dismissedNoticesProvider = StateProvider<Set<String>>((ref) => {});
