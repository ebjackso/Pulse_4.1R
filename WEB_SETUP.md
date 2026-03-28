# Pulse Web App - Setup & Deployment Guide

## Overview

The Pulse web app is a React 18 + TypeScript application optimized for desktop browsers. It shares the same backend (Firebase Cloud Functions) with the Flutter mobile app,  provides a desktop-optimized UI with Leaflet maps integration, and deploys to Firebase Hosting at no cost.

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- Git

### Installation & Local Development

```bash
cd /workspaces/Pulse_4.1R/web
npm install
npm run dev
```

The dev server will start on `http://localhost:5173`

### Environment Setup

1. **Copy the example env file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your Firebase credentials** (get from Firebase Console):
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Ensure `GROK_API_KEY`** is set in Firebase Cloud Functions environment

### Build for Production

```bash
npm run build
```

Output: `web/dist/` (configured in firebase.json for hosting)

## Project Structure

```
web/
├── src/
│   ├── pages/
│   │   ├── Home.tsx              # Main dashboard with summaries
│   │   ├── MapExplorer.tsx       # Interactive map with Leaflet
│   │   ├── MyReports.tsx         # User's report history
│   │   └── Settings.tsx          # Theme, preferences, auth
│   ├── components/
│   │   ├── MainLayout.tsx        # Sidebar navigation & layout
│   │   ├── Button.tsx            # Reusable button component
│   │   ├── Common.tsx            # Common UI (Loading, Card, Badge)
│   │   └── ReportModal.tsx       # Report submission form
│   ├── stores/                   # Zustand state management
│   │   ├── authStore.ts          # Authentication (anonymous auth)
│   │   ├── locationStore.ts      # Current/selected location & radius
│   │   └── summaryStore.ts       # AI-generated summaries
│   ├── services/                 # Business logic & APIs
│   │   ├── firebaseService.ts    # Firebase init / client SDK
│   │   ├── cloudFunctionsService.ts  # submitReport, getSummary calls
│   │   └── firestoreService.ts   # Firestore queries
│   ├── types/                    # TypeScript interfaces
│   ├── App.tsx                   # Router & main app
│   └── main.tsx                  # Vite entry point
├── tailwind.config.js            # Tailwind CSS theming
├── vite.config.ts                # Vite build config
└── package.json
```

## Key Features

### 1. **Home Screen**
- Displays current location (auto-detected via browser geolocation)
- Shows AI-generated summary of nearby reports
- Report count, cache status, and generation time
- Refresh button to manually fetch new summary
- Submit Report button → modal form

### 2. **Map Explorer**
- Interactive Leaflet map with OpenStreetMap tiles (free, no API key)
- Adjustable radius slider (0.5-10 miles)
- View summary at selected location
- Current location button to center map
- Summary panel shows reports in selected area

### 3. **My Reports**
- Lists user's submitted reports (last 50)
- Filtered by current user ID
- Displays category, text, timestamp, location
- Sorted by most recent first

### 4. **Settings**
- Dark/Light mode toggle (persisted to localStorage)
- Default radius preference (persisted to localStorage)
- About & Privacy information
- Sign Out button

## Deployment

### Firebase Hosting (Free Tier)

1. **Ensure firebase.json includes web hosting:**
   ```json
   {
     "hosting": {
       "public": "web/dist",
       "rewrites": [{"source": "**", "destination": "/index.html"}]
     }
   }
   ```
   ✅ Already configured!

2. **Set environment variables for build:**
   ```bash
   export VITE_FIREBASE_API_KEY=...
   export VITE_FIREBASE_PROJECT_ID=...
   # ... (set all env vars)
   ```

3. **Build & Deploy:**
   ```bash
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

   Or simply push to main branch (if GitHub Actions CI/CD is set up):
   ```bash
   git push origin main
   ```

4. **View live site:**
   - URL: `https://your-project.web.app`
   - Status: Check Firebase Console → Hosting

### CI/CD with GitHub Actions

GitHub Actions workflow auto-deploys on push to main:
- File: `.github/workflows/deploy-web.yml`
- Required Secrets:
  - `FIREBASE_SERVICE_ACCOUNT` (service account JSON key)
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN`
  - `FIREBASE_STORAGE_BUCKET`
  - `FIREBASE_MESSAGING_SENDER_ID`
  - `FIREBASE_APP_ID`

**Setup:**
1. Create service account in Firebase Console
2. Add secrets to GitHub repository settings
3. Commit & push to main branch → auto-deploys

## Testing

### Local Testing
```bash
npm run dev
```
- Open http://localhost:5173
- Test all pages: Home, Map, MyReports, Settings
- Test report submission (rate limiting applies)
- Test dark/light mode toggle

### Firebase Emulator (Optional)
```bash
firebase emulators:start
```
Then uncomment emulator config in `src/services/firebaseService.ts`

### Production Testing
- Deploy to staging channel: `firebase deploy --only hosting:staging`
- Full access to real Firestore data
- Test on desktop, tablet, mobile browsers

## Performance Considerations

- **Lazy Loading**: Pages loaded on-demand with React.lazy()
- **Code Splitting**: Each page is a separate chunk
- **Tailwind CSS**: Purged to only include used utilities
- **Maps**: Leaflet is lightweight (minimal JS bundle)
- **Caching**: Firebase Hosting CDN caches built assets
- **Bundle Size**: ~150KB gzipped (React + deps + all pages)

## Free Tier Limits & Costs

| Resource | Limit | Cost |
|----------|-------|------|
| Firebase Hosting | 1 GB storage, 10 GB bandwidth/mo | Free |
| Firestore | 50k reads, 20k writes, 20k deletes/day | Free |
| Cloud Storage | 5 GB storage, 1 GB/day download | Free |
| Cloud Functions | 2M invocations/mo | Free |

**Scaling:** If you exceed free tier, upgrade to Pay-As-You-Go for ~$0.06/GB bandwidth + storage/compute costs.

## Troubleshooting

### "Cannot enable location"
- Ensure browser supports Geolocation API
- Check permissions in browser settings
- HTTPS required in production (Firebase Hosting enforces this)

### Map not showing
- Verify OpenStreetMap tiles are accessible (check network tab)
- Ensure Leaflet library loaded correctly
- Check browser console for errors

### Reports not appearing
- Verify Firebase Auth is configured (anonymous auth should auto-trigger)
- Check Firestore rules allow public read
- Ensure backend Cloud Functions are deployed

### Build fails with CSS errors
- Run `npm install` to ensure all dependencies installed
- Delete `node_modules` and `dist`, then rebuild
- Check Tailwind config for syntax errors

## Future Enhancements

- [ ] Progressive Web App (PWA) support
- [ ] Report clustering on map
- [ ] User profiles & report history
- [ ] Push notifications
- [ ] Advanced filtering (category, date range)
- [ ] Report moderation dashboard
- [ ] Analytics dashboard
- [ ] Offline mode with service workers

## Documentation

- **Architecture**: See `/ARCHITECTURE.md` in root
- **Firestore Schema**: See `/FIRESTORE_SCHEMA.md`
- **Setup Guide**: See `/SETUP.md`
- **React Components**: TypeScript interfaces in `src/types/`
- **API Reference**: See `src/services/` for Cloud Functions calls

## Support

For issues or questions:
1. Check GitHub Issues
2. Review Firebase Console logs
3. Inspect browser console for errors
4. Test with Firebase emulator locally

---

**Version**: 1.0.0
**Last Updated**: 2026-03-27
**Deployed To**: Firebase Hosting (Free Tier)
