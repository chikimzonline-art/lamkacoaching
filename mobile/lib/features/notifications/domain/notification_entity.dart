import 'package:flutter/foundation.dart';

/// Immutable domain entity representing a single push alert or notification.
@immutable
class NotificationEntity {
  final String id;
  final String studentId;
  final String title;
  final String message;
  final bool read;
  final String? link;
  final DateTime createdAt;

  const NotificationEntity({
    required this.id,
    required this.studentId,
    required this.title,
    required this.message,
    this.read = false,
    this.link,
    required this.createdAt,
  });

  factory NotificationEntity.fromJson(Map<String, dynamic> json) {
    return NotificationEntity(
      id: json['id'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      title: json['title'] as String? ?? 'Notification',
      message: json['message'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      link: json['link'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'studentId': studentId,
        'title': title,
        'message': message,
        'read': read,
        'link': link,
        'createdAt': createdAt.toIso8601String(),
      };

  NotificationEntity copyWith({
    String? id,
    String? studentId,
    String? title,
    String? message,
    bool? read,
    String? link,
    DateTime? createdAt,
  }) {
    return NotificationEntity(
      id: id ?? this.id,
      studentId: studentId ?? this.studentId,
      title: title ?? this.title,
      message: message ?? this.message,
      read: read ?? this.read,
      link: link ?? this.link,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
