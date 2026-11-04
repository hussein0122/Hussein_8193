"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, BarChart3, BookOpen, CheckCircle2, Clock3, GraduationCap,
  Menu, ShieldCheck, Sparkles, Users, X, ClipboardList, Play, LockKeyhole,
  ChevronDown, CircleHelp, Mail, UserRound, Timer, Award
} from "lucide-react";

const exams = [
  { subject: "الرياضيات", title: "اختبار التفاضل والتكامل", grade: "الصف الثالث الثانوي", time: "45 دقيقة", questions: 20, color: "blue", description: "مراجعة على النهايات والاشتقاق والتكامل." },
  { subject: "الفيزياء", title: "اختبار الحركة والطاقة", grade: "الصف الثاني الثانوي", time: "30 دقيقة", questions: 15, color: "violet", description: "أسئلة على قوانين الحركة والطاقة." },
  { subject: "اللغة العربية", title: "اختبار القراءة والنحو", grade: "الصف الأول الثانوي", time: "35 دقيقة", questions: 18, color: "green", description: "تدريب على الفهم القرائي والقواعد." }
];

const demoQuestions = [
  { q: "ما ناتج مشتقة الدالة س²؟", choices: ["س", "٢س", "س²", "٢"], correct: 1 },
  { q: "ما وحدة قياس القوة؟", choices: ["الجول", "الواط", "النيوتن", "الأمبير"], correct: 2 },
  { q: "أي الكلمات التالية فعل؟", choices: ["مدرسة", "يكتب", "قلم", "جميل"], correct: 1 }
];

