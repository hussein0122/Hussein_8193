# منصة الامتحانات التعليمية

منصة عربية RTL للطلاب والمعلمين، مبنية بواجهة Next.js وواجهة خلفية Java 21 / Spring Boot.

## هيكل المشروع
- `frontend/`: Next.js + TypeScript + Tailwind
- `backend/`: Java 21 + Spring Boot + PostgreSQL
- `render.yaml`: إعداد خدمة Java على Render
- `vercel.json`: إعداد نشر الواجهة على Vercel

## التشغيل محليًا
### الواجهة
```bash
cd frontend
npm install
npm run dev
```

### الخلفية
```bash
cd backend
./mvnw spring-boot:run
```

إعدادات الاتصال بقاعدة البيانات عبر متغيرات البيئة موضحة في `backend/src/main/resources/application.yml`.

## ملاحظة نزاهة الامتحان
المتصفح يستطيع تسجيل مغادرة الصفحة/إخفائها والخروج من ملء الشاشة، لكنه لا يستطيع ضمان كشف تقسيم الشاشة أو التطبيقات المفتوحة أو استخدام جهاز ثانٍ. قرارات إيقاف المحاولة تُفرض من الخادم ولا تعتمد على الواجهة وحدها.
