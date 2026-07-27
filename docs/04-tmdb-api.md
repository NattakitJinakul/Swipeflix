# 04 — TMDB API

## สมัคร key

1. สมัคร https://www.themoviedb.org/signup
2. Settings → API → ขอ key (เลือก Developer, ฟรี)
3. ได้ 2 แบบ: **API Key (v3 auth)** และ **API Read Access Token (v4, Bearer)** — ใช้ Bearer token สะดวกกว่า
4. เก็บใน `.env` (อย่า commit): `EXPO_PUBLIC_TMDB_TOKEN=...`

> ⚠️ TMDB บังคับแสดงเครดิต: "This product uses the TMDB API but is not endorsed or certified by TMDB" + โลโก้ → ใส่ในหน้า Profile/About

## Base

- API base: `https://api.themoviedb.org/3`
- Image base: `https://image.tmdb.org/t/p/{size}{path}`
  - poster: `w500` · backdrop: `w780`/`original` · profile(นักแสดง): `w185`
- Header: `Authorization: Bearer <token>`, `accept: application/json`
- ภาษา/ภูมิภาค: `?language=th-TH&region=TH` (ปรับตาม setting)

## Endpoint ที่ใช้

| หน้าจอ | Endpoint | หมายเหตุ |
|--------|----------|---------|
| Swipe deck | `GET /discover/movie?sort_by=popularity.desc&page=N&with_genres=` | กรอง genre ได้ |
| Swipe (ง่าย) | `GET /movie/popular?page=N` | ทางเลือก |
| Genre list | `GET /genre/movie/list` | map id→ชื่อ (cache) |
| Trending | `GET /trending/movie/week` | หน้า Discover |
| Search | `GET /search/movie?query=` | debounce |
| **Detail** | `GET /movie/{id}?append_to_response=credits,videos,recommendations,watch/providers` | **1 request ได้ครบ** |

## Field mapping (Detail)

| แสดงในแอป | JSON path |
|-----------|-----------|
| ชื่อ / ปี | `title` / `release_date` |
| เรตติ้ง | `vote_average` |
| แนวหนัง | `genres[].name` |
| ความยาว | `runtime` (นาที → `2h 35m`) |
| เรื่องย่อ | `overview` |
| นักแสดง | `credits.cast[]` (`name`, `character`, `profile_path`) — เอา 10 ตัวแรก |
| ผู้กำกับ | `credits.crew[]` where `job === 'Director'` |
| ค่าย | `production_companies[].name` |
| Trailer | `videos.results[]` where `site==='YouTube' && type==='Trailer'` → `key` (เล่นด้วย `react-native-youtube-iframe`) |
| หนังเกี่ยวข้อง | `recommendations.results[]` (+ `belongs_to_collection` สำหรับภาคต่อ) |
| ช่องทางดู | `watch/providers.results.{region}.flatrate[]` → ดู [05-affiliate.md](./05-affiliate.md) |

## ตัวอย่าง wrapper

```ts
// src/api/tmdb.ts
const BASE = 'https://api.themoviedb.org/3';
const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN!;

export async function tmdb<T>(path: string, params: Record<string,string|number> = {}) {
  const url = new URL(BASE + path);
  Object.entries({ language: 'th-TH', ...params }).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' } });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

export const img = (path: string | null, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
```

## Trailer (สำคัญ — อย่าใช้ expo-video)

`expo-video` เล่น YouTube ไม่ได้. ใช้ **`react-native-youtube-iframe`**:

```bash
npx expo install react-native-youtube-iframe react-native-webview
```

```tsx
import YoutubePlayer from 'react-native-youtube-iframe';
<YoutubePlayer height={220} videoId={trailerKey} />
```

- หา key: `videos.results.find(v => v.site==='YouTube' && v.type==='Trailer')?.key`
- ไม่มี trailer → ซ่อนส่วนนี้

## ภาษา + fallback (บังคับแจ้ง user)

TMDB ข้อมูลไทยบาง — `overview` ภาษาไทยหลายเรื่องว่าง.

**กติกา:**
1. เรียกด้วยภาษาที่ user เลือก (`language=th-TH`)
2. ถ้า `overview` ว่าง → เรียกซ้ำด้วย `en-US` (หรือใช้ param `include_image_language`)
3. **แจ้ง user** ว่าเนื้อหาเป็นภาษาอังกฤษ — โชว์ badge เล็ก "🌐 EN" / "แสดงเป็นภาษาอังกฤษ" ในส่วนที่ fallback

```ts
async function getOverview(id: number, lang: string) {
  const th = await tmdb<MovieDetail>(`/movie/${id}`, { language: lang });
  if (th.overview?.trim()) return { text: th.overview, fallback: false };
  const en = await tmdb<MovieDetail>(`/movie/${id}`, { language: 'en-US' });
  return { text: en.overview, fallback: true };   // fallback=true → โชว์ badge EN
}
```

- ภาษา/ภูมิภาค ตั้งได้ตั้งแต่ **onboarding** + เปลี่ยนใน settings ([10](./10-profile-settings.md))

## Rate limit

~50 req/s — เกินพอ. ควรแคช genre list + prefetch รูปการ์ดถัดไป
