import 'package:get_it/get_it.dart';
import '../services/firestore_service.dart';
import '../services/location_service.dart';
import '../services/auth_service.dart';

final getIt = GetIt.instance;

void setupServiceLocator() {
  // Register services
  getIt.registerSingleton<AuthService>(AuthService());
  getIt.registerSingleton<LocationService>(LocationService());
  getIt.registerSingleton<FirestoreService>(FirestoreService());
}
