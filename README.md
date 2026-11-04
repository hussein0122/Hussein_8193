# مِنصّة — منصة التعليم والاختبارات

منصة عربية RTL مبنية باستخدام Next.js 15 وReact وSupabase Auth/PostgreSQL.

## الوظائف الحالية

- تسجيل حساب طالب وتسجيل الدخول والخروج واستعادة الجلسة.
- طلب تفعيل حساب معلم ومراجعة الطلبات من حساب الإدارة.
- لوحة المعلم: إنشاء المواد والامتحانات والأسئلة متعددة الاختيارات ونشر الامتحانات.
- لوحة الطالب: عرض الامتحانات المنشورة، بدء محاولة، حفظ الإجابات أثناء الحل، عداد وقت، تسليم وتصحيح تلقائي، وسجل النتائج.
- نزاهة الامتحان: تسجيل مغادرة صفحة الامتحان والخروج من ملء الشاشة، مع قفل المحاولة بعد ثلاث مخالفات من خلال دوال قاعدة البيانات.
- لوحة المعلم تعرض المحاولات والدرجات وسجل مخالفات النزاهة للامتحانات التابعة له.

## التقنية

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS.
- Auth + Database: Supabase Auth and PostgreSQL with Row Level Security.
- Exam operations: PostgreSQL RPC functions validate ownership, save answers, grade submissions, and lock attempts.
- The Java/Spring Boot folder is not used by the current frontend flow. Its legacy integrity endpoints are disabled unless the \`legacy-api\` profile is explicitly enabled. Do not expose that profile publicly until JWT verification and ownership checks are implemented.

## Environment variables

Configure these in Vercel Project Settings → Environment Variables:

- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`

Never put the Supabase \`service_role\` key in frontend environment variables.

## Database

The Supabase project contains profiles, subjects, teacher_requests, quizzes, questions, options, exam_attempts, answers, and integrity_events. Schema migrations are recorded in Supabase.

RLS limits data by user role and ownership. Students cannot select the \`is_correct\` column from answer options. Exam writes are handled by validated database RPC functions.

## Local development

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Production build:

\`\`\`bash
npm run build
\`\`\`

## Important integrity limitation

The browser can report when the exam tab becomes hidden or fullscreen is exited. It cannot reliably detect split-screen, other applications, AI tools on the same device, or a second physical device. Treat browser events as integrity signals, not proof of cheating.
