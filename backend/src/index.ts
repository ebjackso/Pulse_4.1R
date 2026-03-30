import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Rate limiting config
const REPORTS_PER_HOUR = 5;
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = "https://api.x.ai/v1/";

interface ReportSubmission {
  text: string;
  category: string;
  location: { latitude: number; longitude: number };
  photo?: string; // Base64 encoded image
}

interface SummaryRequest {
  center: { latitude: number; longitude: number };
  radiusMiles: number;
}

/**
 * Cloud Function: Submit a new report
 * - Validates input
 * - Checks rate limiting
 * - Saves to Firestore
 * - Returns confirmation
 */
export const submitReport = functions.https.onCall(
  async (data: ReportSubmission, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const { text, category, location, photo } = data;

    // Validation
    if (!text || text.length === 0 || text.length > 280) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Report text must be 1-280 characters"
      );
    }

    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Valid location required"
      );
    }

    const validCategories = ["Traffic", "Safety", "Event", "Weather", "Other"];
    if (category && !validCategories.includes(category)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid category. Must be one of: ${validCategories.join(", ")}`
      );
    }

    // Rate limiting check
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const now = admin.firestore.Timestamp.now();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const lastReportTime = userData?.lastReportTime?.toDate() || new Date(0);
      const timeSinceLastReport =
        (now.toDate().getTime() - lastReportTime.getTime()) / 1000 / 60; // minutes

      // Reset counter if > 1 hour
      let reportsThisHour = userData?.reportsThisHour || 0;
      if (timeSinceLastReport > 60) {
        reportsThisHour = 0;
      }

      if (reportsThisHour >= REPORTS_PER_HOUR) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          `Rate limit exceeded. Max ${REPORTS_PER_HOUR} reports per hour`
        );
      }

      // Update user record
      await userRef.update({
        lastReportTime: now,
        reportsThisHour: reportsThisHour + 1,
        reportCount: admin.firestore.FieldValue.increment(1),
      });
    } else {
      // Create new user record
      await userRef.set({
        createdAt: now,
        lastReportTime: now,
        reportsThisHour: 1,
        reportCount: 1,
        anonymousOptIn: false,
      });
    }

    // Handle photo upload if provided
    let photoUrl = null;
    if (photo) {
      try {
        const photoBuffer = Buffer.from(photo, "base64");
        const fileName = `reports/${userId}/${Date.now()}.jpg`;
        const file = storage.bucket().file(fileName);

        await file.save(photoBuffer, {
          metadata: {
            contentType: "image/jpeg",
            metadata: { userId, reportTime: now.toDate().toISOString() },
          },
        });

        photoUrl = `gs://${storage.bucket().name}/${fileName}`;
      } catch (error) {
        console.error("Photo upload failed:", error);
        // Continue without photo rather than failing entire report
      }
    }

    // Save report to Firestore
    const reportRef = db.collection("reports").doc();
    await reportRef.set({
      userId,
      text,
      category: category || "Other",
      location: new admin.firestore.GeoPoint(
        location.latitude,
        location.longitude
      ),
      photoUrl,
      timestamp: now,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000)
      ),
      status: "active",
    });

    // Invalidate cache for summaries near this location
    await invalidateSummaryCache(location.latitude, location.longitude);

    return {
      success: true,
      reportId: reportRef.id,
      message:
        "Report submitted successfully. It will appear in summaries within 60 seconds.",
    };
  }
);

/**
 * Cloud Function: Get AI-powered summary for a location
 * - Checks cache first (hourly TTL)
 * - Queries nearby reports
 * - Calls Grok API for summarization
 * - Caches result
 */
export const getSummary = functions.https.onCall(
  async (data: SummaryRequest) => {
    const { center, radiusMiles } = data;

    // Validation
    if (
      !center ||
      typeof center.latitude !== "number" ||
      typeof center.longitude !== "number"
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Valid center location required"
      );
    }

    if (typeof radiusMiles !== "number" || radiusMiles < 0.5 || radiusMiles > 10) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Radius must be between 0.5 and 10 miles"
      );
    }

    // Check cache
    const cacheKey = generateCacheKey(center.latitude, center.longitude, radiusMiles);
    const cacheDoc = await db.collection("summaries").doc(cacheKey).get();

    if (cacheDoc.exists) {
      const now = new Date();
      const cacheData = cacheDoc.data()!;
      if (new Date(cacheData.expiresAt.toDate()) > now) {
        return {
          summary: cacheData.summary,
          reportCount: cacheData.reportCount,
          cached: true,
          generatedAt: cacheData.createdAt.toDate().toISOString(),
        };
      }
    }

    // Query nearby reports
    const nearbyReports = await queryReportsByRadius(
      center.latitude,
      center.longitude,
      radiusMiles
    );

    if (nearbyReports.length === 0) {
      return {
        summary:
          "No reports in this area yet. Be the first to share what's happening!",
        reportCount: 0,
        cached: false,
      };
    }

    // Generate summary using Grok
    const summary = await generateSummaryWithGrok(nearbyReports, center, radiusMiles);

    // Cache the summary
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() + 60 * 60 * 1000) // 1 hour cache
    );

    await db.collection("summaries").doc(cacheKey).set({
      center: new admin.firestore.GeoPoint(center.latitude, center.longitude),
      radiusMiles,
      summary,
      reportCount: nearbyReports.length,
      createdAt: now,
      expiresAt,
    });

    return {
      summary,
      reportCount: nearbyReports.length,
      cached: false,
      generatedAt: now.toDate().toISOString(),
    };
  }
);