export default function Home() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authUser, setAuthUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive || !data.session?.user) return;
      const user = data.session.user;
      const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
      if (alive) setAuthUser({ email: user.email ?? "", name: profile?.full_name ?? user.email?.split("@")[0] ?? "مستخدم", role: profile?.role ?? "STUDENT" });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setAuthUser(null);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  const score = useMemo(() => answers.reduce((sum, answer, i) => sum + (answer === demoQuestions[i]?.correct ? 1 : 0), 0), [answers]);

  function openAuth(mode: "login" | "register", selectedRole = role) {
    setRole(selectedRole); setAuthMessage(""); setAuthMode(mode); setMenuOpen(false);
  }
  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();
    try {
      if (authMode === "register") {
        const result = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (result.error) throw result.error;
        if (!result.data.session) { setAuthMessage("تأكيد البريد الإلكتروني ما زال مفعّلًا في إعدادات Supabase."); return; }
        setAuthUser({ email, name: fullName || email.split("@")[0], role: "STUDENT" });
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        const profile = await supabase.from("profiles").select("full_name,role").eq("id", result.data.user.id).maybeSingle();
        setAuthUser({ email, name: profile.data?.full_name || email.split("@")[0], role: profile.data?.role || "STUDENT" });
      }
      setAuthMode(null);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "تعذر إتمام تسجيل الدخول.");
    } finally { setAuthLoading(false); }
  }
  function startDemo(index: number) {
    setSelectedExam(index); setQuestionIndex(0); setAnswers([]); setQuizFinished(false); setQuizOpen(true);
  }
  function chooseAnswer(index: number) {
    setAnswers(prev => { const next = [...prev]; next[questionIndex] = index; return next; });
  }
  function nextQuestion() {
    if (questionIndex < demoQuestions.length - 1) setQuestionIndex(i => i + 1);
    else setQuizFinished(true);
  }
  function closeQuiz() { setQuizOpen(false); setSelectedExam(null); }

  return <main className="min-h-screen overflow-hidden">
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="#home" className="flex items-center gap-3" aria-label="العودة للرئيسية">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-soft"><GraduationCap size={25}/></span>
          <span><b className="block text-lg">مِنصّة</b><small className="text-xs text-slate-500">تعلم • اختبر • تطوّر</small></span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-brand">المميزات</a><a href="#exams" className="hover:text-brand">الامتحانات</a><a href="#how" className="hover:text-brand">كيف تعمل</a><a href="#faq" className="hover:text-brand">الأسئلة الشائعة</a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={() => openAuth("login")} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">دخول</button>
          <button onClick={() => openAuth("register")} className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-blue-700">إنشاء حساب <ArrowLeft className="mr-2 inline" size={16}/></button>
        </div>
        <button className="rounded-xl bg-slate-50 p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="فتح القائمة">{menuOpen ? <X/> : <Menu/>}</button>
      </div>
      {menuOpen && <nav className="grid gap-1 border-t border-slate-100 bg-white p-4 md:hidden">
        {["features","exams","how","faq"].map((id,i)=><a key={id} onClick={()=>setMenuOpen(false)} className="rounded-xl p-3 hover:bg-slate-50" href={`#${id}`}>{["المميزات","الامتحانات","كيف تعمل","الأسئلة الشائعة"][i]}</a>)}
        <button onClick={()=>openAuth("login")} className="mt-2 rounded-xl border p-3 font-bold">تسجيل الدخول</button>
        <button onClick={()=>openAuth("register")} className="rounded-xl bg-brand p-3 font-bold text-white">إنشاء حساب</button>
      </nav>}
    </header>

    <section id="home" className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-24">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-brand"><Sparkles size={15}/> تجربة امتحانات أذكى وأسهل</div>
        <h1 className="max-w-2xl text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-6xl">كل امتحاناتك في <span className="text-brand">مكان واحد</span></h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">منصة تعليمية تجمع الطالب والمعلم في تجربة منظمة. اختبر مستواك، تابع نتائجك، واعرف نقاط قوتك وفرص التحسن.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={()=>openAuth("register","student")} className="rounded-2xl bg-brand px-7 py-4 font-bold text-white shadow-soft transition hover:-translate-y-1 hover:bg-blue-700">ابدأ كطالب <ArrowLeft className="mr-3 inline" size={18}/></button>
          <button onClick={()=>openAuth("register","teacher")} className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 hover:border-brand hover:text-brand">أنا معلّم</button>
          <a href="#exams" className="rounded-2xl px-5 py-4 font-bold text-brand hover:bg-blue-50">جرّب امتحانًا <Play className="mr-2 inline" size={16}/></a>
        </div>
        <div className="mt-10 flex flex-wrap gap-7 text-sm text-slate-500"><span className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18}/> نتائج دقيقة</span><span className="flex items-center gap-2"><Clock3 className="text-brand" size={18}/> امتحانات بوقت محدد</span><span className="flex items-center gap-2"><BarChart3 className="text-violet-500" size={18}/> متابعة التقدم</span></div>
      </div>
      <div className="relative">
        <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-blue-100 via-violet-50 to-emerald-50 blur-2xl"/>
        <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-soft sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">معاينة لوحة الطالب</p><h3 className="mt-1 text-xl font-black">أهلاً بيك 👋</h3></div><span className="rounded-xl bg-blue-50 p-3 text-brand"><GraduationCap/></span></div>
          <div className="mt-7 grid grid-cols-3 gap-3">{[["الامتحانات","12"],["متوسط الدرجات","86%"],["ساعات التعلم","24"]].map(([k,v])=><div key={k} className="rounded-2xl bg-slate-50 p-3 text-center"><b className="block text-xl text-brand">{v}</b><small className="mt-1 block text-[10px] text-slate-500 sm:text-xs">{k}</small></div>)}</div>
          <div className="mt-7 flex items-center justify-between"><b>امتحانات مقترحة</b><a href="#exams" className="text-xs font-bold text-brand">عرض الكل</a></div>
          <div className="mt-4 space-y-3">{exams.slice(0,2).map((e,i)=><button onClick={()=>startDemo(i)} key={e.title} className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 p-3 text-right transition hover:border-blue-200 hover:bg-blue-50/40"><span className={`grid h-11 w-11 place-items-center rounded-xl ${i===0?"bg-blue-50 text-brand":"bg-violet-50 text-violet-600"}`}><BookOpen/></span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{e.title}</b><small className="text-xs text-slate-400">{e.questions} سؤال • {e.time}</small></span><ArrowLeft size={16} className="text-slate-300"/></button>)}</div>
          <div className="mt-6 rounded-2xl bg-gradient-to-l from-brand to-indigo-500 p-4 text-white"><p className="text-xs text-blue-100">هدفك القادم</p><b className="mt-1 block">حافظ على تقدمك وحقق أفضل نتيجة!</b></div>
        </div>
      </div>
    </section>

    <section id="features" className="scroll-mt-24 bg-white py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8">
      <div className="mx-auto max-w-2xl text-center"><p className="font-bold text-brand">كل ما تحتاجه</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">تعليم منظم ونتائج أوضح</h2><p className="mt-4 leading-8 text-slate-500">أدوات بسيطة تساعد الطالب يتعلم والمعلم يدير الامتحانات بسهولة.</p></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{[{icon:ClipboardList,title:"امتحانات تفاعلية",desc:"أسئلة متنوعة، مؤقت واضح، وحفظ تلقائي للإجابات."},{icon:BarChart3,title:"تحليل النتائج",desc:"اعرف درجاتك وتاريخ محاولاتك ومستواك في كل مادة."},{icon:ShieldCheck,title:"نزاهة الامتحان",desc:"تسجيل أحداث مغادرة الصفحة والخروج من وضع ملء الشاشة."}].map(({icon:Icon,title,desc})=><article key={title} className="rounded-3xl border border-slate-100 bg-slate-50 p-7 transition hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-brand"><Icon/></span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-3 leading-7 text-slate-500">{desc}</p></article>)}</div>
    </div></section>

    <section id="exams" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-brand">نماذج تجريبية</p><h2 className="mt-2 text-3xl font-black">اكتشف الامتحانات</h2><p className="mt-3 text-slate-500">اختار نموذجًا وجرب حل الأسئلة بنفسك.</p></div><span className="rounded-full bg-white px-4 py-2 text-xs text-slate-500">نسخة تجريبية</span></div>
      <div className="mt-9 grid gap-5 md:grid-cols-3">{exams.map((e,i)=><article key={e.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand">{e.subject}</span><h3 className="mt-5 text-lg font-black">{e.title}</h3><p className="mt-2 text-sm text-slate-400">{e.grade}</p><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{e.description}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span><ClipboardList className="ml-1 inline" size={14}/>{e.questions} سؤال</span><span><Clock3 className="ml-1 inline" size={14}/>{e.time}</span></div><button onClick={()=>startDemo(i)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-blue-700">ابدأ النموذج التجريبي <ArrowLeft size={16}/></button></article>)}</div>
    </section>

    <section id="how" className="scroll-mt-24 bg-slate-900 py-20 text-white"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><p className="font-bold text-blue-300">خطوات بسيطة</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">ابدأ في 3 خطوات</h2></div><div className="mt-12 grid gap-6 md:grid-cols-3">{[{n:"01",icon:UserRound,title:"أنشئ حسابك",desc:"حدد إذا كنت طالبًا أو معلمًا وسجل بياناتك."},{n:"02",icon:BookOpen,title:"اختر الامتحان",desc:"تصفح المواد والاختبارات المتاحة لك."},{n:"03",icon:Award,title:"اعرف نتيجتك",desc:"شاهد درجتك وراجع أداءك بعد التسليم."}].map(({n,icon:Icon,title,desc})=><div key={n} className="rounded-3xl border border-white/10 bg-white/5 p-7"><div className="flex items-center justify-between"><Icon className="text-blue-300" size={27}/><span className="text-3xl font-black text-white/20">{n}</span></div><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-400">{desc}</p></div>)}</div><div className="mt-10 text-center"><button onClick={()=>openAuth("register")} className="rounded-2xl bg-white px-8 py-4 font-bold text-slate-900 hover:bg-blue-50">إنشاء حساب جديد <ArrowLeft className="mr-2 inline" size={17}/></button></div></div></section>

    <section id="faq" className="scroll-mt-24 bg-white py-20"><div className="mx-auto max-w-3xl px-5"><div className="text-center"><CircleHelp className="mx-auto text-brand" size={30}/><h2 className="mt-3 text-3xl font-black">الأسئلة الشائعة</h2></div><div className="mt-10 space-y-3">{[{q:"هل الامتحانات المتاحة حقيقية؟",a:"الموجود حاليًا نماذج تجريبية للتأكد من تجربة الاستخدام. سيتم عرض الامتحانات الفعلية بعد ربط لوحة المعلم وقاعدة البيانات."},{q:"هل أستطيع إنشاء امتحان كمعلم؟",a:"واجهة المعلم ضمن خطة التنفيذ، وسيتم تفعيل إنشاء المواد والأسئلة والامتحانات بعد استكمال تسجيل الحسابات وصلاحيات الخادم."},{q:"هل يتم حفظ نتيجتي؟",a:"نتيجة النموذج التجريبي تظهر داخل الصفحة فقط ولا تُحفظ في حساب. الحفظ الدائم يحتاج ربط الواجهة بخدمات الخادم."}].map((item,i)=><div key={item.q} className="rounded-2xl border border-slate-200"><button onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="flex w-full items-center justify-between gap-4 p-5 text-right font-bold"><span>{item.q}</span><ChevronDown className={`shrink-0 transition ${faqOpen===i?"rotate-180 text-brand":""}`}/></button>{faqOpen===i&&<p className="px-5 pb-5 leading-8 text-slate-500">{item.a}</p>}</div>)}</div></div></section>

    <section className="bg-blue-50 py-16"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 text-center md:flex-row md:text-right lg:px-8"><div><h2 className="text-3xl font-black">جاهز تبدأ رحلتك؟</h2><p className="mt-3 text-slate-500">أنشئ حسابك واستعد لتجربة تعليمية منظمة.</p></div><button onClick={()=>openAuth("register")} className="rounded-2xl bg-brand px-8 py-4 font-bold text-white shadow-soft hover:bg-blue-700">سجل الآن <ArrowLeft className="mr-2 inline" size={17}/></button></div></section>
    <footer className="bg-slate-950 px-5 py-8 text-center text-sm text-slate-500"><div className="mb-3 flex justify-center gap-5"><a href="#home" className="hover:text-white">الرئيسية</a><a href="#features" className="hover:text-white">المميزات</a><a href="#faq" className="hover:text-white">المساعدة</a></div>© 2026 مِنصّة — منصة الامتحانات التعليمية</footer>

    {authMode && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthMode(null)}}><div className="my-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8" dir="rtl"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand"><LockKeyhole/></span><button onClick={()=>setAuthMode(null)} className="rounded-xl p-2 hover:bg-slate-100" aria-label="إغلاق"><X/></button></div><h2 className="mt-5 text-2xl font-black">{authMode==="login"?"تسجيل الدخول":"إنشاء حساب جديد"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">سجّل ببريدك الإلكتروني وكلمة المرور. حسابات المعلمين تُفعّل بعد اعتماد الإدارة.</p><form onSubmit={submitAuth} className="mt-5 space-y-3">{authMode==="register"&&<input name="fullName" required minLength={2} placeholder="الاسم بالكامل" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand"/>}<input name="email" required type="email" autoComplete="email" placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand"/><input name="password" required minLength={6} type="password" autoComplete={authMode==="login"?"current-password":"new-password"} placeholder="كلمة المرور (6 أحرف على الأقل)" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand"/><button disabled={authLoading} type="submit" className="w-full rounded-xl bg-brand py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{authLoading?"جارٍ التنفيذ...":authMode==="login"?"دخول":"إنشاء الحساب"}</button></form>{authMessage&&<p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800">{authMessage}</p>}<button onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAuthMessage("")}} className="mt-5 w-full text-sm font-bold text-brand">{authMode==="login"?"ليس لديك حساب؟ أنشئ حسابًا":"لديك حساب بالفعل؟ سجل الدخول"}</button></div></div>}

    {quizOpen && selectedExam!==null && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4"><div className="my-8 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8" dir="rtl"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-brand">نموذج تجريبي • {exams[selectedExam].subject}</p><h2 className="mt-1 text-xl font-black">{exams[selectedExam].title}</h2></div><button onClick={closeQuiz} className="rounded-xl p-2 hover:bg-slate-100" aria-label="إغلاق"><X/></button></div>{!quizFinished?<><div className="mt-6 flex items-center justify-between text-sm text-slate-500"><span>السؤال {questionIndex+1} من {demoQuestions.length}</span><span><Timer className="ml-1 inline" size={16}/> تجربة بدون توقيت فعلي</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-all" style={{width:`${((questionIndex+1)/demoQuestions.length)*100}%`}}/></div><h3 className="mt-7 text-lg font-bold leading-8">{demoQuestions[questionIndex].q}</h3><div className="mt-5 space-y-3">{demoQuestions[questionIndex].choices.map((choice,i)=><button key={choice} onClick={()=>chooseAnswer(i)} className={`w-full rounded-xl border p-4 text-right transition ${answers[questionIndex]===i?"border-brand bg-blue-50 text-brand":"border-slate-200 hover:border-blue-300"}`}>{choice}</button>)}</div><button disabled={answers[questionIndex]===undefined} onClick={nextQuestion} className="mt-7 w-full rounded-xl bg-brand py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{questionIndex===demoQuestions.length-1?"إنهاء وعرض النتيجة":"السؤال التالي"}</button></>:<div className="py-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={48}/><h3 className="mt-4 text-2xl font-black">انتهى النموذج التجريبي</h3><p className="mt-2 text-slate-500">نتيجتك: {score} من {demoQuestions.length}</p><button onClick={closeQuiz} className="mt-6 rounded-xl bg-brand px-8 py-3 font-bold text-white">إغلاق</button></div>}<p className="mt-5 text-center text-xs leading-5 text-slate-400">هذه تجربة محلية للتصميم فقط؛ لا تُحفظ الإجابات في قاعدة البيانات.</p></div></div>}
  </main>;
}
