# 02 — รายละเอียดหน้าจอ (Screen Specs)

## 0) Auth (`app/(auth)/*`)

- **login.tsx** — email + password + ปุ่มไป signup
- **signup.tsx** — displayName + email + password → ไป pricing
- **pricing.tsx** — การ์ด 3 แผน (Free/Plus/Pro), badge "แนะนำ" ที่ Plus → เลือก → onboarding
- **onboarding.tsx** — 2 ขั้น: (1) เลือก **ภาษา + ประเทศ** (TH/EN, region TH/US) → (2) เลือกแนวหนังที่ชอบ 3-5 อัน → บันทึก → เข้าแอป
- gate อยู่ที่ root `_layout.tsx` — ยังไม่ login เด้งมาที่นี่
- รายละเอียด → [09-auth-subscription.md](./09-auth-subscription.md), [10-profile-settings.md](./10-profile-settings.md), [11-enhancements.md](./11-enhancements.md)

## 1) Swipe (`app/(tabs)/index.tsx`)

```
┌─────────────────────────┐
│ Swipeflix  [🎲] [⚙filter]│  ← surprise me · filter bar
│ [Trending▾]        [undo]│  ← deck source toggle
│   ┌───────────────┐     │
│   │               │     │  ← การ์ดหนัง (poster เต็ม)
│   │   [POSTER]    │     │     ปัด/หมุนตามนิ้ว
│   │               │     │     overlay "LIKE"/"NOPE" ตอนปัด
│   │  ⭐ 8.4        │     │
│   │  Dune (2021)  │     │
│   │  Sci-Fi·Action│     │
│   └───────────────┘     │
│                         │
│  [✕]    [👁]    [♥]      │  ← dislike · watched · like
└─────────────────────────┘
```

- Card stack: โชว์ 2-3 ใบซ้อน (ใบหลังเล็กลงนิด)
- ปัดเกิน threshold → บินออก + โหลดใบถัดไป
- ปัดขวา → **match celebration** (confetti + haptic)
- deck หมด → **empty state** ("ดูครบแล้ว! โหลดเพิ่ม" / เปลี่ยน filter)
- **Filter bar:** genre · ปี · เรตติ้งขั้นต่ำ · ความยาว
- **Deck source toggle:** Trending / Top rated / Now playing / ตามแนวที่ชอบ
- **Surprise me (🎲):** สุ่มหนัง 1 เรื่อง → เด้ง detail
- source deck: TMDB discover/popular (กรอง genre จาก filter + แนวที่ชอบ)
- รายละเอียด → [11-enhancements.md](./11-enhancements.md)

## 2) Watchlist (`app/(tabs)/watchlist.tsx`)

- Segmented control ด้านบน: **อยากดู | เคยดูแล้ว**
- **Sort:** เพิ่งเพิ่ม / เรตติ้ง / A-Z
- Grid โปสเตอร์ (2-3 คอลัมน์)
- แตะ → detail
- ปัด/กดลบออกจาก list ได้ · กด "ดูแล้ว" ย้ายจากอยากดู เข้าเคยดู
- แต่ละ tab ว่าง → empty state

## 3) Discover (`app/(tabs)/discover.tsx`)

- บนสุด: ช่องค้นหา (debounce)
- ยังไม่พิมพ์ → โชว์ **Trending** grid (เหมือน IG explore, การ์ดขนาดไม่เท่ากันได้)
- พิมพ์แล้ว → ผลค้นหา
- แตะ → detail

## 4) Profile + Settings (`app/(tabs)/profile.tsx` + `app/settings/*`)

- Header + avatar + badge แผน
- การ์ดสถิติ: จำนวน liked / watched
- **Taste chart** — bar/chip แนวหนังที่ชอบ (นับจาก liked)
- เข้าหน้าตั้งค่า: account, subscription, preferences, about (เครดิต TMDB)
- รายละเอียดเต็ม → [10-profile-settings.md](./10-profile-settings.md)

## Detail (`app/movie/[id].tsx` — modal หรือ stack)

```
[ Backdrop image ]
  Poster | ชื่อ · ปี · ⭐8.4 · 2h35m
  [chip: Sci-Fi] [chip: Action]
  ── เรื่องย่อ ──
  overview...
  ── นักแสดง ── (แนวนอน scroll: รูป+ชื่อ+บท)
  ── ทีมงาน ── ผู้กำกับ · ค่าย
  ── ▶ Trailer ── (expo-video)
  ── ดูได้ที่ ── [Netflix] [Prime]  ← affiliate
  ── หนังที่เกี่ยวข้อง ── (แนวนอน scroll)
  [ ♥ เพิ่มเข้า watchlist ]
```

- ดึงข้อมูลด้วย `append_to_response=credits,videos,recommendations,watch/providers` (1 request) — ดู [04-tmdb-api.md](./04-tmdb-api.md)
