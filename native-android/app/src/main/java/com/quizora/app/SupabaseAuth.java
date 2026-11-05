package com.quizora.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.io.IOException;
import okhttp3.*;

public final class SupabaseAuth {
    public interface Callback {
        void onSuccess(JSONObject data);
        void onError(String message);
    }

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final OkHttpClient client = new OkHttpClient();
    private final Context context;

    public SupabaseAuth(Context context) { this.context = context.getApplicationContext(); }

    public boolean isConfigured() {
        return !BuildConfig.SUPABASE_URL.isEmpty() && !BuildConfig.SUPABASE_ANON_KEY.isEmpty();
    }

    public void signIn(String email, String password, Callback callback) {
        JSONObject body = new JSONObject();
        try { body.put("email", email); body.put("password", password); }
        catch (Exception e) { callback.onError("بيانات الدخول غير صالحة"); return; }
        request("/auth/v1/token?grant_type=password", body, callback, true);
    }

    public void signUp(String email, String password, String fullName, Callback callback) {
        JSONObject body = new JSONObject();
        try {
            body.put("email", email);
            body.put("password", password);
            JSONObject metadata = new JSONObject();
            metadata.put("full_name", fullName);
            body.put("data", metadata);
        } catch (Exception e) { callback.onError("البيانات غير صالحة"); return; }
        request("/auth/v1/signup", body, callback, true);
    }

    private void request(String path, JSONObject body, Callback callback, boolean saveSession) {
        if (!isConfigured()) { callback.onError("إعدادات Supabase غير موجودة. راجع ملف الإعداد."); return; }
        String base = BuildConfig.SUPABASE_URL.replaceAll("/+$", "");
        Request request = new Request.Builder()
            .url(base + path)
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .header("Content-Type", "application/json")
            .post(RequestBody.create(body.toString(), JSON))
            .build();
        client.newCall(request).enqueue(new okhttp3.Callback() {
            @Override public void onFailure(Call call, IOException e) { callback.onError("تعذر الاتصال. تحقق من الإنترنت وحاول مجدداً."); }
            @Override public void onResponse(Call call, Response response) throws IOException {
                String raw = response.body() == null ? "{}" : response.body().string();
                try {
                    JSONObject result = new JSONObject(raw);
                    if (!response.isSuccessful()) {
                        String message = result.optString("msg", result.optString("message", result.optString("error_description", "تعذر إتمام العملية")));
                        callback.onError(message);
                        return;
                    }
                    if (saveSession && result.has("access_token")) {
                        SharedPreferences prefs = context.getSharedPreferences("quizora_session", Context.MODE_PRIVATE);
                        prefs.edit().putString("access_token", result.optString("access_token"))
                            .putString("refresh_token", result.optString("refresh_token"))
                            .putString("user_id", result.optJSONObject("user") == null ? "" : result.optJSONObject("user").optString("id"))
                            .apply();
                    }
                    callback.onSuccess(result);
                } catch (Exception e) { callback.onError("استجابة غير مفهومة من الخادم."); }
            }
        });
    }

    public void signOut() {
        context.getSharedPreferences("quizora_session", Context.MODE_PRIVATE).edit().clear().apply();
    }
}
