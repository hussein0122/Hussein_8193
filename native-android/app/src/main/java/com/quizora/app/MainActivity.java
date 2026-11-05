package com.quizora.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import android.os.CountDownTimer;
import android.text.InputType;
import org.json.*;

public class MainActivity extends Activity {
 private LinearLayout root,body; private SupabaseApi db; private String role="STUDENT",name="",attemptId="",examId=""; private String signupRole="STUDENT";
 private int blue=Color.rgb(36,87,214),ink=Color.rgb(25,39,70); private JSONArray currentQuestions=new JSONArray(); private CountDownTimer examTimer; private TextView timerView; private boolean inExam=false; private long examMillis=0;
 @Override public void onCreate(Bundle b){super.onCreate(b);db=new SupabaseApi(this);if(db.token().isEmpty())authScreen();else loadProfile();handleGoogleCallback(getIntent()==null?null:getIntent().getData());}
 private GradientDrawable bg(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(r);return d;}
 private TextView txt(String s,int z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(null,Typeface.BOLD);t.setGravity(Gravity.RIGHT);t.setTextDirection(View.TEXT_DIRECTION_RTL);return t;}
 private EditText field(String hint,boolean pass){EditText e=new EditText(this);e.setHint(hint);e.setSingleLine(!hint.contains("وصف")&&!hint.contains("السؤال"));e.setTextSize(15);e.setPadding(15,8,15,8);e.setBackground(bg(Color.WHITE,16));if(pass)e.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=10;e.setLayoutParams(p);return e;}
 private void base(String title){
  ScrollView sc=new ScrollView(this);root=new LinearLayout(this);root.setOrientation(1);root.setPadding(18,18,18,28);root.setBackgroundColor(Color.rgb(245,247,251));sc.addView(root);setContentView(sc);
  LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);header.setPadding(14,12,14,12);header.setBackground(bg(Color.WHITE,20));
  TextView mark=txt("🎓",23,Color.WHITE,true);mark.setGravity(Gravity.CENTER);mark.setBackground(bg(blue,15));LinearLayout.LayoutParams mp=new LinearLayout.LayoutParams(48,48);mp.setMargins(0,0,12,0);header.addView(mark,mp);
  LinearLayout brandBox=new LinearLayout(this);brandBox.setOrientation(1);TextView brand=txt("Quizora",19,ink,true);brand.setGravity(Gravity.RIGHT);TextView sub=txt("التعليم والاختبارات",11,Color.rgb(100,116,139),false);sub.setGravity(Gravity.RIGHT);brandBox.addView(brand);brandBox.addView(sub);header.addView(brandBox);
  root.addView(header);
  LinearLayout hero=new LinearLayout(this);hero.setOrientation(1);hero.setPadding(20,22,20,22);GradientDrawable heroBg=new GradientDrawable(GradientDrawable.Orientation.RIGHT_LEFT,new int[]{Color.rgb(23,37,84),Color.rgb(30,64,145),Color.rgb(49,87,213)});heroBg.setCornerRadius(26);hero.setBackground(heroBg);
  TextView h=txt(title,23,Color.WHITE,true);h.setPadding(0,0,0,8);hero.addView(h);
  TextView tagline=txt("منصة تجمع الامتحانات الإلكترونية ومتابعة النتائج وإدارة المحتوى التعليمي.",13,Color.rgb(219,231,255),false);tagline.setGravity(Gravity.RIGHT);hero.addView(tagline);
  LinearLayout.LayoutParams hp=new LinearLayout.LayoutParams(-1,-2);hp.topMargin=14;hp.bottomMargin=14;root.addView(hero,hp);
  body=new LinearLayout(this);body.setOrientation(1);body.setPadding(16,16,16,16);body.setBackground(bg(Color.WHITE,24));LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,-2);bp.topMargin=4;root.addView(body,bp);
 }
 private void addText(LinearLayout box,String s,int size,boolean bold){TextView t=txt(s,size,ink,bold);t.setPadding(0,8,0,8);box.addView(t);}
 private Button btn(LinearLayout box,String s,Runnable action){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setAllCaps(false);b.setBackground(bg(blue,16));b.setPadding(18,12,18,12);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=8;box.addView(b,p);b.setOnClickListener(v->action.run());return b;}
 private void msg(String s){Toast.makeText(this,s,Toast.LENGTH_LONG).show();}
 private JSONObject obj(String... kv){JSONObject j=new JSONObject();try{for(int i=0;i+1<kv.length;i+=2)j.put(kv[i],kv[i+1]);}catch(Exception ignored){}return j;}
 private void authScreen(){
  base("اختباراتك ودراستك في مكان واحد");
  addText(body,"منصة تجمع الامتحانات الإلكترونية ومتابعة النتائج وإدارة المحتوى التعليمي.",15,false);
  LinearLayout card=new LinearLayout(this);card.setOrientation(1);card.setPadding(18,18,18,18);card.setBackground(bg(Color.WHITE,24));
  LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.topMargin=14;body.addView(card,cp);
  addText(card,"تسجيل الدخول أو إنشاء حساب",19,true);
  EditText fullName=field("الاسم بالكامل (للحساب الجديد)",false);
  EditText email=field("البريد الإلكتروني",false),pass=field("كلمة المرور",true);
  card.addView(fullName);card.addView(email);card.addView(pass);
  addText(card,"نوع الحساب عند التسجيل",14,true);
  RadioGroup accountType=new RadioGroup(this);accountType.setOrientation(RadioGroup.HORIZONTAL);
  RadioButton student=new RadioButton(this);student.setText("طالب");student.setId(201);student.setChecked(true);
  RadioButton teacher=new RadioButton(this);teacher.setText("معلم (يتطلب اعتماد الإدارة)");teacher.setId(202);
  accountType.addView(student);accountType.addView(teacher);card.addView(accountType);
  btn(card,"تسجيل الدخول",()->{if(email.getText().toString().trim().isEmpty()||pass.getText().length()<6){msg("أدخل البريد وكلمة المرور بشكل صحيح");return;}auth(email.getText().toString().trim(),pass.getText().toString(),"",false,"STUDENT");});
  btn(card,"إنشاء حساب جديد",()->{String n=fullName.getText().toString().trim(),em=email.getText().toString().trim();if(n.length()<2||em.isEmpty()||pass.getText().length()<8){msg("اكتب الاسم والبريد، واجعل كلمة المرور 8 أحرف على الأقل");return;}String chosen=accountType.getCheckedRadioButtonId()==202?"TEACHER":"STUDENT";auth(em,pass.getText().toString(),n,true,chosen);});
  btn(card,"نسيت كلمة المرور؟",()->resetPassword(email.getText().toString().trim()));
  addText(body,"بياناتك محفوظة على نفس حساب Quizora المستخدم في الموقع.",12,false);
  addText(body,"مميزات المنصة",18,true);
  LinearLayout feature1=new LinearLayout(this);feature1.setOrientation(1);feature1.setPadding(14,12,14,12);feature1.setBackground(bg(Color.rgb(239,244,255),18));addText(feature1,"📘 اختبارات منظمة",15,true);addText(feature1,"امتحانات بمدة محددة وأسئلة مرتبة ونتائج محفوظة.",13,false);body.addView(feature1);
  LinearLayout feature2=new LinearLayout(this);feature2.setOrientation(1);feature2.setPadding(14,12,14,12);feature2.setBackground(bg(Color.rgb(239,244,255),18));addText(feature2,"🛡️ نزاهة الامتحان",15,true);addText(feature2,"تسجيل مغادرة شاشة الامتحان والتنبيه عند تكرار المخالفة.",13,false);body.addView(feature2);
  LinearLayout feature3=new LinearLayout(this);feature3.setOrientation(1);feature3.setPadding(14,12,14,12);feature3.setBackground(bg(Color.rgb(239,244,255),18));addText(feature3,"📊 متابعة الأداء",15,true);addText(feature3,"سجل للمحاولات والدرجات لمتابعة تقدمك الدراسي.",13,false);body.addView(feature3);
 }
 private void auth(String email,String password,String fullName,boolean signup,String requestedRole){
  SupabaseAuth service=new SupabaseAuth(this);
  signupRole=requestedRole;
  SupabaseAuth.Callback cb=new SupabaseAuth.Callback(){
   public void onSuccess(JSONObject data){runOnUiThread(()->{
    if(signup&&!data.has("access_token")){msg("تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.");return;}
    if(signup&&"TEACHER".equals(requestedRole)){
     db.insert("teacher_requests",obj("user_id",data.optJSONObject("user")==null?"":data.optJSONObject("user").optString("id"),"note","طلب تفعيل حساب معلم"),(rows,o,e)->runOnUiThread(()->{if(e!=null)msg("تم إنشاء الحساب، لكن تعذر إرسال طلب اعتماد المعلم: "+e);else msg("تم إنشاء الحساب وإرسال طلب اعتماد المعلم للإدارة.");loadProfile();}));
    } else loadProfile();
   });}
   public void onError(String error){runOnUiThread(()->msg(error));}
  };
  if(signup)service.signUp(email,password,fullName,cb);else service.signIn(email,password,cb);
 }
 private void resetPassword(String email){if(email.isEmpty()){msg("اكتب بريدك الإلكتروني أولاً");return;}new Thread(()->{try{okhttp3.OkHttpClient c=new okhttp3.OkHttpClient();okhttp3.Request r=new okhttp3.Request.Builder().url(BuildConfig.SUPABASE_URL+"/auth/v1/recover").header("apikey",BuildConfig.SUPABASE_ANON_KEY).post(okhttp3.RequestBody.create(obj("email",email).toString(),okhttp3.MediaType.get("application/json"))).build();okhttp3.Response x=c.newCall(r).execute();runOnUiThread(()->msg(x.isSuccessful()?"تم إرسال رابط استعادة كلمة المرور إلى بريدك":"تعذر إرسال رابط الاستعادة"));}catch(Exception e){runOnUiThread(()->msg("تحقق من الإنترنت"));}}).start();}
 private void loadProfile(){db.get("profiles","select=id,full_name,role&id=eq."+db.userId(),(rows,o,e)->runOnUiThread(()->{if(e!=null||rows==null||rows.length()==0){db.clear();authScreen();return;}JSONObject p=rows.optJSONObject(0);role=p.optString("role","STUDENT");name=p.optString("full_name","");dashboard();}));}
 private void dashboard(){base("أهلاً "+name);addText(body,"نوع الحساب: "+role,14,false);
  if(role.equals("STUDENT")){btn(body,"الامتحانات المتاحة",this::studentExams);btn(body,"سجل النتائج",this::history);btn(body,"طلب تفعيل حساب معلم",this::teacherRequest);}
  if(role.equals("TEACHER")){btn(body,"إدارة المواد",this::subjects);btn(body,"إنشاء امتحان",this::createExam);btn(body,"امتحاناتي والنتائج",this::teacherExams);}
  if(role.equals("ADMIN")){btn(body,"طلبات تفعيل المعلمين",this::adminRequests);btn(body,"المستخدمون",this::users);}
  btn(body,"ربط حساب Google",this::linkGoogle);btn(body,"تعديل الاسم",this::editName);btn(body,"تسجيل الخروج",()->{db.clear();authScreen();});
 }

 private void linkGoogle(){
  if(db.token().isEmpty()){msg("سجّل الدخول أولاً");return;}
  GoogleIdentityLink link=new GoogleIdentityLink(this);
  link.start(db.token(),new GoogleIdentityLink.Callback(){
   public void onSuccess(){runOnUiThread(()->msg("جاري فتح صفحة Google لإتمام الربط"));}
   public void onError(String error){runOnUiThread(()->msg(error));}
  });
 }
 private void handleGoogleCallback(Uri uri){
  if(uri==null||!"com.quizora.app".equals(uri.getScheme())||!"oauth".equals(uri.getHost()))return;
  String error=uri.getQueryParameter("error_description");
  if(error==null)error=uri.getQueryParameter("error");
  if(error!=null){msg("لم يكتمل ربط Google: "+error);return;}
  String code=uri.getQueryParameter("code");
  if(code==null||code.isEmpty()){msg("لم يصل رمز تأكيد Google");return;}
  new GoogleIdentityLink(this).complete(code,uri.getQueryParameter("state"),new GoogleIdentityLink.Callback(){
   public void onSuccess(){runOnUiThread(()->{msg("تم ربط حساب Google بحساب Quizora بنجاح");dashboard();});}
   public void onError(String e){runOnUiThread(()->msg("تعذر إكمال الربط: "+e));}
  });
 }
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);handleGoogleCallback(intent.getData());}
 private void studentExams(){base("الامتحانات المتاحة");db.get("quizzes","select=id,title,description,duration_minutes,subject_id&published=eq.true&order=created_at.desc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}if(a.length()==0)addText(body,"لا توجد امتحانات منشورة حالياً",15,false);for(int i=0;i<a.length();i++){JSONObject q=a.optJSONObject(i);btn(body,q.optString("title")+" • "+q.optInt("duration_minutes")+" دقيقة",()->startExam(q));}}));btn(body,"رجوع",this::dashboard);}
 private void startExam(JSONObject q){examId=q.optString("id");examMillis=Math.max(1,q.optInt("duration_minutes",30))*60L*1000L;JSONObject p=new JSONObject();try{p.put("exam_id",examId);}catch(Exception ignored){}db.rpc("start_exam",p,(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}attemptId=o!=null?o.optString("value"):a!=null?a.optString(0):"";loadQuestions();}));}
 private void loadQuestions(){inExam=true;startTimer();db.get("questions","select=id,body,points,question_type,sort_order&quiz_id=eq."+examId+"&order=sort_order.asc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}currentQuestions=a;renderQuestion(0);}));}
 private void renderQuestion(int index){base("حل الامتحان");timerView=txt("الوقت المتبقي",16,blue,true);timerView.setPadding(0,8,0,8);body.addView(timerView);if(index>=currentQuestions.length()){btn(body,"تسليم الامتحان",this::submitExam);return;}JSONObject q=currentQuestions.optJSONObject(index);String qid=q.optString("id");addText(body,(index+1)+". "+q.optString("body"),18,true);
  if(!q.optString("question_type","MCQ").equals("MCQ")){addText(body,"هذا النوع من الأسئلة غير مدعوم حالياً في التطبيق؛ يمكنك إكماله من الموقع.",14,false);btn(body,"التالي",()->renderQuestion(index+1));return;}
  db.get("options","select=id,body&question_id=eq."+qid+"&order=sort_order.asc",(opts,x,err)->runOnUiThread(()->{if(err!=null){msg(err);return;}RadioGroup group=new RadioGroup(this);group.setOrientation(1);for(int k=0;k<opts.length();k++){JSONObject op=opts.optJSONObject(k);RadioButton rb=new RadioButton(this);rb.setText(op.optString("body"));rb.setTextSize(16);rb.setTag(op.optString("id"));rb.setId(View.generateViewId());group.addView(rb);}body.addView(group);btn(body,"حفظ الإجابة",()->{int checked=group.getCheckedRadioButtonId();if(checked==-1){msg("اختر إجابة");return;}RadioButton rb=group.findViewById(checked);JSONObject args=new JSONObject();try{args.put("attempt_id",attemptId);args.put("question_id",qid);args.put("option_id",rb.getTag().toString());}catch(Exception ignored){}db.rpc("save_mcq_answer",args,(r,z,er)->runOnUiThread(()->{if(er!=null)msg(er);else renderQuestion(index+1);}));});}));}
 private void submitExam(){inExam=false;if(examTimer!=null)examTimer.cancel();JSONObject p=new JSONObject();try{p.put("attempt_id",attemptId);}catch(Exception ignored){}db.rpc("submit_exam",p,(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}base("تم تسليم الامتحان");addText(body,"درجتك: "+(o==null?"—":o.optString("value")),24,true);btn(body,"العودة للرئيسية",this::dashboard);}));}
 private void history(){base("سجل النتائج");db.get("exam_attempts","select=id,exam_id,status,score,submitted_at&student_id=eq."+db.userId()+"&order=started_at.desc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);addText(body,"الحالة: "+x.optString("status")+"  •  الدرجة: "+x.optString("score","لم تسلم"),15,true);}}));btn(body,"رجوع",this::dashboard);}
 private void teacherRequest(){base("طلب تفعيل معلم");EditText note=field("اكتب نبذة عنك (اختياري)",false);body.addView(note);btn(body,"إرسال الطلب",()->{JSONObject j=new JSONObject();try{j.put("user_id",db.userId());j.put("note",note.getText().toString());}catch(Exception ignored){}db.insert("teacher_requests",j,(a,o,e)->runOnUiThread(()->msg(e==null?"تم إرسال طلبك للإدارة":e)));});btn(body,"رجوع",this::dashboard);}
 private void subjects(){base("المواد الدراسية");EditText n=field("اسم المادة",false),d=field("وصف المادة",false);body.addView(n);body.addView(d);btn(body,"إضافة مادة",()->{JSONObject j=new JSONObject();try{j.put("name",n.getText().toString());j.put("description",d.getText().toString());j.put("teacher_id",db.userId());}catch(Exception ignored){}db.insert("subjects",j,(a,o,e)->runOnUiThread(()->msg(e==null?"تمت إضافة المادة":e)));});db.get("subjects","select=id,name,description&teacher_id=eq."+db.userId(),(a,o,e)->runOnUiThread(()->{if(a!=null)for(int i=0;i<a.length();i++)addText(body,a.optJSONObject(i).optString("name"),16,true);}));btn(body,"رجوع",this::dashboard);}
 private void createExam(){base("إنشاء امتحان");EditText title=field("عنوان الامتحان",false),desc=field("الوصف",false),duration=field("المدة بالدقائق",false);duration.setInputType(InputType.TYPE_CLASS_NUMBER);body.addView(title);body.addView(desc);body.addView(duration);
  db.get("subjects","select=id,name&teacher_id=eq."+db.userId(),(a,o,e)->runOnUiThread(()->{if(a==null||a.length()==0){msg("أضف مادة أولاً");return;}String[] names=new String[a.length()];String[] ids=new String[a.length()];for(int i=0;i<a.length();i++){names[i]=a.optJSONObject(i).optString("name");ids[i]=a.optJSONObject(i).optString("id");}Spinner sp=new Spinner(this);sp.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,names));body.addView(sp);btn(body,"إنشاء الامتحان",()->{JSONObject j=new JSONObject();try{j.put("title",title.getText().toString());j.put("description",desc.getText().toString());j.put("duration_minutes",Math.max(1,Integer.parseInt(duration.getText().toString())));j.put("subject_id",ids[sp.getSelectedItemPosition()]);j.put("created_by",db.userId());j.put("published",false);}catch(Exception ex){msg("أكمل البيانات بشكل صحيح");return;}db.insert("quizzes",j,(rows,ob,er)->runOnUiThread(()->{if(er!=null)msg(er);else{String id=ob!=null?ob.optString("id"):rows!=null?rows.optJSONObject(0).optString("id"):"";addQuestion(id);}}));});}));btn(body,"رجوع",this::dashboard);}
 private void addQuestion(String quiz){base("إضافة سؤال");EditText question=field("نص السؤال",false),a=field("الاختيار الأول",false),b=field("الاختيار الثاني",false),c=field("الاختيار الثالث",false),d=field("الاختيار الرابع",false);body.addView(question);body.addView(a);body.addView(b);body.addView(c);body.addView(d);String[] correct={"0"};RadioGroup rg=new RadioGroup(this);for(int i=0;i<4;i++){RadioButton rb=new RadioButton(this);rb.setText("الاختيار "+(i+1)+" صحيح");rb.setId(100+i);rg.addView(rb);}rg.check(100);body.addView(rg);
  btn(body,"حفظ السؤال",()->{JSONObject j=new JSONObject();try{j.put("quiz_id",quiz);j.put("body",question.getText().toString());j.put("question_type","MCQ");j.put("points",1);j.put("sort_order",0);}catch(Exception ignored){}db.insert("questions",j,(r,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}String qid=o!=null?o.optString("id"):r.optJSONObject(0).optString("id");EditText[] fs={a,b,c,d};for(int i=0;i<4;i++){final int k=i;JSONObject op=new JSONObject();try{op.put("question_id",qid);op.put("body",fs[i].getText().toString());op.put("is_correct",rg.getCheckedRadioButtonId()==100+i);op.put("sort_order",i);}catch(Exception ignored){}db.insert("options",op,(x,y,z)->{if(z!=null)runOnUiThread(()->msg(z));});}msg("تم حفظ السؤال والاختيارات");addQuestion(quiz);}));});
  btn(body,"نشر الامتحان",()->{JSONObject p=new JSONObject();try{p.put("published",true);}catch(Exception ignored){}db.patch("quizzes","id=eq."+quiz,p,(r,o,e)->runOnUiThread(()->msg(e==null?"تم نشر الامتحان":e)));});
 }
 private void teacherExams(){base("امتحاناتي");db.get("quizzes","select=id,title,published,subject_id&created_by=eq."+db.userId()+"&order=created_at.desc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}for(int i=0;i<a.length();i++){JSONObject q=a.optJSONObject(i);addText(body,q.optString("title")+" • "+(q.optBoolean("published")?"منشور":"مسودة"),16,true);btn(body,"عرض نتائج الطلاب",()->teacherResults(q.optString("id")));}}));btn(body,"رجوع",this::dashboard);}
 private void teacherResults(String exam){base("نتائج الطلاب");db.get("exam_attempts","select=id,student_id,status,score,submitted_at&exam_id=eq."+exam+"&order=started_at.desc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);addText(body,"طالب: "+x.optString("student_id")+" • "+x.optString("status")+" • "+x.optString("score"),14,false);}}));}
 private void adminRequests(){base("طلبات المعلمين");db.get("teacher_requests","select=id,user_id,note,status,created_at&status=eq.PENDING&order=created_at.asc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);addText(body,"المستخدم: "+x.optString("user_id")+"\n"+x.optString("note"),14,false);String id=x.optString("id");btn(body,"موافقة",()->review(id,true));btn(body,"رفض",()->review(id,false));}}));btn(body,"رجوع",this::dashboard);}
 private void review(String id,boolean approve){JSONObject p=new JSONObject();try{p.put("request_id",id);p.put("approve",approve);}catch(Exception ignored){}db.rpc("approve_teacher_request",p,(a,o,e)->runOnUiThread(()->{msg(e==null?"تم تحديث الطلب":e);adminRequests();}));}
 private void users(){base("المستخدمون");db.get("profiles","select=id,full_name,email,role&order=created_at.desc",(a,o,e)->runOnUiThread(()->{if(e!=null){msg(e);return;}for(int i=0;i<a.length();i++){JSONObject u=a.optJSONObject(i);addText(body,u.optString("full_name")+"\n"+u.optString("email")+" • "+u.optString("role"),14,false);}}));btn(body,"رجوع",this::dashboard);}
 private void editName(){base("تعديل الاسم");EditText n=field("الاسم الجديد",false);n.setText(name);body.addView(n);btn(body,"حفظ",()->{JSONObject j=obj("full_name",n.getText().toString());db.patch("profiles","id=eq."+db.userId(),j,(a,o,e)->runOnUiThread(()->{if(e==null){name=n.getText().toString();dashboard();}else msg(e);}));});}
 private void startTimer(){if(examTimer!=null)examTimer.cancel();examTimer=new CountDownTimer(examMillis,1000){public void onTick(long ms){examMillis=ms;if(timerView!=null){long s=ms/1000;timerView.setText(String.format(java.util.Locale.US,"الوقت المتبقي: %02d:%02d",s/60,s%60));}}public void onFinish(){inExam=false;msg("انتهى الوقت وسيتم تسليم الامتحان");submitExam();}}.start();}
 @Override protected void onPause(){super.onPause();if(inExam&&!attemptId.isEmpty()){JSONObject p=new JSONObject();try{p.put("attempt_id",attemptId);p.put("event_type","WINDOW_BLUR");}catch(Exception ignored){}db.rpc("register_integrity_violation",p,(a,o,e)->runOnUiThread(()->{if(o!=null&&o.optBoolean("locked")){inExam=false;if(examTimer!=null)examTimer.cancel();msg("تم قفل المحاولة بعد تسجيل ثلاث مخالفات.");}}));}}
 @Override public void onBackPressed(){if(inExam){msg("لا تغادر الامتحان؛ استخدم زر التسليم.");return;}dashboard();}
}
