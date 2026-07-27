# 06 — ดีไซน์ + UI

## Vibe

สายหนัง/โรงภาพยนตร์ — เข้ม, cinematic, โปสเตอร์เด่น. โทน dark เป็นหลัก (หนังดูกลางคืน)

## ธีมสี (เสนอ)

| token | Dark | Light |
|-------|------|-------|
| background | `#0B0B0F` | `#FFFFFF` |
| surface (card) | `#16161D` | `#F4F4F6` |
| primary (accent) | `#E50914` (แดงหนัง) | `#E50914` |
| like | `#22C55E` เขียว | |
| dislike | `#EF4444` แดง | |
| watched | `#3B82F6` น้ำเงิน | |
| text | `#FFFFFF` | `#0B0B0F` |
| muted | `#9CA3AF` | `#6B7280` |

- ใช้ระบบ theme เดิมใน `constants/theme.ts` + `use-color-scheme` (มีในสแกฟโฟลด์) ต่อยอด

## Typography

- หัวเรื่อง: bold ใหญ่ (ชื่อหนัง)
- ฟอนต์ระบบพอ; ถ้าอยากเท่ใช้ `expo-font` โหลด Inter / Bebas Neue (หัวข้อ cinematic)

## Micro-interaction (จุดที่ทำให้ "VERY NICE")

- **การ์ดปัด:** หมุน + เลื่อนตามนิ้ว, overlay "LIKE"/"NOPE"/"SEEN" จางเข้าตามระยะ (Reanimated `interpolate`)
- **Haptic** ตอนปัดสำเร็จ (`expo-haptics`)
- **Card stack:** ใบหลัง scale เล็ก + เลื่อนขึ้นตอนใบหน้าออก
- **Skeleton loading** ตอนโหลด deck/detail
- **Empty state** มีภาพ + ข้อความ + ปุ่ม action
- **Poster grid:** expo-image + fade-in + rounded corner + เงา
- **Tab bar:** ไอคอน filled ตอน active + haptic (มี `haptic-tab.tsx` แล้ว)

## หน้าจอที่ต้องเนี้ยบเป็นพิเศษ (โชว์อาจารย์)

1. **Swipe** — core, ต้องลื่น 60fps
2. **Detail** — backdrop เต็มจอบน + gradient fade → เนื้อหา (parallax ได้, มี `parallax-scroll-view.tsx`)
3. **Pricing** — การ์ดแผนสวยๆ มี "แนะนำ" badge
4. **Profile taste chart** — bar/chip สีตาม genre

## Reference

Tinder (ปัด) · Letterboxd (detail สวย) · Netflix (grid, โทนเข้ม) · IG Explore (discover)
