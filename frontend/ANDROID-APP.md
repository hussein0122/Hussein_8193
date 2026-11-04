# Quizora Android APK

The Android shell uses Capacitor and opens the live Quizora website:
https://hussein-exam-platform.vercel.app

This keeps authentication, Supabase data, and site updates on the existing web app. An internet connection is required; this is not an offline edition.

## Build the APK

1. Open the repository on GitHub.
2. Go to **Actions** → **Build Quizora Android APK**.
3. Select **Run workflow**.
4. When the run succeeds, open it and download the **Quizora-Android-APK** artifact.
5. Extract the ZIP and install `app-debug.apk` on Android. Allow installation from that source when Android asks.

The workflow builds a debug APK for testing and direct distribution. A signed release APK/AAB for Google Play requires a separately configured signing key; do not commit that key to the repository.
