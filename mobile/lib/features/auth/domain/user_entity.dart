/// System user roles matching the Next.js / SQLite backend schema.
enum UserRole {
  student,
  admin,
  staff;

  static UserRole fromString(String? role) {
    if (role == null) return UserRole.student;
    switch (role.trim().toLowerCase()) {
      case 'admin':
        return UserRole.admin;
      case 'staff':
      case 'faculty':
      case 'teacher':
        return UserRole.staff;
      case 'student':
      default:
        return UserRole.student;
    }
  }

  String toApiValue() => name;

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.staff:
        return 'Staff / Faculty';
      case UserRole.student:
        return 'Student';
    }
  }
}

/// Immutable domain entity representing an authenticated user in Lamka Coaching Center.
class UserEntity {
  final String id;
  final String name;
  final String? username;
  final String? phone;
  final UserRole role;
  final String? avatar;
  final String? email;
  final String? address;

  const UserEntity({
    required this.id,
    required this.name,
    this.username,
    this.phone,
    required this.role,
    this.avatar,
    this.email,
    this.address,
  });

  bool get isStudent => role == UserRole.student;
  bool get isAdmin => role == UserRole.admin;
  bool get isStaff => role == UserRole.staff;
  bool get isElevated => role == UserRole.admin || role == UserRole.staff;

  UserEntity copyWith({
    String? id,
    String? name,
    String? username,
    String? phone,
    UserRole? role,
    String? avatar,
    String? email,
    String? address,
  }) {
    return UserEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      avatar: avatar ?? this.avatar,
      email: email ?? this.email,
      address: address ?? this.address,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserEntity &&
          other.id == id &&
          other.name == name &&
          other.username == username &&
          other.phone == phone &&
          other.role == role &&
          other.avatar == avatar &&
          other.email == email &&
          other.address == address);

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      username.hashCode ^
      phone.hashCode ^
      role.hashCode ^
      avatar.hashCode ^
      email.hashCode ^
      address.hashCode;

  @override
  String toString() {
    return 'UserEntity(id: $id, name: $name, username: $username, role: ${role.name}, email: $email, phone: $phone, address: $address)';
  }
}
