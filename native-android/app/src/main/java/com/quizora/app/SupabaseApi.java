package com.quizora.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.*;
import java.io.IOException;
import okhttp3.*;

public final class SupabaseApi {
    public interface Result { void done(JSONArray rows, JSONObject object, String error); }
    private final OkHttpClient http=new OkHttpClient();
    private final SharedPreferences prefs;
    private final String base=BuildConfig.SUPABASE_URL.replaceAll("/+$","");
    private final String key=BuildConfig.SUPABASE_ANON_KEY;
    public SupabaseApi(Context c){prefs=c.getSharedPreferences("quizora_session",Context.MODE_PRIVATE);}
    public String token(){return prefs.getString("access_token","");}
    public String userId(){return prefs.getString("user_id","");}
    public void clear(){prefs.edit().clear().apply();}
    public void get(String table,String query,Result cb){call("GET","/rest/v1/"+table+"?"+query,null,cb);}
    public void insert(String table,JSONObject body,Result cb){call("POST","/rest/v1/"+table,body,cb);}
    public void patch(String table,String query,JSONObject body,Result cb){call("PATCH","/rest/v1/"+table+"?"+query,body,cb);}
    public void delete(String table,String query,Result cb){call("DELETE","/rest/v1/"+table+"?"+query,null,cb);}
    public void rpc(String fn,JSONObject body,Result cb){call("POST","/rest/v1/rpc/"+fn,body,cb);}
    private void call(String method,String path,JSONObject body,Result cb){
        if(base.isEmpty()||key.isEmpty()){cb.done(null,null,"إعدادات الاتصال بقاعدة البيانات غير مضبوطة.");return;}
        Request.Builder b=new Request.Builder().url(base+path).header("apikey",key).header("Authorization","Bearer "+token()).header("Accept","application/json");
        if(body!=null)b.header("Content-Type","application/json").header("Prefer","return=representation");
        RequestBody rb=body==null?null:RequestBody.create(body.toString(),MediaType.get("application/json; charset=utf-8"));
        switch(method){case "POST":b.post(rb);break;case "PATCH":b.patch(rb);break;case "DELETE":b.delete();break;default:b.get();}
        http.newCall(b.build()).enqueue(new okhttp3.Callback(){
            public void onFailure(Call c,IOException e){cb.done(null,null,"تعذر الاتصال بالإنترنت.");}
            public void onResponse(Call c,Response r)throws IOException{
                String raw=r.body()==null?"":r.body().string();
                if(!r.isSuccessful()){String err=raw;try{JSONObject j=new JSONObject(raw);err=j.optString("message",j.optString("hint",j.optString("error",raw)));}catch(Exception ignored){}cb.done(null,null,err);return;}
                try{
                    if(raw.isEmpty()){cb.done(new JSONArray(),null,null);return;}
                    if(raw.startsWith("["))cb.done(new JSONArray(raw),null,null);
                    else if(raw.startsWith("{"))cb.done(null,new JSONObject(raw),null);
                    else if(raw.startsWith("\\""))cb.done(null,new JSONObject().put("value",new JSONArray("["+raw+"]").optString(0)),null);
                    else cb.done(null,new JSONObject().put("value",raw),null);
                }catch(Exception e){cb.done(null,null,"تعذر قراءة استجابة الخادم.");}
            }
        });
    }
}
