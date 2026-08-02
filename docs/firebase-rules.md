# Firebase setup — rules to paste (for Community + avatar upload)

App: Swipeplay (IGDB game app). Community lets users view each other's public profiles;
avatars can be uploaded. That needs Firestore + Storage enabled with these rules.

## 1) Firebase Console → Authentication
- Sign-in method → enable **Email/Password** (and **Google** if you want the Google button on web/dev builds).

## 2) Firestore Database → Create database (production mode) → Rules → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      // Public profile is readable by anyone (Community browsing).
      allow read: if true;
      // Only the owner can create/update/delete their own doc.
      allow write: if request.auth != null && request.auth.uid == uid;

      // Per-user library (liked / played / disliked) — private to the owner.
      match /{sub}/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

> If you prefer stricter privacy, replace `allow read: if true;` with
> `allow read: if request.auth != null;` (only signed-in users can browse Community).

## 3) Storage → Get started → Rules → paste (for avatar photos):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{uid}.jpg {
      // Anyone can view an avatar; only the owner can upload/replace theirs.
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Notes
- The app never crashes if these aren't set up yet — Community shows an empty state and
  avatar upload fails gracefully. But data won't persist / other players won't appear until
  Firestore (and Storage for photos) are enabled with the rules above.
- Config values are already in `.env` (`EXPO_PUBLIC_FIREBASE_*`). No secrets in the repo.
