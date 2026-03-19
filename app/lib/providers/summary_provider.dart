import 'package:flutter/material.dart';
import '../models/summary.dart';
import '../services/firestore_service.dart';
import '../services/service_locator.dart';

class SummaryProvider extends ChangeNotifier {
  final FirestoreService _firestoreService = getIt<FirestoreService>();

  Summary? _currentSummary;
  Summary? get currentSummary => _currentSummary;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> fetchSummary({
    required double latitude,
    required double longitude,
    required double radiusMiles,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final summary = await _firestoreService.getSummary(
        latitude: latitude,
        longitude: longitude,
        radiusMiles: radiusMiles,
      );
      _currentSummary = summary;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
