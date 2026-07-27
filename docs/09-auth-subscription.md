# 09 — Auth + Subscription (Firebase)

## Firebase setup

1. สร้างโปรเจกต์ที่ https://console.firebase.google.com
2. เพิ่ม Web App → ได้ config (`apiKey`, `authDomain`, `projectId`, ...)
3. เปิด **Authentication** → Sign-in method → เปิด **Email/Password + Google** ทั้งคู่
4. เปิด **Firestore Database** (production/test mode)
5. เก็บ config ใน `.env`: `EXPO_PUBLIC_FIREBASE_*` (อย่า commit)
6. ติดตั้ง: `npx expo install firebase @react-native-async-storage/async-storage`

> ใช้ Firebase **JS SDK** (`firebase/auth`, `firebase/firestore`) — ทำงานบน Expo Go ได้ ไม่ต้อง native config. Auth persistence ผ่าน `initializeAuth` + `getReactNativePersistence(AsyncStorage)`

## Auth flow

```
เปิดแอป → auth store observe onAuthStateChanged
   ├─ ยังไม่ login → redirect (auth)/login
   │      login ⇄ signup
   │      signup → กรอกข้อมูล → (auth)/pricing → เลือกแผน → เข้าแอป
   └─ login แล้ว → (tabs)
```

- Gate ทำใน `app/_layout.tsx` (root) — เช็ค user จาก auth store แล้ว `<Redirect>`
- `signup.tsx`: email, password, displayName → `createUserWithEmailAndPassword` → สร้าง `users/{uid}` doc
- `login.tsx`: `signInWithEmailAndPassword`
- **Google sign-in:** ปุ่ม "เข้าสู่ระบบด้วย Google" ทั้งหน้า login และ signup
  - ใช้ `expo-auth-session/providers/google` ขอ idToken → `signInWithCredential(GoogleAuthProvider.credential(idToken))`
  - ติดตั้ง: `npx expo install expo-auth-session expo-crypto expo-web-browser`
  - ตั้ง OAuth client id (Web + iOS + Android) ใน Google Cloud Console แล้วใส่ `.env`
  - ผู้ใช้ Google ครั้งแรก → สร้าง `users/{uid}` doc + พาไป pricing/onboarding เหมือน signup
- logout: `signOut()` → กลับ login

## Subscription tiers

นิยามใน `src/utils/plans.ts`:

| แผน | ราคา/เดือน | สิทธิ์ |
|-----|-----------|--------|
| **Free** | ฿0 | ปัดได้ 20 เรื่อง/วัน · watchlist สูงสุด 30 · มีโฆษณา |
| **Plus** | ฿59 | ปัดไม่จำกัด · watchlist ไม่จำกัด · ไม่มีโฆษณา |
| **Pro** | ฿129 | ทุกอย่างใน Plus · เลือก region หลายประเทศ · taste insight ละเอียด · early access |

```ts
type Plan = 'free' | 'plus' | 'pro';
type PlanDef = {
  id: Plan; name: string; price: number;
  perks: string[]; swipeLimit: number | null; watchlistLimit: number | null;
  recommended?: boolean;
};
```

- เก็บ `subscription.plan` ใน Firestore ต่อ user
- gate feature ด้วย helper: `canSwipe(plan, todayCount)`, `canAddToWatchlist(plan, count)`

## Payment — MVP mock

**ทันเดดไลน์:** ยังไม่ต่อ payment gateway จริง
- หน้า pricing เลือกแผน → กด "เลือก" → เขียน `subscription.plan` ตรงๆ (จำลองว่าจ่ายแล้ว)
- ปุ่ม "จ่ายเงิน" = mock success dialog
- **ต่อยอดจริงทีหลัง:** Stripe / Google Play Billing / RevenueCat

## Firestore security rules (สำคัญ)

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
  match /library/{doc=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

- ผู้ใช้เข้าได้แค่ข้อมูลตัวเอง
