# 10 — Profile + Settings

## หน้า Profile (`app/(tabs)/profile.tsx`)

```
┌─────────────────────────┐
│   (avatar)  ชื่อผู้ใช้     │
│   แผน: Plus ⭐            │
│                         │
│  ┌─────┐ ┌─────┐        │
│  │ 24  │ │ 12  │        │  ← liked / watched
│  │Liked│ │Seen │        │
│  └─────┘ └─────┘        │
│                         │
│  แนวที่ชอบ               │
│  Action  ████████ 40%   │  ← taste chart
│  Sci-Fi  █████ 25%      │
│  Drama   ███ 15%        │
│                         │
│  ⚙ ตั้งค่า >             │
└─────────────────────────┘
```

- header: avatar + ชื่อ + badge แผน
- การ์ดสถิติ: liked/watched (นับจาก library store) + **เรตติ้งเฉลี่ย** ของหนัง liked
- **taste chart:** นับ genreIds จาก `liked` → % ต่อ genre (ใช้ `utils/genres.ts`)
- **Movie DNA:** นักแสดง/ผู้กำกับที่ชอบสุด (นับจาก cast/crew ของ liked)
- **ทศวรรษที่ชอบ:** นับ release_date → "90s 30%"
- **Achievement badges:** "ดู 10 เรื่อง", "นัก Sci-Fi", "ดูครบทุกแนว" (gamify)
- ปุ่มเข้าหน้า settings
- รายละเอียด → [11-enhancements.md](./11-enhancements.md)

## หน้า Settings (จัดกลุ่ม)

### บัญชี (Account)
- แก้ชื่อ / avatar
- เปลี่ยนอีเมล / รหัสผ่าน
- **ออกจากระบบ** (logout)
- ลบบัญชี

### สมาชิก (Subscription) — จุดขาย
- แผนปัจจุบัน + วันหมดอายุ
- อัปเกรด / จัดการแผน (ไป pricing)
- ประวัติการจ่าย (mock)

### ค่ากำหนด (Preferences)
- **Theme:** Dark / Light / System
- **ภาษา:** TH / EN
- **ภูมิภาค (region):** TH / US / ... → กระทบ watch provider + ภาษา TMDB
- **แนวที่ชอบ:** เลือก genre → seed deck ปัด
- ซ่อนแนวที่ไม่ชอบ

### เนื้อหา (Content)
- toggle เนื้อหาผู้ใหญ่ (adult)
- รีเซ็ต deck (คืนหนัง disliked)
- **Autoplay trailer** toggle

### การแสดงผล / Accessibility
- **Reduce motion** — ปิด animation ปัด, ใช้ปุ่มแทน
- **Swipe sensitivity** — ปรับ threshold การปัด
- **แจ้งเตือนหนังใหม่** (mock toggle)

### ข้อมูล (Data)
- ล้าง watchlist
- ล้าง cache รูป (expo-image)
- สถานะ sync Firebase

### เกี่ยวกับ (About)
- เวอร์ชันแอป
- **เครดิต TMDB** ← *บังคับ*: "This product uses the TMDB API but is not endorsed or certified by TMDB" + โลโก้
- Privacy / Terms

## ลำดับความสำคัญ (ทำจริงก่อน)

**ต้องมี:** logout · แผนปัจจุบัน · theme · region · แนวที่ชอบ · เครดิต TMDB
**mock/ทีหลังได้:** เปลี่ยนรหัส · ประวัติจ่าย · ลบบัญชี · adult toggle

## เก็บที่ไหน

- preferences (theme/region/language/genres) → Firestore `users/{uid}.profile` + cache ใน `settings` store
- theme ใช้ร่วมกับ `use-color-scheme` เดิม
