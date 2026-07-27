# 11 — Enhancements (feature เสริมทั้งหมด)

รวม idea เสริมทั้งหมด — เข้า plan แล้ว. แบ่งตามหน้าจอ + phase ที่ทำ

## Onboarding (แรกเข้า หลัง signup)

`app/(auth)/onboarding.tsx` — 2 ขั้น:
1. **ภาษา + ประเทศ** — TH/EN + region (TH/US) → `profile.language`, `profile.region`
   (region กระทบ watch provider, language กระทบข้อมูล TMDB)
2. **แนวหนังที่ชอบ** 3-5 อัน (chip grid) → `profile.favoriteGenres`

- ใช้ seed deck ปัดให้ตรงจริต + ตั้ง provider ให้ถูกประเทศ
- ทำ retention ดี + ให้ deck แรกไม่มั่ว

## Swipe — เสริม

| feature | รายละเอียด |
|---------|-----------|
| **Filter bar** | บน deck: genre · ปี · เรตติ้งขั้นต่ำ · **ความยาว** (เช่น <90 นาที "คืนนี้มีเวลาน้อย") |
| **Deck source toggle** | Trending / Top rated / Now playing / ตามแนวที่ชอบ |
| **Match celebration** | ปัดขวา = confetti + haptic เด้ง (Reanimated / lib เบาๆ) |
| **Surprise me** | ปุ่มสุ่มหนัง 1 เรื่อง → เด้ง detail ทันที |

## Detail — เสริม

- ปุ่ม **Share** — แชร์การ์ดหนัง (`expo-sharing` / RN Share)
- "หนังคล้ายกัน" — มีใน `recommendations` แล้ว ([04](./04-tmdb-api.md))
- **Trailer** — `react-native-youtube-iframe` (ไม่ใช่ expo-video)
- **Badge ภาษา** — ถ้า overview fallback เป็น EN โชว์ "🌐 แสดงเป็นภาษาอังกฤษ" ([04](./04-tmdb-api.md))

## Watchlist — เสริม

- **Sort:** เพิ่งเพิ่ม / เรตติ้ง / A-Z
- ปัด/กด "ดูแล้ว" → ย้ายจาก *อยากดู* เข้า *เคยดูแล้ว*

## Profile — เสริม (นอกจาก [10](./10-profile-settings.md))

| feature | ที่มาข้อมูล |
|---------|-----------|
| **Movie DNA** | นักแสดง/ผู้กำกับที่ชอบสุด — นับจาก `cast`/`crew` ของหนัง liked |
| **ทศวรรษที่ชอบ** | นับ `release_date` ของ liked → "90s 30%" |
| **Achievement badges** | "ดู 10 เรื่อง", "นัก Sci-Fi", "ดูครบทุกแนว" (gamify) |
| **เรตติ้งเฉลี่ย** | avg `vote_average` ของหนังที่ liked |

> Movie DNA ต้องเก็บ cast/crew ตอน like เพิ่ม (หรือ query detail ตอนคำนวณ) — ดู [note ล่าง](#หมายเหตุ-data)

## Settings — เสริม (นอกจาก [10](./10-profile-settings.md))

- **Autoplay trailer** toggle
- **Reduce motion** (accessibility — ปิด animation ปัด, ใช้ปุ่มแทน)
- **Swipe sensitivity** — ปรับ threshold การปัด
- **ล้าง cache รูป** (expo-image clear)
- **แจ้งเตือนหนังใหม่** (mock toggle)

## หมายเหตุ data

- **Movie DNA / taste chart** ต้องมี `genreIds` (+ optional top cast) ใน `MovieLite` ที่เก็บตอน like
- ถ้าอยากละเอียด: ตอนกด like → fetch credits เก็บ director + top 3 cast ลง Firestore ด้วย
- ไม่งั้นคำนวณ genre อย่างเดียวก็พอสำหรับ taste chart เบื้องต้น

## ลำดับ (ทำเมื่อ core เสร็จ)

**ทำใน Phase หลัก:** onboarding, filter bar, deck source toggle (กระทบ useDeck)
**Phase ขัดเงา:** match celebration, surprise me, share, sort, Movie DNA, badges, settings extras