/**
 * Cloud Function: Triggered on user signup
 * Creates initial user document
 */
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);
  await userRef.set({
    createdAt: admin.firestore.Timestamp.now(),
    lastReportTime: null,
    reportsThisHour: 0,
    reportCount: 0,
    anonymousOptIn: false,
  });
});

/**
 * Cloud Function: Clean up expired reports
 * Scheduled daily
 */
export const cleanupExpiredReports = functions.pubsub
  .schedule("0 2 * * *") // Run at 2 AM daily
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const query = db.collection("reports").where("expiresAt", "<", now);
    const snapshot = await query.get();

    let deleted = 0;
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleted++;
    });

    if (deleted > 0) {
      await batch.commit();
      console.log(`Cleaned up ${deleted} expired reports`);
    }
  });

// ============ HELPER FUNCTIONS ============

/**
 * Query reports within radius using geo hash approximation
 */
async function queryReportsByRadius(
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): Promise<any[]> {
  // Convert miles to degrees (rough approximation: 1 degree ≈ 69 miles)
  const radiusDegrees = radiusMiles / 69;

  const query = db
    .collection("reports")
    .where("location", ">=", new admin.firestore.GeoPoint(
      centerLat - radiusDegrees,
      centerLng - radiusDegrees
    ))
    .where("location", "<=", new admin.firestore.GeoPoint(
      centerLat + radiusDegrees,
      centerLng + radiusDegrees
    ))
    .where("status", "==", "active")
    .orderBy("timestamp", "desc")
    .limit(100);

  const snapshot = await query.get();
  const reports: any[] = [];

  // Filter by actual distance (Firestore geo doesn't support distance queries directly)
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const distance = calculateDistance(
      centerLat,
      centerLng,
      data.location.latitude,
      data.location.longitude
    );

    if (distance <= radiusMiles) {
      reports.push({
        id: doc.id,
        ...data,
        distance,
      });
    }
  });

  return reports;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate summary using Grok API
 */
async function generateSummaryWithGrok(
  reports: any[],
  center: { latitude: number; longitude: number },
  radiusMiles: number
): Promise<string> {
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY not configured");
  }

  // Group reports by category
  const groupedReports = reports.reduce(
    (acc, report) => {
      const cat = report.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(report);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Build prompt
  const reportsSummary = Object.entries(groupedReports)
    .map(
      ([category, items]) =>
        `${category} (${items.length} reports):\n${items
          .map((r) => `- ${r.text}`)
          .join("\n")}`
    )
    .join("\n\n");

  const prompt = `You are a local news summarizer. Summarize these user-submitted reports from the past hour in a ${radiusMiles}-mile radius around coordinates (${center.latitude.toFixed(
    4
  )}, ${center.longitude.toFixed(4)}).

Keep the summary:
- Factual and neutral
- Grouped by category
- 3-5 bullet points
- Highlight urgent items (accidents, safety issues)
- Include count of similar reports

Reports:
${reportsSummary}

Provide ONLY the summary, no preamble.`;

  try {
    const response = await axios.post(
      GROK_API_URL,
      {
        model: "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Grok API error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate summary"
    );
  }
}

/**
 * Generate cache key for summary
 */
function generateCacheKey(lat: number, lng: number, radiusMiles: number): string {
  const hour = new Date().toISOString().slice(0, 13);
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusMiles}_${hour}`;
}

/**
 * Invalidate cached summaries near a location
 */
async function invalidateSummaryCache(lat: number, lng: number): Promise<void> {
  // Delete summaries within 5 miles of new report
  const query = db.collection("summaries");
  const snapshot = await query.get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const distance = calculateDistance(lat, lng, data.center.latitude, data.center.longitude);

    if (distance <= 5) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
}
