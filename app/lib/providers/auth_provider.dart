import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/service_locator.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = getIt<AuthService>();

  bool _isSignedIn = false;
  bool get isSignedIn => _isSignedIn;

  AuthProvider() {
    _initializeAuthState();
  }

  void _initializeAuthState() {
    _authService.userStream.listen((user) {
      _isSignedIn = user != null;
      notifyListeners();
    });
  }

  Future<void> signUpAnonymously() async {
    try {
      await _authService.signUpAnonymously();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _authService.signOut();
    } catch (e) {
      rethrow;
    }
  }
}
