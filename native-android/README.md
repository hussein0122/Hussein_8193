# Quizora Native Android — Java

مشروع Android أصلي مستقل بلغة Java، ولا يستخدم WebView. لا يستبدل موقع Next.js ولا تطبيق Capacitor الحالي.

## الوظائف الموجودة في هذه المرحلة
- تسجيل الدخول وإنشاء حساب طالب عبر Supabase Auth.
- استعادة كلمة المرور عبر رسالة البريد الإلكتروني.
- تحميل ملف المستخدم وتحديد الدور من جدول `profiles` (STUDENT / TEACHER / ADMIN).
- الطالب: عرض الامتحانات المنشورة، بدء محاولة عبر RPC، تحميل أسئلة الاختيار من متعدد، حفظ الإجابات عبر RPC، تسليم الامتحان، وعرض سجل المحاولات.
- الطالب: إرسال طلب تفعيل معلم، مع عداد وقت أثناء حل الامتحان وتسجيل مغادرة التطبيق كإشارة نزاهة عبر دالة قاعدة البيانات.
- المعلم: إنشاء المواد، إنشاء امتحان، إضافة أسئلة MCQ وأربعة اختيارات، تحديد الإجابة الصحيحة، نشر الامتحان، وعرض المحاولات والدرجات.
- الإدارة: مراجعة طلبات تفعيل المعلمين بالموافقة أو الرفض، وعرض ملفات المستخدمين.
- تحديث الاسم وتسجيل الخروج.
- كل عمليات قاعدة البيانات تتم بمفتاح Supabase publishable/anon مع جلسة المستخدم وRLS؛ لا يوجد service-role key داخل التطبيق.

## إعداد اتصال Supabase

أنشئ ملف `native-android/local.properties` محلياً (لا ترفعه إلى Git) واكتب:

```properties
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

لبناء APK من GitHub Actions، أضف في المستودع:
**Settings → Secrets and variables → Actions → New repository secret**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

استخدم عنوان المشروع والمفتاح العام نفسه المستخدمين في الموقع. لا تستخدم مفتاح `service_role` أو أي secret key في تطبيق Android.

## البناء
- Android Studio حديث.
- JDK 17.
- Android SDK Platform 35.
- افتح مجلد `native-android` في Android Studio ثم نفّذ Gradle Sync.
- من Build اختر Build APK(s).

أو شغّل GitHub Actions: **Build Quizora Native Java APK**. سيظهر artifact باسم `Quizora-Native-Java-APK`.

## ملاحظات مهمة
- هذا إصدار تأسيسي وظيفي لتدفقات الحسابات والأدوار والامتحانات ذات أسئلة MCQ، وليس ضماناً بتطابق كل تفاصيل واجهة الموقع بعد.
- أنواع TRUE_FALSE وSHORT_ANSWER، استئناف محاولة بعد إغلاق التطبيق، إدارة حسابات Auth وحذفها، والإشعارات تحتاج مراحل إضافية قبل اعتبار التطبيق بديلاً كاملاً للموقع.
- لا تغيّر هذا المشروع سياسات RLS أو جداول الإنتاج. استخدم وظائف RPC الحالية التي تتحقق من صلاحيات المستخدم.
- لا يمكن تأكيد نجاح البناء أو التشغيل على جهاز فعلي قبل تشغيل Workflow وتثبيت APK واختبار الحسابات والأدوار.
