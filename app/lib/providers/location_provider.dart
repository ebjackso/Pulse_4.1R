import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';
import '../services/service_locator.dart';

class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = getIt<LocationService>();

  Position? _currentPosition;
  Position? get currentPosition => _currentPosition;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> updateCurrentLocation() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final position = await _locationService.getCurrentLocation();
      _currentPosition = position;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> requestLocationPermission() async {
    try {
      final status = await _locationService.requestLocationPermission();
      return status.isGranted;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
