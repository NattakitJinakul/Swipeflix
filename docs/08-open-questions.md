# 08 — สิ่งที่ต้องตัดสินใจ / รอ

## 🔴 บล็อก (ต้องมีก่อนโค้ด)

- [ ] **TMDB API token** — สมัคร + ใส่ `.env` ([04](./04-tmdb-api.md)) · *API ฟรี 100% — ที่เสียเงินคือ subscription เว็บ ไม่เกี่ยวกับ API*
- [ ] **Firebase project** — ยังไม่สร้าง → สร้าง + config + เปิด Auth(Email) + Firestore ([09](./09-auth-subscription.md))

## ✅ ตัดสินใจแล้ว

- **Payment = mock UI** (Stripe/IAP บน store ติด review + Apple หัก 30% → ทำจริงทีหลัง)
- **เอา feature เสริมทุกอันเข้า plan** ([11](./11-enhancements.md))
- **Auth = Email/Password + Google** ทั้งคู่ ([09](./09-auth-subscription.md))

## 🟡 ตัดสินใจ (เหลือ)

| # | คำถาม | ตัวเลือก | เอนเอียง |
|---|-------|---------|---------|
| 3 | Deck source | popular / discover+genre | discover (กรอง genre ได้) |
| 4 | Detail = modal หรือ stack | — | stack (`movie/[id]`) |
| 5 | ภาษาเริ่มต้น | th-TH / en-US | th-TH, สลับได้ใน settings |
| 6 | region เริ่มต้น | TH | TH |
| 7 | subscription gate บังคับจริงไหม | บังคับ / โชว์เฉยๆ | โชว์ + gate เบาๆ (swipe limit) |

## ⚙️ ความเสี่ยงเชิงเทคนิค + วิธีจัดการ (ต้องทำตอนโค้ด)

| # | เรื่อง | วิธีจัดการ |
|---|-------|-----------|
| 1 | **Trailer YouTube** | ใช้ `react-native-youtube-iframe` + `react-native-webview` — ❌ expo-video เล่นไม่ได้ ([04](./04-tmdb-api.md)) |
| 2 | **ภาษาไทยบาง** | overview ว่าง → fallback `en-US` + **แจ้ง user** ด้วย badge "🌐 EN". เลือกภาษา/ประเทศตั้งแต่ onboarding + settings ([04](./04-tmdb-api.md)) |
| 3 | **Key โผล่ใน bundle** | `EXPO_PUBLIC_*` เห็นได้ในแอปจริง — ปกติสำหรับ Firebase (กันด้วย security rules), TMDB key ฟรีไม่ซีเรียส. อย่าเก็บ secret จริง |
| 4 | **Confetti** | ลง `react-native-confetti-cannon` หรือทำเองด้วย Reanimated |
| 5 | **Swipe limit (free 20/วัน)** | เก็บ `{date, count}` ใน Firestore → reset เมื่อข้ามวัน. gate ด้วย `canSwipe(plan, count)` |
| 6 | **watch provider TH น้อย** | region TH ว่าง → fallback US หรือซ่อนส่วน "ดูได้ที่" |
| 7 | **Firebase auth persistence** | `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` — ไม่งั้น login หลุดทุกครั้งเปิดแอป |

## 🟢 เสนอเพิ่ม (ถ้ามีเวลา)

- Google sign-in
- Notification หนังใหม่
- Share การ์ดหนัง
- Onboarding แรกเข้า (เลือกแนวที่ชอบ)

## เดดไลน์

- **6 ส.ค. 13:00** — ส่ง repo + screenshots + URL API
- ต้องเผื่อเวลาถ่าย screenshot + เขียน README + เตรียมพรีเซนต์

## ⚠️ เตือน scope

Firebase auth + subscription + swipe + detail + 4 tabs = งานใหญ่กว่าโจทย์ 10 คะแนนพอสมควร.
ถ้าเวลาไม่พอ ยึด **Phase 0-3** ให้เสร็จก่อน (แอปใช้ได้จริง) แล้วค่อยเสริม subscription/settings
