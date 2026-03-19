# Pulse Project Setup Guide

## Backend Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: "Pulse"
3. Enable Firestore Database
4. Enable Firebase Authentication (enable Anonymous sign-in)
5. Enable Cloud Storage
6. Create a Grok API account and get your API key

### 2. Deploy Cloud Functions

```bash
cd backend
npm install
firebase login
firebase deploy --only functions
```

### 3. Configure Environment Variables

In Firebase Console, set the following environment variable for Cloud Functions:
- `GROK_API_KEY`: Your Grok API key

### 4. Firestore Security Rules

The `firestore.rules` file has been created. Deploy it with:
```bash
firebase deploy --only firestore:rules
```

### 5. Firestore Indexes

The `firestore.indexes.json` file contains required indexes. They will be automatically created when needed.

---

## Android Setup (Flutter)

### 1. Prerequisites

- Flutter SDK (latest stable)
- Android Studio
- JDK 11+
- Minimum API level: 26 (Android 8.0)

### 2. Create Flutter Project from Template

```bash
cd app
flutter pub get
```

### 3. Configure Firebase for Android

1. In Firebase Console:
   - Add Android app
   - Package name: `com.example.pulse` (change as needed)
   - Generate SHA-1 certificate (Android Studio → Build → Analyze APK)
   - Download `google-services.json`

2. Place `google-services.json` in `app/android/app/`

3. Update `app/lib/firebase_options.dart` with your Firebase project credentials

### 4. Configure Permissions

Edit `app/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.pulse">

    <!-- Location permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Camera for photo reports -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Storage for image picking -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    ...
</manifest>
```

### 5. Google Maps Configuration

1. Get a Google Maps API key:
   - Go to Google Cloud Console
   - Enable Maps SDK for Android
   - Create an API key

2. Add to `app/android/app/src/main/AndroidManifest.xml`:

```xml
<application ...>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_MAPS_API_KEY"/>
</application>
```

### 6. Run the App

```bash
cd app
flutter run
```

---

## Project Structure

```
Pulse_4.1R/
├── backend/                    # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts           # Main cloud functions
│   ├── package.json
│   └── tsconfig.json
├── app/                        # Flutter app
│   ├── lib/
│   │   ├── main.dart          # App entry point
│   │   ├── screens/           # UI Screens
│   │   ├── providers/         # State management
│   │   ├── services/          # Firebase & location services
│   │   ├── models/            # Data models
│   │   └── widgets/           # UI widgets
│   ├── android/               # Android native code
│   └── pubspec.yaml
├── firebase.json
├── firestore.rules
└── FIRESTORE_SCHEMA.md
```

---

## Key Features Implemented

### ✅ Backend
- Report submission with validation & rate limiting (5 reports/hour)
- Firestore schema for reports, users, summaries
- Photo upload to Cloud Storage
- AI summary generation with Grok
- 24-hour auto-cleanup of expired reports
- Geo-distance querying
- Summary caching (1-hour TTL)

### ✅ Flutter App
- Anonymous authentication
- Location tracking & permissions
- Home screen with live summaries
- Report submission dialog
- My Reports list
- Map Explorer (scaffolding)
- Settings screen
- Bottom navigation
- Material 3 design with dark mode support

---

## Next Steps

1. **Connect Cloud Functions** - Update `SummaryProvider.getSummary()` to call the actual Cloud Function
2. **Implement Google Maps** - Add map view to Map Explorer screen
3. **Add offline support** - Implement local report queueing
4. **Moderation** - Add keyword filtering and user reporting
5. **Push notifications** - Notify users of new summaries
6. **Testing** - Unit and integration tests

---

## Rate Limiting

- Max 5 reports per user per hour
- Enforced on backend via `users` collection
- Resets hourly

## Data Privacy

- All reports are public
- Users can post anonymously
- Only user ID stored (no personal info)
- Reports auto-delete after 24 hours
