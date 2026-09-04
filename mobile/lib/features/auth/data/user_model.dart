import '../domain/user_entity.dart';

/// Data transfer object (DTO) representing Next.js user payloads.
class UserModel {
  final String id;
  final String name;
  final String? username;
  final String? phone;
  final String role;
  final String? avatar;
  final String? email;
  final String? address;

  const UserModel({
    required this.id,
    required this.name,
    this.username,
    this.phone,
    required this.role,
    this.avatar,
    this.email,
    this.address,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['username']?.toString() ?? 'User',
      username: json['username']?.toString(),
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'student',
      avatar: json['avatar']?.toString() ?? json['image']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'email': email,
      'address': address,
    };
  }

  UserEntity toEntity() {
    return UserEntity(
      id: id,
      name: name,
      username: username,
      phone: phone,
      role: UserRole.fromString(role),
      avatar: avatar,
      email: email,
      address: address,
    );
  }

  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      id: entity.id,
      name: entity.name,
      username: entity.username,
      phone: entity.phone,
      role: entity.role.toApiValue(),
      avatar: entity.avatar,
      email: entity.email,
      address: entity.address,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserModel &&
          other.id == id &&
          other.name == name &&
          other.username == username &&
          other.phone == phone &&
          other.role == role &&
          other.avatar == avatar &&
          other.email == email);

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      username.hashCode ^
      phone.hashCode ^
      role.hashCode ^
      avatar.hashCode ^
      email.hashCode;
}
