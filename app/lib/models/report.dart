import 'package:cloud_firestore/cloud_firestore.dart';

class Report {
  final String id;
  final String userId;
  final String text;
  final String category;
  final GeoPoint location;
  final String? photoUrl;
  final DateTime timestamp;
  final String status;

  Report({
    required this.id,
    required this.userId,
    required this.text,
    required this.category,
    required this.location,
    this.photoUrl,
    required this.timestamp,
    required this.status,
  });

  factory Report.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Report(
      id: doc.id,
      userId: data['userId'] ?? '',
      text: data['text'] ?? '',
      category: data['category'] ?? 'Other',
      location: data['location'] ?? const GeoPoint(0, 0),
      photoUrl: data['photoUrl'],
      timestamp: (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
      status: data['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'text': text,
      'category': category,
      'location': location,
      'photoUrl': photoUrl,
      'timestamp': timestamp,
      'status': status,
    };
  }
}
