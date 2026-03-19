# Pulse - Real-Time Local Event Intelligence

Pulse is a cross-platform mobile app that lets users submit short text reports about what's happening in their area. The app automatically collects reports within a user-defined radius and uses AI (Grok) to generate concise, real-time summaries of "what is happening right now" in that location.

## Features

### Core (Priority 1)
- **Report Submission**: Users tap a floating button to submit short (280 char max) text reports with optional photos and categories
- **Location Aware**: Automatic GPS location capture with manual override
- **AI Summaries**: Real-time AI-generated summaries of reports within user's radius (default 2 miles)
- **Confirmation**: Users see reports reflected in summaries within 60 seconds
- **Rate Limiting**: Max 5 reports per user per hour to prevent spam

### Map Explorer (Priority 2)
- Full-screen interactive map (Google Maps)
- Adjust radius with slider (0.5-10 miles)
- View summary for any location
- Current location button to jump back to user position

### Additional
- **My Reports**: View and manage user's own submissions
- **Dark/Light Mode**: Material 3 design with system-aware theming
- **Offline Queueing**: Reports queued and sent when back online
- **Anonymous**: No personal data stored, optional anonymous posting

## Tech Stack

- **Frontend**: Flutter (Dart) - Single codebase for Android & iOS
- **Backend**: Firebase (Firestore + Cloud Functions)
- **AI**: Grok API for natural-language summaries
- **Location**: Google Play Services (Android) / Core Location (iOS)
- **Maps**: Google Maps SDK (Android) / MapKit (iOS)
- **Auth**: Firebase Anonymous Authentication

## Project Structure

```
Pulse_4.1R/
├── backend/                  # Firebase Cloud Functions (TypeScript)
│   ├── src/index.ts         # Main functions
│   ├── package.json
│   └── tsconfig.json
├── app/                      # Flutter application
│   ├── lib/
│   │   ├── main.dart        # App entry
│   │   ├── screens/         # UI screens
│   │   ├── providers/       # State management
│   │   ├── services/        # Firebase & location services
│   │   ├── models/          # Data classes
│   │   └── widgets/         # Reusable widgets
│   ├── android/             # Android configuration
│   └── pubspec.yaml         # Dependencies
├── firebase.json            # Firebase config
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Geo indexes
├── SETUP.md                 # Setup instructions
├── ARCHITECTURE.md          # Design documentation
└── FIRESTORE_SCHEMA.md      # Database schema
```

## Quick Start

### Prerequisites
- Flutter SDK (latest stable)
- Firebase CLI
- Android Studio (for Android development)
- Google Cloud account (for Maps API)
- Grok API key (for summaries)

### Backend Setup
```bash
cd backend
npm install
firebase login
firebase deploy --only functions
# Set GROK_API_KEY environment variable in Firebase Console
```

### App Setup
```bash
cd app
flutter pub get
# Configure Firebase credentials in lib/firebase_options.dart
# Add google-services.json for Android
flutter run
```

See [SETUP.md](./SETUP.md) for detailed configuration steps.

## Data Flow

1. User submits report (text, location, optional photo)
2. Backend validates and saves to Firestore
3. Summary cache invalidated for nearby areas
4. User opens Home screen and sees AI-generated summary
5. Cloud Function queries nearby reports and calls Grok API
6. Summary cached for 1 hour to avoid redundant API calls

## Security

- **Public Data**: All reports are publicly readable
- **Private Users**: User rate-limiting info private to user
- **Anonymous Option**: Users can post without creating account
- **TTL**: Reports auto-delete after 24 hours
- **Validation**: Input validated on backend before storage

## Key Numbers

- **Max report length**: 280 characters
- **Max photo size**: 5 MB
- **Report TTL**: 24 hours
- **Summary cache**: 1 hour
- **Rate limit**: 5 reports/hour per user
- **Default radius**: 2 miles (0.5-10 configurable)
- **Min Android**: API 26 (Android 8.0)
- **Min iOS**: iOS 15

## Next Steps

- [x] Backend architecture (Firestore + Cloud Functions)
- [x] Flutter app structure & navigation
- [x] Report submission flow
- [ ] Connect Cloud Functions to app
- [ ] Google Maps integration
- [ ] Offline support
- [ ] Moderation system
- [ ] Push notifications (Phase 2)
- [ ] User profiles & history
- [ ] Analytics dashboard

## Contributing

See [SETUP.md](./SETUP.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) for development guidelines.

## License

MIT