# Pulse Firestore Schema

## Collections Structure

### `reports`
All user-submitted reports. Indexed for geographic queries.

**Document ID**: Auto-generated

**Fields:**
- `userId` (string): User ID from Firebase Auth (required for moderation)
- `text` (string): Report content (max 280 characters)
- `category` (string): "Traffic", "Safety", "Event", "Weather", "Other"
- `location` (GeoPoint): GPS coordinates {latitude, longitude}
- `photoUrl` (string): Cloud Storage URL of photo (null if no photo)
- `timestamp` (timestamp): When report was created
- `expiresAt` (timestamp): Auto-delete after 24 hours
- `status` (string): "active", "flagged_spam", "flagged_abuse" (for moderation)

**Indexes:**
- `location` (Geo) + `timestamp` (Descending) - for radius queries with recency
- `userId` + `timestamp` (Descending) - for "My Reports"
- `status` + `timestamp` - for moderation

---

### `users`
User metadata and rate limiting.

**Document ID**: `{userId}` (from Firebase Auth)

**Fields:**
- `createdAt` (timestamp)
- `lastReportTime` (timestamp): Last report submission time
- `reportsThisHour` (number): Count for rate limiting (resets hourly)
- `reportCount` (number): Total lifetime reports
- `anonymousOptIn` (boolean): User prefers anonymous posts

---

### `summaries` (cached)
Cache AI-generated summaries to avoid redundant Grok calls.

**Document ID**: `{lat}_{lng}_{radiusMi}_{hour}` (e.g., "32.7767_-96.7970_2_202603191500")

**Fields:**
- `center` (GeoPoint): Center location
- `radiusMiles` (number)
- `summary` (string): AI-generated summary text
- `reportCount` (number): # of reports included
- `createdAt` (timestamp)
- `expiresAt` (timestamp): Resets hourly

---

## Security Rules (Firestore)

- **reports**:
  - Anyone can read (public data)
  - Authenticated users can write (subject to backend validation & rate limiting)
  - Users can update/delete only their own reports

- **users**:
  - Users can read/write only their own document

- **summaries**:
  - Anyone can read
  - Only Cloud Functions can write
