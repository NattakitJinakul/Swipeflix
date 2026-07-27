# 03 — สถาปัตยกรรม (Architecture)

## Stack

- Expo SDK 54 · expo-router v6 (file-based routing) · TypeScript
- Reanimated 4 + react-native-worklets (animation บน UI thread)
- react-native-gesture-handler 2.28 (pan gesture)
- expo-image (แคชรูป), expo-haptics
- **Firebase** (Auth + Firestore) — auth + เก็บ watchlist/subscription ต่อ user
- **ต้องเพิ่ม:**
  - `firebase` (JS SDK) — auth + Firestore
  - `@react-native-async-storage/async-storage` — cache auth session
  - `react-native-youtube-iframe` + `react-native-webview` — เล่น trailer (❌ ไม่ใช่ expo-video)
  - `react-native-confetti-cannon` — match celebration (หรือทำเองด้วย Reanimated)

> เปลี่ยนจากแผนเดิม (AsyncStorage อย่างเดียว) → Firebase เป็น source of truth, AsyncStorage แค่แคช session ดู [09-auth-subscription.md](./09-auth-subscription.md)

## โครงสร้างโฟลเดอร์ (เป้าหมาย)

```
app/
  _layout.tsx              # root: auth gate → เลือก (auth) หรือ (tabs)
  (auth)/
    _layout.tsx
    login.tsx              # เข้าสู่ระบบ
    signup.tsx             # สมัคร
    pricing.tsx            # เลือกแผน subscription ตอนสมัคร
  (tabs)/
    _layout.tsx            # bottom tabs (4 tab)
    index.tsx              # Swipe
    watchlist.tsx          # Watchlist
    discover.tsx           # Discover/Search
    profile.tsx            # Profile
  movie/[id].tsx           # Detail
  settings/*.tsx           # หน้าตั้งค่าย่อย (account, subscription, preferences)

src/
  api/
    tmdb.ts                # fetch wrapper + config (key, baseURL, image URL)
    endpoints.ts           # discover, movieDetail, search, trending
  firebase/
    config.ts             # init Firebase app
    auth.ts               # signUp, signIn, signOut, observe
    library.ts            # อ่าน/เขียน watchlist ต่อ user (Firestore)
    subscription.ts       # อ่าน/เขียน plan ต่อ user
  types/
    movie.ts               # Movie, MovieDetail, Cast, Provider, Video
    user.ts                # UserProfile, Plan
  store/
    auth.tsx               # Context: user ปัจจุบัน + สถานะ auth
    library.tsx            # Context: liked/watched/disliked (sync Firestore)
    settings.tsx           # Context: theme, region, ภาษา, แนวที่ชอบ
  hooks/
    useDeck.ts             # โหลด+จัดคิวการ์ด, undo
    useMovieDetail.ts
    useSearch.ts
  utils/
    genres.ts              # map genreId → ชื่อ, taste stats
    affiliate.ts           # provider → ลิงก์ affiliate
    plans.ts               # นิยาม tier + สิทธิ์แต่ละแผน
components/
  SwipeCard.tsx
  CardStack.tsx
  PosterGrid.tsx
  StatBadge.tsx
  EmptyState.tsx
  PlanCard.tsx             # การ์ดราคาแต่ละแผน
  ...
```

## State + การเก็บข้อมูล (Firebase)

### Firestore schema (ต่อ user)

```
users/{uid}
  profile:  { displayName, email, avatar, region, language, theme }
  subscription: { plan: 'free'|'plus'|'pro', renewsAt, status }
  library/
    liked/{movieId}    : MovieLite + addedAt
    watched/{movieId}  : MovieLite + watchedAt
    disliked/{movieId} : { id, at }
```

### Library store (Context + Firestore sync)

```ts
type MovieStatus = 'liked' | 'watched' | 'disliked';

type LibraryState = {
  liked:    MovieLite[];   // อยากดู
  watched:  MovieLite[];   // เคยดูแล้ว
  disliked: number[];      // เก็บแค่ id กันโผล่ซ้ำ
};
```

- เก็บ `MovieLite` (id, title, poster, rating, genreIds) พอสำหรับ grid
- โหลดจาก Firestore ตอน login → cache ใน Context → เขียนกลับเมื่อ like/watched/dislike (optimistic update)
- offline: Firestore มี persistence ในตัว; AsyncStorage แค่จำ auth session
- **Undo:** เก็บ action ล่าสุด (`{movie, from}`) ใน memory → กดคืน = ย้ายกลับ deck + ลบ doc ที่เพิ่ง

> รายละเอียด auth + subscription tier → [09-auth-subscription.md](./09-auth-subscription.md)

### Deck (useDeck)

- ดึงหน้า popular/discover ทีละ page
- กรองออก: id ที่อยู่ใน liked/watched/disliked แล้ว
- prefetch รูปใบถัดไปด้วย expo-image

## Data flow

```
TMDB API ──fetch──> api/tmdb.ts ──> hooks (useDeck/useMovieDetail/useSearch)
                                        │
                                        v
                                  Screen components
                                        │ like/watched/dislike
                                        v
                              library store ──sync──> Firebase Firestore
                                        ^
Firebase Auth ──user──> auth store ────┘ (gate: ยังไม่ login = ไป (auth))
```

## หลักการ

- แยกหน้าที่ชัด: api ไม่รู้จัก UI, store ไม่รู้จัก network, component ไม่ fetch เอง (ผ่าน hook)
- ไฟล์เล็ก โฟกัสเดียว — การ์ด/สแตก/กริดแยกกัน
- ไม่มี backend เอง — TMDB เป็น source เดียว
