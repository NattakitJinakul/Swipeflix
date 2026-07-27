# 🎬 Swipeflix

**"หนังคืนนี้ดูอะไรดี?"** — swipe movies like Tinder to beat choice paralysis.

Swipe right to save, left to pass, tap for full details, trailer, and where to watch. Built on the [TMDB API](https://www.themoviedb.org/).

## ✨ Features

- **Swipe deck** — Tinder-style cards, 60fps gesture + rotation, LIKE/NOPE/SEEN overlays, haptics, match confetti
- **Watchlist** — liked / watched lists, synced to Firebase per user
- **Discover / Search** — trending grid + debounced movie search
- **Detail** — backdrop, cast, director, YouTube trailer, streaming providers, related movies
- **Auth** — email/password + Google sign-in, onboarding (language, region, favorite genres)
- **Subscription tiers** — Free / Plus / Pro (mock payment)
- **Profile** — taste chart from your likes, stats, settings (theme, region, language)

## 🧱 Tech Stack

- **Expo SDK 54** · expo-router v6 (file-based routing) · TypeScript
- **Reanimated 4** + gesture-handler — swipe animations on the UI thread
- **Firebase** (Auth + Firestore) — accounts, watchlist, subscription
- **TMDB API** — movie data, posters, trailers, watch providers
- `react-native-youtube-iframe` (trailers), `expo-image` (poster caching), `expo-haptics`

## 🚀 Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment — copy the example and fill in your keys

   ```bash
   cp .env.example .env
   ```

   Fill `.env`:
   - `EXPO_PUBLIC_TMDB_TOKEN` — TMDB v4 Read Access Token ([get one here](https://www.themoviedb.org/settings/api))
   - `EXPO_PUBLIC_FIREBASE_*` — Firebase web app config (Auth + Firestore enabled)
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `_IOS_CLIENT_ID` / `_ANDROID_CLIENT_ID` — Google OAuth client ids (optional; Google button disables itself if unset)

3. Start the app

   ```bash
   npx expo start
   ```

   Open in Expo Go, an Android emulator, or an iOS simulator.

## 📑 Documentation

Full planning docs (architecture, screens, TMDB usage, design, auth/subscription) live in [`docs/`](./docs/README.md).

## 📸 Screenshots

_TODO: add screenshots — Swipe deck · Detail · Watchlist · Profile taste chart · Pricing._

## 📝 Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
