/// Functional Either<L, R> type representing either a failure [Left] or a success [Right].
sealed class Either<L, R> {
  const Either();

  /// Returns true if this instance represents a [Left] (Failure).
  bool get isLeft => this is Left<L, R>;

  /// Returns true if this instance represents a [Right] (Success).
  bool get isRight => this is Right<L, R>;

  /// Returns the Left value if present, otherwise null.
  L? get leftOrNull => fold((left) => left, (_) => null);

  /// Returns the Right value if present, otherwise null.
  R? get rightOrNull => fold((_) => null, (right) => right);

  /// Applies [onLeft] if this is [Left], or [onRight] if this is [Right].
  T fold<T>(T Function(L left) onLeft, T Function(R right) onRight);
}

/// Represents the failure (Left) side of an [Either].
class Left<L, R> extends Either<L, R> {
  final L value;

  const Left(this.value);

  @override
  T fold<T>(T Function(L left) onLeft, T Function(R right) onRight) {
    return onLeft(value);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Left<L, R> && other.value == value);

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Left($value)';
}

/// Represents the success (Right) side of an [Either].
class Right<L, R> extends Either<L, R> {
  final R value;

  const Right(this.value);

  @override
  T fold<T>(T Function(L left) onLeft, T Function(R right) onRight) {
    return onRight(value);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Right<L, R> && other.value == value);

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'Right($value)';
}
