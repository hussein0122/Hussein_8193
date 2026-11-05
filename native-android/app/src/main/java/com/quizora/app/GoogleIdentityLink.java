package com.quizora.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import okhttp3.*;
import org.json.JSONObject;

/** Supabase PKCE OAuth identity linking for the currently authenticated Quizora user. */
public final class GoogleIdentityLink {
    public interface Callback { void onSuccess(); void onError(String message); }
    private static final String REDIRECT = "com.quizora.app://oauth/callback";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final Context context;
    private final SharedPreferences prefs;
    private final OkHttpClient http = new OkHttpClient.Builder().followRedirects(false).followSslRedirects(false).build();

    public GoogleIdentityLink(Context c) {
        context = c.getApplicationContext();
        prefs = context.getSharedPreferences("quizora_session", Context.MODE_PRIVATE);
    }

    public void start(String accessToken, Callback callback) {
        try {
            String verifier = randomUrlSafe(64);
            String challenge = base64Url(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));
            String state = randomUrlSafe(32);
            prefs.edit().putString("google_link_verifier", verifier).putString("google_link_state", state).apply();
            HttpUrl url = HttpUrl.parse(BuildConfig.SUPABASE_URL.replaceAll("/+$", "") + "/auth/v1/user/identities/authorize")
                .newBuilder().addQueryParameter("provider", "google")
                .addQueryParameter("redirect_to", REDIRECT)
                .addQueryParameter("code_challenge", challenge)
                .addQueryParameter("code_challenge_method", "s256")
                .addQueryParameter("state", state).build();
            Request request = new Request.Builder().url(url).header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                .header("Authorization", "Bearer " + accessToken).get().build();
            http.newCall(request).enqueue(new okhttp3.Callback() {
                @Override public void onFailure(Call call, IOException e) { callback.onError("تعذر الاتصال بخدمة Google. تحقق من الإنترنت."); }
                @Override public void onResponse(Call call, Response response) throws IOException {
                    String location = response.header("Location");
                    if (!response.isSuccessful() && response.code() != 302 && response.code() != 303) {
                        String raw = response.body() == null ? "" : response.body().string();
                        callback.onError("Supabase رفض بدء الربط (" + response.code() + "): " + raw);
                        return;
                    }
                    if (location == null) { callback.onError("لم يرجع Supabase رابط Google. راجع إعدادات OAuth."); return; }
                    try {
                        Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse(location));
                        browser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(browser);
                        callback.onSuccess();
                    } catch (Exception e) { callback.onError("تعذر فتح صفحة Google على الجهاز."); }
                }
            });
        } catch (Exception e) { callback.onError("تعذر تجهيز حماية OAuth PKCE."); }
    }

    public void complete(String authCode, String returnedState, Callback callback) {
        String verifier = prefs.getString("google_link_verifier", "");
        String expectedState = prefs.getString("google_link_state", "");
        if (expectedState.isEmpty() || returnedState == null || !expectedState.equals(returnedState)) { callback.onError("فشل التحقق الأمني من طلب الربط. أعد المحاولة."); return; }
        if (verifier.isEmpty()) { callback.onError("انتهت جلسة الربط. ابدأ الربط من جديد."); return; }
        JSONObject body = new JSONObject();
        try { body.put("auth_code", authCode); body.put("code_verifier", verifier); }
        catch (Exception e) { callback.onError("بيانات التحقق غير صالحة."); return; }
        Request request = new Request.Builder()
            .url(BuildConfig.SUPABASE_URL.replaceAll("/+$", "") + "/auth/v1/token?grant_type=pkce")
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .header("Content-Type", "application/json")
            .post(RequestBody.create(body.toString(), JSON)).build();
        http.newCall(request).enqueue(new okhttp3.Callback() {
            @Override public void onFailure(Call call, IOException e) { callback.onError("تعذر الاتصال لإكمال الربط."); }
            @Override public void onResponse(Call call, Response response) throws IOException {
                String raw = response.body() == null ? "{}" : response.body().string();
                try {
                    JSONObject result = new JSONObject(raw);
                    if (!response.isSuccessful()) {
                        callback.onError(result.optString("msg", result.optString("message", "فشل التحقق من Google")));
                        return;
                    }
                    String expectedUser = prefs.getString("user_id", "");
                    String returnedUser = result.optJSONObject("user") == null ? "" : result.optJSONObject("user").optString("id");
                    if (!expectedUser.isEmpty() && !returnedUser.isEmpty() && !expectedUser.equals(returnedUser)) {
                        callback.onError("توقف الربط لحماية حسابك: الاستجابة تخص مستخدماً مختلفاً.");
                        return;
                    }
                    String access = result.optString("access_token", "");
                    String refresh = result.optString("refresh_token", "");
                    if (access.isEmpty() || refresh.isEmpty()) { callback.onError("لم يرجع Supabase جلسة صالحة بعد الربط."); return; }
                    prefs.edit().putString("access_token", access).putString("refresh_token", refresh)
                        .remove("google_link_verifier").remove("google_link_state").apply();
                    callback.onSuccess();
                } catch (Exception e) { callback.onError("استجابة غير مفهومة من Supabase."); }
            }
        });
    }

    private static String randomUrlSafe(int bytes) {
        byte[] value = new byte[bytes]; new SecureRandom().nextBytes(value); return base64Url(value);
    }
    private static String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}
