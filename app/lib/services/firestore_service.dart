import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/report.dart';
import '../models/summary.dart';
import 'service_locator.dart';
import 'auth_service.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Submit a new report
  Future<String> submitReport({
    required String text,
    required String category,
    required double latitude,
    required double longitude,
    String? photoBase64,
  }) async {
    final authService = getIt<AuthService>();
    final userId = authService.currentUser?.uid;

    if (userId == null) {
      throw Exception('User not authenticated');
    }

    try {
      final docRef = await _firestore.collection('reports').add({
        'userId': userId,
        'text': text,
        'category': category,
        'location': GeoPoint(latitude, longitude),
        'photoUrl': null,
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'active',
      });

      // Upload photo if provided
      if (photoBase64 != null && photoBase64.isNotEmpty) {
        try {
          final storageRef = _storage
              .ref()
              .child('reports')
              .child(userId)
              .child('${DateTime.now().millisecondsSinceEpoch}.jpg');

          final bytes = base64Decode(photoBase64);
          await storageRef.putData(bytes);
          final photoUrl = await storageRef.getDownloadURL();

          // Update report with photo URL
          await docRef.update({'photoUrl': photoUrl});
        } catch (e) {
          print('Photo upload failed: $e');
          // Continue without photo
        }
      }

      return docRef.id;
    } catch (e) {
      throw Exception('Failed to submit report: $e');
    }
  }

  /// Get AI-powered summary for a location
  Future<Summary> getSummary({
    required double latitude,
    required double longitude,
    required double radiusMiles,
  }) async {
    try {
      final response = await _firestore
          .collection('summaries')
          .doc()
          .get(); // This will be called via Cloud Function

      // For now, return a placeholder
      // In production, call Cloud Function via callable
      return Summary(
        text: 'Summary will appear here',
        reportCount: 0,
        cached: false,
        generatedAt: DateTime.now(),
      );
    } catch (e) {
      throw Exception('Failed to get summary: $e');
    }
  }

  /// Get user's own reports
  Future<List<Report>> getUserReports() async {
    final authService = getIt<AuthService>();
    final userId = authService.currentUser?.uid;

    if (userId == null) {
      throw Exception('User not authenticated');
    }

    try {
      final snapshot = await _firestore
          .collection('reports')
          .where('userId', isEqualTo: userId)
          .orderBy('timestamp', descending: true)
          .limit(50)
          .get();

      return snapshot.docs
          .map((doc) => Report.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch reports: $e');
    }
  }

  /// Delete a report
  Future<void> deleteReport(String reportId) async {
    final authService = getIt<AuthService>();
    final userId = authService.currentUser?.uid;

    if (userId == null) {
      throw Exception('User not authenticated');
    }

    try {
      await _firestore.collection('reports').doc(reportId).delete();
    } catch (e) {
      throw Exception('Failed to delete report: $e');
    }
  }

  /// Listen to nearby reports in real-time
  Stream<List<Report>> getNearbyReportsStream({
    required double latitude,
    required double longitude,
    required double radiusMiles,
  }) {
    // For now, return a stream of all recent reports
    // In production, implement client-side geo filtering
    return _firestore
        .collection('reports')
        .where('status', isEqualTo: 'active')
        .orderBy('timestamp', descending: true)
        .limit(100)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Report.fromFirestore(doc))
              .toList(),
        );
  }
}

// Add this import at top
import 'dart:convert';
