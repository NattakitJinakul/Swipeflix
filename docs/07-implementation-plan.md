# 07 — แผนสร้าง (Implementation Plan)

สร้างเป็น phase — แต่ละ phase ทำงานได้จริง (ปิด-เปิดเดโมได้) ก่อนไป phase ถัดไป

## Phase 0 — Setup

- [ ] ติดตั้ง deps: `npx expo install firebase @react-native-async-storage/async-storage react-native-youtube-iframe react-native-webview react-native-confetti-cannon`
- [ ] `.env` + `.gitignore` (TMDB token, Firebase config)
- [ ] `src/api/tmdb.ts` + ทดสอบ fetch popular ได้
- [ ] `src/firebase/config.ts` init + ต่อ Firestore/Auth ติด
- [ ] วาง theme/สี ([06](./06-design-ui.md))

## Phase 1 — Auth (gate)

- [ ] `store/auth.tsx` — observe `onAuthStateChanged`
- [ ] `(auth)/login.tsx`, `(auth)/signup.tsx`
- [ ] root `_layout.tsx` — redirect ตามสถานะ login
- [ ] สร้าง `users/{uid}` doc ตอน signup
- [ ] `(auth)/pricing.tsx` + `utils/plans.ts` (เลือกแผน mock)
- [ ] `(auth)/onboarding.tsx` — (1) ภาษา+ประเทศ → `profile.language/region` (2) เลือกแนว → `profile.favoriteGenres`
- **เดโมได้:** สมัคร/ล็อกอิน/ออก, เลือกแผน, ตั้งภาษา, เลือกแนว

## Phase 2 — Swipe core (หัวใจ)

- [ ] `types/movie.ts`, `api/endpoints.ts` (discover/popular, genre list)
- [ ] `components/SwipeCard.tsx` + `CardStack.tsx` (Reanimated + gesture)
- [ ] `hooks/useDeck.ts` (โหลด page, กรอง seen, prefetch)
- [ ] like/dislike/watched + overlay + haptic
- [ ] **Undo**
- [ ] `store/library.tsx` + sync Firestore
- [ ] **Filter bar** (genre/ปี/เรตติ้ง/ความยาว) + **deck source toggle** (seed จาก favoriteGenres)
- [ ] empty state
- **เดโมได้:** ปัดการ์ด → เข้า watchlist บน Firebase

## Phase 3 — Detail

- [ ] `app/movie/[id].tsx` + `useMovieDetail` (append_to_response)
- [ ] แสดง: backdrop, cast, ผู้กำกับ/ค่าย, runtime, genres, overview, related
- [ ] **ภาษา fallback** — overview ว่าง → en-US + badge "🌐 EN" แจ้ง user
- [ ] Trailer (`react-native-youtube-iframe`)
- [ ] ช่องทางดู + affiliate ([05](./05-affiliate.md))
- [ ] ปุ่ม **Share**

## Phase 4 — Watchlist + Discover

- [ ] `watchlist.tsx` (segment อยากดู/เคยดู, grid, ลบ, **sort**, ย้ายเข้าเคยดู)
- [ ] `discover.tsx` (trending grid + search debounce)

## Phase 5 — Profile + Settings

- [ ] `profile.tsx` (สถิติ + taste chart + **Movie DNA** + ทศวรรษ + **badges** + เรตติ้งเฉลี่ย)
- [ ] settings (account/subscription/preferences/content/about + เครดิต TMDB)
- [ ] theme/region/genre → กระทบ deck + provider
- [ ] settings เสริม: autoplay trailer, reduce motion, swipe sensitivity, ล้าง cache

## Phase 6 — ขัดเงา (ให้ VERY NICE)

- [ ] **Match celebration** (confetti + haptic) + **Surprise me**
- [ ] skeleton loading, fade-in, empty states ทุกหน้า
- [ ] gate สิทธิ์ตามแผน (swipe limit ฯลฯ)
- [ ] icon + splash + ชื่อแอป
- [ ] เก็บ screenshot ทุกหน้า (ส่งงาน)
- [ ] README + ลิงก์ TMDB API (ส่ง URL)

## ลำดับความสำคัญถ้าเวลาไม่พอ

**ขาดไม่ได้:** Phase 0-3 (auth + swipe + detail) = แอปใช้งานได้จริง
**ตัดได้:** subscription gate จริง (เหลือ UI), discover search, taste chart
