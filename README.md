# Swipeplay 🎮

A game-discovery mobile app built with Expo + React Native. Swipe through games Tinder-style —
right to like (อยากเล่น), left to skip, up to mark played (เล่นแล้ว) — powered by the
[IGDB](https://www.igdb.com/) API. **Guest-first**: browse and swipe with no account; sign in only
to save your library and see your taste stats.

## Features

- **Swipe deck** — like / skip / played, undo, surprise-me, confetti on like
- **Sources & filters** — ยอดนิยม / ใหม่ / คะแนนสูง / ตามที่ชอบ, filter by IGDB genre
- **Game detail** — screenshots hero, summary, YouTube trailer, studios, ratings, store/official
  website links, and similar games
- **Library** — อยากเล่น / เล่นแล้ว lists, sort, move & remove
- **Profile** — taste chart by genre, Game DNA (favorite decade + achievement badges), avg rating
- **Guest-first auth** — full browsing without login; login prompt only when saving

## Tech

- Expo (SDK 54) · Expo Router · React Native · TypeScript
- IGDB API (`https://api.igdb.com/v4`) — apicalypse POST queries, Twitch-issued auth
- Firebase Auth + Firestore (optional — only needed to persist a signed-in user's library)
- Reanimated + Gesture Handler (swipe deck), expo-image, react-native-youtube-iframe (trailers)

## Setup

```bash
npm install
cp .env.example .env       # then fill in the values below
npx expo start
```

### Environment variables (`.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_IGDB_CLIENT_ID` | ✅ | Your Twitch application Client ID |
| `EXPO_PUBLIC_IGDB_TOKEN` | ✅ | App access token minted from your Twitch client credentials |
| `EXPO_PUBLIC_FIREBASE_*` | optional | Only for saving a signed-in user's library (guests work without it) |

IGDB is powered by Twitch: create a Twitch application to get a **Client ID** + **Client Secret**,
then mint an **App Access Token** (OAuth client-credentials flow) and put it in
`EXPO_PUBLIC_IGDB_TOKEN`. Every request sends both as `Client-ID` and `Authorization: Bearer`
headers.

## Attribution

This product uses the IGDB API. Game data, cover art, and ratings are provided by
[IGDB.com](https://www.igdb.com/) (powered by Twitch).
