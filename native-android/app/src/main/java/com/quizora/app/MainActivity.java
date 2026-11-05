package com.quizora.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import android.text.InputType;
import android.graphics.drawable.GradientDrawable;

public class MainActivity extends Activity {
    private LinearLayout root;
    private EditText emailField, passwordField;
    private TextView message;
    private SupabaseAuth auth;
    private boolean registerMode = false;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        auth = new SupabaseAuth(this);
        showAuth();
    }

    private GradientDrawable shape(int color, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color); d.setCornerRadius(radius); return d;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value); t.setTextSize(size); t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private void showAuth() {
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL); root.setPadding(28, 40, 28, 24);
        root.setBackgroundColor(Color.rgb(247,249,253));
        ScrollView scroll = new ScrollView(this); scroll.addView(root);
        setContentView(scroll);

        TextView logo = text("Q", 34, Color.WHITE, true);
        logo.setGravity(Gravity.CENTER); logo.setBackground(shape(Color.rgb(36,87,214), 24));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(76,76); lp.bottomMargin=18; root.addView(logo,lp);
        TextView title=text("Quizora",30,Color.rgb(25,39,70),true); root.addView(title);
        TextView subtitle=text(registerMode ? "أنشئ حسابك وابدأ رحلتك التعليمية" : "سجّل دخولك للمتابعة",15,Color.GRAY,false);
        subtitle.setPadding(0,8,0,28); root.addView(subtitle);

        emailField = field("البريد الإلكتروني", false); root.addView(emailField);
        passwordField = field("كلمة المرور", true); root.addView(passwordField);
        message=text("",14,Color.rgb(190,45,45),false); message.setPadding(0,12,0,8); root.addView(message);

        Button submit = new Button(this); submit.setText(registerMode ? "إنشاء حساب" : "تسجيل الدخول");
        submit.setTextColor(Color.WHITE); submit.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(36,87,214)));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-1,56); bp.topMargin=12; root.addView(submit,bp);
        submit.setOnClickListener(v -> submitAuth());

        TextView switchMode=text(registerMode ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب",15,Color.rgb(36,87,214),true);
        switchMode.setPadding(0,24,0,10); switchMode.setOnClickListener(v->{registerMode=!registerMode;showAuth();}); root.addView(switchMode);
        TextView note=text("تطبيق Quizora الأصلي • يتطلب اتصالاً بالإنترنت",12,Color.GRAY,false);
        note.setPadding(0,24,0,0); root.addView(note);
    }

    private EditText field(String hint, boolean password) {
        EditText e=new EditText(this); e.setSingleLine(true); e.setHint(hint);
        e.setTextSize(16); e.setPadding(16,10,16,10); e.setBackground(shape(Color.WHITE,16));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,58); p.bottomMargin=12; e.setLayoutParams(p);
        if(password) e.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
        else e.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        return e;
    }

    private void submitAuth() {
        String email=emailField.getText().toString().trim();
        String password=passwordField.getText().toString();
        if(email.isEmpty() || password.length()<6) { message.setText("اكتب البريد وكلمة مرور من 6 أحرف على الأقل."); return; }
        message.setText("جارٍ الاتصال...");
        View current=root; 
        SupabaseAuth.Callback callback=new SupabaseAuth.Callback() {
            @Override public void onSuccess(org.json.JSONObject data) {
                runOnUiThread(()->{
                    if(registerMode && !data.has("access_token")) {
                        message.setTextColor(Color.rgb(30,130,70));
                        message.setText("تم إنشاء الحساب. راجع بريدك إذا كان تأكيد البريد مفعلاً.");
                    } else showHome();
                });
            }
            @Override public void onError(String error) { runOnUiThread(()->message.setText(error)); }
        };
        if(registerMode) auth.signUp(email,password,callback); else auth.signIn(email,password,callback);
    }

    private void showHome() {
        root.removeAllViews();
        TextView welcome=text("أهلاً بك في Quizora",26,Color.rgb(25,39,70),true);
        welcome.setPadding(0,40,0,18); root.addView(welcome);
        TextView info=text("تم تسجيل الدخول بنجاح. هذه أول نسخة من التطبيق الأصلي بلغة Java. سيتم ربط لوحات الطالب والمعلم والإدارة بعد مطابقة صلاحيات وقاعدة بيانات الموقع.",16,Color.DKGRAY,false);
        root.addView(info);
        Button logout=new Button(this); logout.setText("تسجيل الخروج"); root.addView(logout);
        logout.setOnClickListener(v->{auth.signOut();registerMode=false;showAuth();});
    }
}
