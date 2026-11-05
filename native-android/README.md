# Quizora Native Android (Java)

This is an isolated native Android client scaffold. It does not replace or modify the existing Next.js website or the existing Capacitor APK.

## Current milestone
- Native Android Activity and UI written in Java (no WebView).
- Supabase Auth REST integration for email/password sign-in and sign-up.
- Session tokens stored in private app SharedPreferences.
- HTTPS-only networking; no service-role key is included.
- Student/teacher/admin screens and exam workflows are intentionally not wired yet. They must be mapped against the real Supabase schema, RLS policies, and RPC functions before implementation.

## Configure Supabase
Create `native-android/local.properties` (do not commit it) with:
```properties
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```
Use the same public project URL and publishable/anon key already configured for the website. Never put a service_role/secret key in an Android app.

## Build
Open the `native-android` folder in Android Studio, allow Gradle sync, then Build > Build Bundle(s) / APK(s) > Build APK(s).

Requirements: Android Studio with Android SDK 35 and JDK 17.

## Important
This is milestone 1 (native app foundation + authentication). It is not yet a feature-complete replacement. Password reset, profile/role loading, exam listing, attempts, grading, teacher tools, admin tools, and push notifications remain to be implemented after schema and RPC review.
