# Pulse Architecture

## High-Level Overview

Pulse is a real-time local event platform with three main components:

1. **Flutter Mobile App** (cross-platform: Android/iOS)
2. **Firebase Backend** (Firestore + Cloud Functions)
3. **AI Service Integration** (Grok API)

---

## Data Flow

### Report Submission Flow

```
User writes report in app
    ↓
Forms submission (text, category, location, optional photo)
    ↓
Upload to Firebase (Firestore + Cloud Storage)
    ↓
Rate limiting checked on backend
    ↓
Summary cache invalidated for nearby locations
    ↓
User sees confirmation ("Report sent, appears in 60 seconds")
```

### Summary Generation Flow

```
User opens Home screen / pulls to refresh
    ↓
App requests summary for current location + 2mi radius
    ↓
Cloud Function `getSummary()` called
    ↓
Check cache for recent summary
    ↓
If cached & fresh (< 1 hour old):
    Return cached summary
    ↓
If cache miss or expired:
    Query Firestore for reports in radius
    ↓
Filter reports by distance (Haversine formula)
    ↓
Group reports by category
    ↓
Call Grok API with grouped reports
    ↓
Grok returns natural-language summary
    ↓
Cache summary with 1-hour TTL
    ↓
Return to app
```

---

## Database Schema

### Collections

#### `reports` (public read)
```
{
  userId: string,                    // From Firebase Auth
  text: string (max 280 chars),      // Report content
  category: string,                  // Traffic, Safety, Event, Weather, Other
  location: GeoPoint,                // Lat/Long coordinates
  photoUrl: string | null,           // Cloud Storage URL
  timestamp: Timestamp,              // When submitted
  expiresAt: Timestamp,              // Auto-deletes after 24h
  status: string,                    // "active", "flagged_spam", etc.
}
```

#### `users` (private read/write)
```
{
  userId: string (doc ID),           // From Firebase Auth
  createdAt: Timestamp,
  lastReportTime: Timestamp | null,
  reportsThisHour: number,           // For rate limiting
  reportCount: number,               // Total lifetime reports
  anonymousOptIn: boolean,           // User preference
}
```

#### `summaries` (public read, backend write only)
```
{
  center: GeoPoint,
  radiusMiles: number,
  summary: string,                   // AI-generated summary
  reportCount: number,               // # of reports included
  createdAt: Timestamp,
  expiresAt: Timestamp,              // 1-hour TTL
}
```

### Cloud Storage
```
reports/{userId}/{timestamp}.jpg     // Report photos
```

---

## Cloud Functions

### `submitReport()`
- **Trigger**: Callable function
- **Process**:
  1. Validate input (text length, location validity, category)
  2. Check user rate limit (5 reports/hour)
  3. Upload photo to Cloud Storage if provided
  4. Save report to Firestore
  5. Invalidate nearby summary caches
  6. Return confirmation with report ID

### `getSummary()`
- **Trigger**: Callable function
- **Process**:
  1. Check cache for recent summary (same location & radius)
  2. If cache hit and fresh (< 1 hour), return cached
  3. Query reportsby radius using geo index
  4. Call Grok API with formatted prompt
  5. Cache result with 1-hour TTL
  6. Return summary to client

### `createUserProfile()`
- **Trigger**: Firebase Auth (on user creation)
- **Process**:
  - Create initial user document with default values

### `cleanupExpiredReports()`
- **Trigger**: Pub/Sub schedule (daily at 2 AM)
- **Process**:
  - Delete reports where `expiresAt < now`
  - Deletes associated Cloud Storage files

---

## Security Model

### Authentication
- Anonymous sign-in via Firebase Auth
- No password required (optional auth upgrade)
- Users identified by UID, can delete their own reports

### Firestore Rules
- **reports**: Public read, authenticated write (validated on backend)
- **users**: Private (users can only read/write their own)
- **summaries**: Public read, backend-only write

### Rate Limiting
- 5 reports per user per hour
- Enforced in `submitReport()` Cloud Function
- Tracked per user in `users` collection

### Privacy
- All reports are public
- Users post with their UID (can choose anonymous in UI)
- No personal data stored beyond location + report text
- 24-hour auto-deletion of reports

---

## Caching Strategy

### Summary Cache
- **Key**: `{latitude}_{longitude}_{radiusMiles}_{hour}`
- **TTL**: 1 hour
- **Invalidation**: When new report submitted within 5 miles
- **Purpose**: Prevent redundant Grok API calls

### Example:
```
32.7767_-96.7970_2_202403191500  // Dallas, 2mi, 3 PM hour
32.7767_-96.7970_2_202403191600  // Resets at 4 PM hour
```

---

## Geolocation

### Client-Side
- Use Geolocator package for location access
- Automatic background updates with 100m threshold
- User can manually override location in report form

### Server-Side
- Firestore GeoPoint indexes for fast proximity queries
- Haversine formula for distance calculation
- Bounding box filtering (degree-based) for efficiency

### Accuracy
- Use `LocationAccuracy.best` (typically ±5-15 meters)
- Report location fixed at submission time

---

## Scalability Considerations

### Firestore
- **Geo Index**: Automatically manages geohashing for location queries
- **Sharding**: For rate limiting, could add randomized shards to `users` if QPS exceeds limits
- **Deletion**: TTL fields with scheduled cleanup prevent unbounded growth

### Cloud Functions
- Auto-scaling based on concurrent invocations
- Grok API calls cached to reduce external API load
- Timeout: 60 seconds per function execution

### Cloud Storage
- Automatic CDN caching imported through gsutil
- Images sized down (1200x1200, 85% quality) to reduce storage

---

## Monitoring & Observling

### Key Metrics
1. **Report submission success rate**: Monitor `submitReport()` errors
2. **Summary generation latency**: Time from query to Grok response
3. **Firestore usage**: Quota tracking for reads/writes
4. **Grok API cost**: Track API calls and cache hit rate

### Logs
- Cloud Functions logs available in Firebase Console
- Enable verbose logging in app for local debugging

---

## Future Enhancements

1. **Moderation**:
   - Keyword filtering for offensive content
   - User reporting mechanism
   - Admin dashboard for escalation

2. **Push Notifications**:
   - Send alerts when summary changes significantly
   - Opt-in per user

3. **User Profiles**:
   - Account creation with email
   - Report history aggregation
   - Preferred categories/neighborhoods

4. **Analytics**:
   - Heat maps of activity
   - Trending categories
   - User engagement metrics

5. **Hybrid Caching**:
   - Client-side local report queue for offline mode
   - Sync when back online
