# 01 — ขอบเขต + Feature

## หน้า Auth (ก่อนเข้าแอป)

| หน้า | หน้าที่ |
|------|---------|
| **Login** | เข้าสู่ระบบ (Firebase Email/Password) |
| **Signup** | สมัครสมาชิก → ต่อด้วยเลือกแผน |
| **Pricing** | เลือก subscription tier (Free/Plus/Pro) |
| **Onboarding** | เลือกแนวหนังที่ชอบ 3-5 อัน → seed deck |

รายละเอียด → [09-auth-subscription.md](./09-auth-subscription.md) · feature เสริม → [11-enhancements.md](./11-enhancements.md)

## 4 หน้าจอ (Bottom Tabs — หลัง login)

| Tab | ชื่อ | หน้าที่ |
|-----|------|---------|
| 1 | **Swipe** | หน้าแรก — ปัดการ์ดหนังซ้าย/ขวา (core) |
| 2 | **Watchlist** | หนังที่ปัดขวา — แยก sub-tab: *อยากดู* \| *เคยดูแล้ว* |
| 3 | **Discover** | คล้าย IG explore/trending + ช่องค้นหา |
| 4 | **Profile** | สถิติ + แนวหนังที่ชอบ + ตั้งค่า |

## Feature หลัก

### หน้า Swipe
- [ ] ปัดขวา = **Like** → เข้า watchlist "อยากดู"
- [ ] ปัดซ้าย = **Dislike** → ผ่าน (ไม่โผล่ซ้ำ)
- [ ] ปุ่ม **เคยดูแล้ว (Watched)** → เข้า watchlist "เคยดูแล้ว"
- [ ] แตะการ์ด → หน้า **รายละเอียด**
- [ ] **Undo** — ยกเลิกการปัดล่าสุด (ปัดพลาดกดคืนได้)
- [ ] ปุ่มกด like/dislike/watched (ทางเลือกนอกจากปัด)
- [ ] Haptic feedback ตอนปัด
- [ ] **Filter bar** — genre · ปี · เรตติ้งขั้นต่ำ · ความยาว ([11](./11-enhancements.md))
- [ ] **Deck source toggle** — Trending / Top rated / Now playing / ตามแนว
- [ ] **Match celebration** — confetti + haptic ตอนปัดขวา
- [ ] **Surprise me** — สุ่มหนัง 1 เรื่อง

### หน้า Detail
- [ ] ปุ่ม **Share** การ์ดหนัง
แสดง (ตามสเปก):
- [ ] Backdrop + Poster + ชื่อ + ปีที่ฉาย
- [ ] ⭐ เรตติ้ง (vote_average)
- [ ] **แนวหนัง** (genres)
- [ ] **ความยาว** (runtime)
- [ ] **เรื่องย่อ / ความเป็นมา** (overview)
- [ ] **นักแสดง** (cast — รูป + ชื่อ + บทบาท)
- [ ] **ผู้กำกับ + ค่าย** (director, production companies)
- [ ] **หนังที่เกี่ยวข้อง** (recommendations / collection — ภาคต่างๆ)
- [ ] **Trailer** (YouTube key → เล่นด้วย expo-video)
- [ ] **ช่องทางดู + affiliate** → ดู [05-affiliate.md](./05-affiliate.md)

### หน้า Discover
- [ ] Trending grid (เหมือน IG explore)
- [ ] ช่องค้นหา (search by title)
- [ ] แตะ → หน้า detail

### หน้า Profile + Settings
- [ ] สถิติ: liked กี่เรื่อง / watched กี่เรื่อง
- [ ] **แนวที่ชอบ** — นับ genre จาก liked → "Action 40%, Sci-Fi 25%..."
- [ ] แผน subscription ปัจจุบัน + อัปเกรด
- [ ] ตั้งค่า: theme, region, ภาษา, แนวที่ชอบ, logout, เครดิต TMDB
- [ ] รายละเอียดเต็ม → [10-profile-settings.md](./10-profile-settings.md)

## สิ่งที่ตัดออก (YAGNI)

❌ comment / rating เอง · ❌ social feed · ❌ download · ❌ backend ของเราเอง (ใช้ TMDB + Firebase) · ❌ payment gateway จริง (mock ก่อน)

## 3 State ของหนัง

หนังแต่ละเรื่องมีได้ 1 state: `disliked` · `liked` (อยากดู) · `watched` (เคยดู)
เก็บเป็น 3 ชุดแยกกัน — ดู [03-architecture.md](./03-architecture.md)
