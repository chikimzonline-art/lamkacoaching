/// Value object encapsulating authentication session token, CSRF token, and expiry metadata.
class AuthToken {
  final String sessionToken;
  final String? csrfToken;
  final DateTime? expiresAt;

  const AuthToken({
    required this.sessionToken,
    this.csrfToken,
    this.expiresAt,
  });

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AuthToken &&
          other.sessionToken == sessionToken &&
          other.csrfToken == csrfToken &&
          other.expiresAt == expiresAt);

  @override
  int get hashCode =>
      sessionToken.hashCode ^ csrfToken.hashCode ^ expiresAt.hashCode;

  @override
  String toString() =>
      'AuthToken(sessionToken: ${sessionToken.substring(0, sessionToken.length > 8 ? 8 : sessionToken.length)}..., expiresAt: $expiresAt)';
}
