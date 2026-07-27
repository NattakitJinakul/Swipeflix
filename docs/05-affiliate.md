# 05 — ช่องทางดู + Affiliate

## แหล่งข้อมูล

TMDB คืน watch providers ให้ (powered by JustWatch):

```
GET /movie/{id}?append_to_response=watch/providers
→ watch/providers.results.TH = {
    link: "https://www.themoviedb.org/movie/123/watch?locale=TH",
    flatrate: [{ provider_name:"Netflix", logo_path, provider_id }],
    rent: [...], buy: [...]
  }
```

- `flatrate` = ดูได้ในแพ็กเกจ (subscription) — โฟกัสอันนี้
- provider เปลี่ยนตาม **region** (setting ผู้ใช้) — TH ได้ Netflix/Prime/Disney+/Viu/TrueID

## แสดงในหน้า Detail

ส่วน "ดูได้ที่" — โลโก้ provider เรียงแนวนอน (logo จาก `image.tmdb.org` + `logo_path`)
แตะโลโก้ → เปิดลิงก์ด้วย `expo-web-browser`

## Affiliate — วิธีต่อยอด

TMDB **ไม่ได้ให้** affiliate link ตรงๆ — ต้องแมปเอง:

```ts
// src/utils/affiliate.ts
const AFFILIATE: Record<string, (title:string)=>string> = {
  Netflix: () => 'https://www.netflix.com/signup?ref=YOUR_TAG',
  'Amazon Prime Video': (t) => `https://www.primevideo.com/?tag=YOUR_TAG`,
  'Disney Plus': () => 'https://www.disneyplus.com/?cid=YOUR_TAG',
  // ...
};
export const affiliateUrl = (provider: string, title: string, fallback: string) =>
  AFFILIATE[provider]?.(title) ?? fallback;
```

- แต่ละค่ายมีโปรแกรม affiliate (Impact, CJ, Amazon Associates) → ได้ค่าคอมเมื่อคนสมัครผ่านลิงก์
- **ในงานเรียน:** ใส่ลิงก์ปกติ + โครง `?ref=` ไว้ก่อน พอโชว์ concept ได้ (ยังไม่ต้องสมัคร partner จริง)
- ปุ่ม "สมัคร Netflix" ในหน้า detail = affiliate CTA

## Flow

```
Detail → ส่วน "ดูได้ที่" → โลโก้ Netflix
   → affiliateUrl('Netflix', title, tmdbLink)
   → expo-web-browser เปิด → (ถ้าสมัคร) ได้ค่าคอม
```

## ข้อควรระวัง

- ต้องเลือก region ให้ถูก ไม่งั้น provider ว่าง
- บางเรื่องไม่มี provider (ยังไม่ลง streaming) → ซ่อนส่วนนี้ / โชว์ "ยังไม่มีช่องทางสตรีม"
