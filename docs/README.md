# 🎬 Swipeflix — เอกสารวางแผน (Planning Docs)

> แอป **"หนังคืนนี้ดูอะไรดี"** — ปัดซ้าย/ขวาเลือกหนังแบบ Tinder ต่อยอดด้วย TMDB API
> งาน: **Mini 1: API Apps** (10 คะแนน) — ครบกำหนด 6 ส.ค. 13:00

---

## 📑 สารบัญ (Index)

| # | ไฟล์ | เนื้อหา |
|---|------|---------|
| 00 | [overview.md](./00-overview.md) | ภาพรวม, โจทย์, เป้าหมาย, ทำไมเลือก TMDB |
| 01 | [scope-features.md](./01-scope-features.md) | ขอบเขตงาน, 4 หน้าจอ, feature ทั้งหมด, สิ่งที่ตัดออก |
| 02 | [screens.md](./02-screens.md) | รายละเอียดแต่ละหน้าจอ + สิ่งที่แสดงในหน้า detail |
| 03 | [architecture.md](./03-architecture.md) | โครงสร้างโฟลเดอร์, data layer, state, การเก็บข้อมูลถาวร |
| 04 | [tmdb-api.md](./04-tmdb-api.md) | TMDB API: สมัคร key, endpoint ที่ใช้, field mapping |
| 05 | [affiliate.md](./05-affiliate.md) | ช่องทางดู + affiliate streaming |
| 06 | [design-ui.md](./06-design-ui.md) | ธีม, สี, ฟอนต์, micro-interaction |
| 07 | [implementation-plan.md](./07-implementation-plan.md) | แผนสร้างเป็น phase, checklist |
| 08 | [open-questions.md](./08-open-questions.md) | สิ่งที่ยังต้องตัดสินใจ / รอ |
| 09 | [auth-subscription.md](./09-auth-subscription.md) | Firebase auth, login/signup, subscription tiers |
| 10 | [profile-settings.md](./10-profile-settings.md) | Profile + รายการ settings ทั้งหมด |
| 11 | [enhancements.md](./11-enhancements.md) | feature เสริมทั้งหมด (onboarding, filter, Movie DNA, badges ฯลฯ) |

---

## 🚀 สรุปสั้น

- **ชื่อ:** Swipeflix
- **API:** [TMDB (The Movie Database)](https://www.themoviedb.org/) — ฟรี, รูปโปสเตอร์สวย, ข้อมูลครบ
- **Stack:** Expo SDK 54 · expo-router v6 · TypeScript · Reanimated 4 · Gesture Handler · **Firebase** (Auth + Firestore)
- **Auth:** login/signup + เลือกแผน subscription (Free/Plus/Pro) ก่อนเข้าแอป
- **4 หน้าจอ:** Swipe · Watchlist · Discover/Search · Profile
- **จุดขาย:** UI ปัดการ์ดลื่น + trailer + สถิติแนวหนังที่ชอบ + subscription + ต่อยอด affiliate ได้

## ✅ สถานะ

ยังไม่เริ่มโค้ด — เอกสารนี้คือแผนก่อนลงมือ. รอตัดสินใจ [ข้อ 08](./08-open-questions.md) (สำคัญสุด: TMDB API key).
