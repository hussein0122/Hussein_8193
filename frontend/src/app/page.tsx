"use client";

import { useState } from "react";
import { BookOpen, GraduationCap, ShieldCheck, Clock3, ChartNoAxesCombined, ArrowLeft, Menu, X, ClipboardList, Users, Sparkles } from "lucide-react";

const exams = [
  { subject: "الرياضيات", title: "اختبار التفاضل والتكامل", grade: "الصف الثالث الثانوي", time: "45 دقيقة", questions: 20, color: "blue" },
  { subject: "الفيزياء", title: "اختبار الحركة والطاقة", grade: "الصف الثاني الثانوي", time: "30 دقيقة", questions: 15, color: "violet" },
  { subject: "اللغة العربية", title: "اختبار القراءة والنحو", grade: "الصف الأول الثانوي", time: "35 دقيقة", questions: 18, color: "green" }
];

export default function Home() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [mobileOpen, setMobileOpen] = useState(false);
  return <main className="min-h-screen overflow-hidden">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <a href="#" className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-soft"><GraduationCap size={25}/></span>
        <span><b className="block text-lg">مِنصّة</b><small className="text-xs text-slate-500">تعلم • اختبر • تطوّر</small></span>
      </a>
      <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
        <a href="#features" className="hover:text-brand">مميزات المنصة</a><a href="#exams" className="hover:text-brand">الامتحانات</a><a href="#how" className="hover:text-brand">طريقة الاستخدام</a>
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <button className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white">تسجيل الدخول</button>
        <button className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-blue-700">ابدأ الآن <ArrowLeft className="mr-2 inline" size={16}/></button>
      </div>
      <button className="rounded-xl bg-white p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="القائمة">{mobileOpen ? <X/> : <Menu/>}</button>
    </header>
    {mobileOpen && <div className="mx-5 rounded-2xl bg-white p-4 shadow-soft md:hidden"><a className="block p-3" href="#features">مميزات المنصة</a><a className="block p-3" href="#exams">الامتحانات</a><a className="block p-3" href="#how">طريقة الاستخدام</a></div>}
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-20">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-brand"><Sparkles size={15}/> تجربة امتحانات أذكى وأسهل</div>
        <h1 className="max-w-2xl text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-6xl">كل امتحاناتك في <span className="text-brand">مكان واحد</span></h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">منصة تعليمية تجمع الطالب والمعلم في تجربة منظمة. اختبر مستواك، تابع نتائجك، واعرف نقاط قوتك وفرص التحسن.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-brand px-7 py-4 font-bold text-white shadow-soft transition hover:-translate-y-1 hover:bg-blue-700">ابدأ كطالب <ArrowLeft className="mr-3 inline" size={18}/></button>
          <button className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 hover:border-brand hover:text-brand">أنا معلّم</button>
        </div>
        <div className="mt-10 flex flex-wrap gap-7 text-sm text-slate-500"><span className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={18}/> نتائج دقيقة</span><span className="flex items-center gap-2"><Clock3 className="text-brand" size={18}/> امتحانات بوقت محدد</span><span className="flex items-center gap-2"><ChartNoAxesCombined className="text-violet-500" size={18}/> متابعة التقدم</span></div>
      </div>
      <div className="relative">
        <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-br from-blue-100 via-violet-50 to-emerald-50 blur-2xl"/>
        <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-soft sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">لوحة الطالب</p><h3 className="mt-1 text-xl font-black">أهلاً بيك 👋</h3></div><span className="rounded-xl bg-blue-50 p-3 text-brand"><GraduationCap/></span></div>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[["الامتحانات","12"],["متوسط الدرجات","86%"],["ساعات التعلم","24"]].map(([k,v])=><div key={k} className="rounded-2xl bg-slate-50 p-3 text-center"><b className="block text-xl text-brand">{v}</b><small className="mt-1 block text-[10px] text-slate-500 sm:text-xs">{k}</small></div>)}
          </div>
          <div className="mt-7 flex items-center justify-between"><b>امتحانات مقترحة</b><a href="#exams" className="text-xs font-bold text-brand">عرض الكل</a></div>
          <div className="mt-4 space-y-3">{exams.slice(0,2).map((e,i)=><div key={e.title} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${i===0?"bg-blue-50 text-brand":"bg-violet-50 text-violet-600"}`}><BookOpen/></span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{e.title}</b><small className="text-xs text-slate-400">{e.questions} سؤال • {e.time}</small></div><ArrowLeft size={16} className="text-slate-300"/></div>)}</div>
          <div className="mt-6 rounded-2xl bg-gradient-to-l from-brand to-indigo-500 p-4 text-white"><p className="text-xs text-blue-100">هدفك القادم</p><b className="mt-1 block">حافظ على تقدمك وحقق أفضل نتيجة!</b></div>
        </div>
      </div>
    </section>
    <section id="features" className="bg-white py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="font-bold text-brand">كل ما تحتاجه</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">تعليم منظم ونتائج أوضح</h2><p className="mt-4 leading-8 text-slate-500">أدوات بسيطة تساعد الطالب يتعلم والمعلم يدير الامتحانات بسهولة.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[{icon:ClipboardList,title:"امتحانات تفاعلية",desc:"أسئلة متنوعة، مؤقت واضح، وحفظ تلقائي للإجابات."},{icon:ChartNoAxesCombined,title:"تحليل النتائج",desc:"اعرف درجاتك وتاريخ محاولاتك ومستواك في كل مادة."},{icon:ShieldCheck,title:"نزاهة الامتحان",desc:"تسجيل أحداث مغادرة الصفحة والخروج من وضع ملء الشاشة."}].map(({icon:Icon,title,desc})=><article key={title} className="rounded-3xl border border-slate-100 bg-slate-50 p-7 transition hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-brand"><Icon/></span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-3 leading-7 text-slate-500">{desc}</p></article>)}</div></div></section>
    <section id="exams" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-brand">نماذج تجريبية</p><h2 className="mt-2 text-3xl font-black">اكتشف الامتحانات</h2></div><span className="rounded-full bg-white px-4 py-2 text-sm text-slate-500">تجريبي – سيتم ربط الامتحانات الحقيقية بقاعدة البيانات</span></div><div className="mt-9 grid gap-5 md:grid-cols-3">{exams.map(e=><article key={e.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand">{e.subject}</span><h3 className="mt-5 text-lg font-black">{e.title}</h3><p className="mt-2 text-sm text-slate-400">{e.grade}</p><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{e.questions} سؤال</span><span>{e.time}</span></div><button className="mt-5 w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-brand hover:text-white">قريبًا</button></article>)}</div></section>
    <section id="how" className="bg-slate-900 py-16 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 text-center md:flex-row md:text-right lg:px-8"><div><h2 className="text-3xl font-black">جاهز تبدأ رحلتك؟</h2><p className="mt-3 text-slate-400">انضم للمنصة وابدأ تنظيم امتحاناتك ومتابعة مستواك.</p></div><button className="rounded-2xl bg-white px-7 py-4 font-bold text-slate-900 hover:bg-blue-50">سجل الآن <ArrowLeft className="mr-2 inline" size={17}/></button></div></section>
    <footer className="bg-slate-950 px-5 py-7 text-center text-sm text-slate-500">© 2026 مِنصّة — منصة الامتحانات التعليمية</footer>
  </main>;
}
