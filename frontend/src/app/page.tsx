"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap, BookOpen, ClipboardList, Users, ShieldCheck, LogOut,
  Menu, X, Plus, Play, CheckCircle2, Clock3, AlertTriangle, LockKeyhole,
  BarChart3, RefreshCw, Send, Trash2, ChevronLeft, Award, FileText
} from "lucide-react";

type Role = "STUDENT" | "TEACHER" | "ADMIN";
type Profile = { id: string; email: string; name: string; role: Role };
type Subject = { id: string; name: string; description?: string | null };
type Quiz = { id: string; title: string; description: string | null; duration_minutes: number; published: boolean; subject_id: string; starts_at?: string | null; ends_at?: string | null; created_at?: string; subjects?: { name: string } | null };
type AdminAccount = { id: string; full_name: string; email: string; role: "STUDENT" | "TEACHER"; created_at: string };
type Option = { id: string; body: string; sort_order: number };
type Question = { id: string; body: string; points: number; sort_order: number; options: Option[] };
type Attempt = { id: string; exam_id: string; status: string; strikes: number; score: number | null; started_at: string; submitted_at: string | null; quizzes?: { title: string } | null };
type ActiveExam = { id: string; quiz: Quiz; questions: Question[]; index: number; selected: Record<string,string>; strikes: number; secondsLeft: number; locked: boolean; result: number | null };

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>("login");
  const [activePage, setActivePage] = useState<"workspace" | "exams" | "stats" | "dashboard">("workspace");
  const [adminAccountRole, setAdminAccountRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [authRole, setAuthRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [authError, setAuthError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<any[]>([]);
  const [teacherResults, setTeacherResults] = useState<any[]>([]);
  const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [quizForm, setQuizForm] = useState({ title: "", description: "", subject_id: "", duration_minutes: 30, starts_at: "", ends_at: "" });
  const [questionForm, setQuestionForm] = useState({ quiz_id: "", body: "", options: "", correct: "1", points: "1" });
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [integrityMessage, setIntegrityMessage] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const violationLock = useRef(false);
  const lastViolationAt = useRef(0);

  const refreshProfile = useCallback(async (userId: string, email: string) => {
    const { data, error } = await supabase.from("profiles").select("id,full_name,role").eq("id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("لم يتم إنشاء ملف الحساب. تواصل مع إدارة المنصة.");
    setProfile({ id: data.id, email, name: data.full_name || email.split("@")[0], role: data.role as Role });
    setAuthMode(null);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!alive) return;
      if (error) setNotice("تعذر استعادة جلسة الدخول.");
      if (data.session?.user) {
        try { await refreshProfile(data.session.user.id, data.session.user.email || ""); }
        catch (e) { setNotice(e instanceof Error ? e.message : "تعذر تحميل الحساب."); }
      }
      if (alive) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setForgotMode(false);
        setAuthMode(null);
        setAuthError("");
      }
      if (!session) { setProfile(null); setSubjects([]); setQuizzes([]); setAttempts([]); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [refreshProfile]);

  const loadWorkspace = useCallback(async () => {
    if (!profile) return;
    setHistoryLoading(true);
    try {
      if (profile.role === "TEACHER") {
        const { data: subjectRows, error: subjectError } = await supabase.from("subjects").select("id,name,description").eq("teacher_id", profile.id).order("created_at", { ascending: false });
        if (subjectError) throw subjectError;
        const ownedSubjects = (subjectRows || []) as Subject[];
        setSubjects(ownedSubjects);
        if (ownedSubjects.length) {
          const { data: quizRows, error: quizError } = await supabase.from("quizzes").select("id,title,description,duration_minutes,published,subject_id,starts_at,ends_at,created_at").in("subject_id", ownedSubjects.map(x => x.id)).order("created_at", { ascending: false });
          if (quizError) throw quizError;
          setQuizzes((quizRows || []) as Quiz[]);
          const quizIds = ownedSubjects.length ? (quizRows || []).map((q: any) => q.id) : [];
          if (quizIds.length) {
            const { data: resultRows, error: resultError } = await supabase.from("exam_attempts").select("id,exam_id,student_id,status,strikes,score,started_at,submitted_at,quizzes(title)").in("exam_id", quizIds).order("started_at", { ascending: false });
            if (resultError) throw resultError;
            const attemptsList = resultRows || [];
            const studentIds = Array.from(new Set(attemptsList.map((a: any) => a.student_id)));
            const attemptIds = attemptsList.map((a: any) => a.id);
            const [{ data: studentRows }, { data: eventRows }] = await Promise.all([
              studentIds.length ? supabase.from("profiles").select("id,full_name,email").in("id", studentIds) : Promise.resolve({ data: [] as any[] }),
              attemptIds.length ? supabase.from("integrity_events").select("id,attempt_id,event_type,strike_number,occurred_at,status").in("attempt_id", attemptIds).order("occurred_at", { ascending: false }) : Promise.resolve({ data: [] as any[] })
            ]);
            const studentMap = new Map((studentRows || []).map((u: any) => [u.id, u]));
            const eventMap = new Map<string, any[]>();
            (eventRows || []).forEach((event: any) => eventMap.set(event.attempt_id, [...(eventMap.get(event.attempt_id) || []), event]));
            setTeacherResults(attemptsList.map((a: any) => ({ ...a, student: studentMap.get(a.student_id), events: eventMap.get(a.id) || [] })));
          } else setTeacherResults([]);
        } else { setQuizzes([]); setTeacherResults([]); }
      } else if (profile.role === "STUDENT") {
        const [quizResult, attemptResult, requestResult] = await Promise.all([
          supabase.from("quizzes").select("id,title,description,duration_minutes,published,subject_id,starts_at,ends_at,created_at,subjects(name)").eq("published", true).order("created_at", { ascending: false }),
          supabase.from("exam_attempts").select("id,exam_id,status,strikes,score,started_at,submitted_at,quizzes(title)").eq("student_id", profile.id).order("started_at", { ascending: false }),
          supabase.from("teacher_requests").select("status").eq("user_id", profile.id).maybeSingle()
        ]);
        if (quizResult.error) throw quizResult.error;
        if (attemptResult.error) throw attemptResult.error;
        setQuizzes((quizResult.data || []) as unknown as Quiz[]);
        setAttempts((attemptResult.data || []) as unknown as Attempt[]);
        setTeacherStatus(requestResult.data?.status || null);
      } else {
        const { data, error } = await supabase.from("teacher_requests").select("id,user_id,note,status,created_at").eq("status", "PENDING").order("created_at", { ascending: false });
        if (error) throw error;
        const rows = data || [];
        if (rows.length) {
          const ids = rows.map((x: any) => x.user_id);
          const { data: users } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
          const lookup = new Map((users || []).map((x: any) => [x.id, x]));
          setTeacherRequests(rows.map((x: any) => ({ ...x, profile: lookup.get(x.user_id) })));
        } else setTeacherRequests([]);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "تعذر تحميل بيانات الحساب.");
    } finally { setHistoryLoading(false); }
  }, [profile]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function loadAdminAccounts(role = adminAccountRole) {
    if (profile?.role !== "ADMIN") return;
    setAccountsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-accounts", { body: { action: "list" } });
      if (error) throw error;
      setAdminAccounts(((data?.accounts || []) as AdminAccount[]).filter(account => account.role === role));
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر تحميل الحسابات."); }
    finally { setAccountsLoading(false); }
  }
  async function deleteAdminAccount(account: AdminAccount) {
    if (profile?.role !== "ADMIN" || !window.confirm(`تأكيد حذف حساب ${account.full_name}؟ سيتم حذف بياناته المرتبطة.`)) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-accounts", { body: { action: "delete", userId: account.id } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
      setAdminAccounts(old => old.filter(item => item.id !== account.id)); setNotice("تم حذف الحساب وبياناته المرتبطة بنجاح.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر حذف الحساب."); }
    finally { setBusy(false); }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setAuthError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();
    try {
      if (authMode === "register") {
        if (fullName.length < 2) throw new Error("اكتب الاسم بالكامل.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (!data.user) throw new Error("تعذر إنشاء الحساب.");
        if (!data.session) throw new Error("تم إنشاء الحساب، لكن إعداد تأكيد البريد يمنع الدخول الفوري. راجع إعدادات البريد أو سجل الدخول بعد التأكيد.");
        await refreshProfile(data.user.id, email);
        if (authRole === "TEACHER") {
          const { error: requestError } = await supabase.from("teacher_requests").upsert({ user_id: data.user.id, note: "طلب تفعيل حساب معلم" }, { onConflict: "user_id" });
          if (requestError) throw requestError;
          setNotice("تم إنشاء الحساب. أرسلنا طلب اعتماد المعلم إلى الإدارة.");
        } else setNotice("تم إنشاء حسابك بنجاح.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile(data.user.id, email);
        setNotice("تم تسجيل الدخول بنجاح.");
      }
      setAuthMode(null);
    } catch (e) { setAuthError(e instanceof Error ? e.message : "حدث خطأ أثناء تنفيذ الطلب."); }
    finally { setBusy(false); }
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("recoveryEmail") || "").trim().toLowerCase();
    try {
      const redirectTo = `${window.location.origin}/?reset-password=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setRecoveryEmail(email);
      setForgotMode(false);
      setNotice("لو البريد مسجل عندنا، هتوصلك رسالة فيها رابط إعادة تعيين كلمة المرور. افتح أحدث رسالة فقط.");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "تعذر إرسال رابط الاستعادة.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    try {
      if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      if (password !== confirmPassword) throw new Error("كلمتا المرور غير متطابقتين.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setRecoveryMode(false);
      setAuthMode(null);
      setNotice("تم تغيير كلمة المرور بنجاح. يمكنك متابعة استخدام حسابك.");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "تعذر تغيير كلمة المرور.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null); setActiveExam(null); setAuthMode("login"); setActivePage("workspace"); setNotice("تم تسجيل الخروج.");
  }

  async function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile) return; setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.from("subjects").insert({ name: subjectName.trim(), description: subjectDescription.trim() || null, teacher_id: profile.id }).select("id,name,description").single();
      if (error) throw error;
      setSubjects(old => [data as Subject, ...old]); setSubjectName(""); setSubjectDescription(""); setNotice("تم إنشاء المادة.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر إنشاء المادة."); }
    finally { setBusy(false); }
  }

  async function createQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      if (!quizForm.subject_id) throw new Error("اختر المادة أولًا.");
      if (quizForm.starts_at && quizForm.ends_at && new Date(quizForm.ends_at) <= new Date(quizForm.starts_at)) throw new Error("موعد انتهاء الامتحان يجب أن يكون بعد موعد بدايته.");
      const { data, error } = await supabase.from("quizzes").insert({
        title: quizForm.title.trim(), description: quizForm.description.trim() || null,
        subject_id: quizForm.subject_id, duration_minutes: quizForm.duration_minutes,
        starts_at: quizForm.starts_at ? new Date(quizForm.starts_at).toISOString() : null,
        ends_at: quizForm.ends_at ? new Date(quizForm.ends_at).toISOString() : null,
        created_by: profile?.id, published: false
      }).select("id,title,description,duration_minutes,published,subject_id,created_at").single();
      if (error) throw error;
      setQuizzes(old => [data as Quiz, ...old]); setQuestionForm(old => ({ ...old, quiz_id: data.id }));
      setQuizForm({ title: "", description: "", subject_id: "", duration_minutes: 30, starts_at: "", ends_at: "" });
      setNotice("تم حفظ الامتحان كمسودة. أضف الأسئلة ثم انشره.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر إنشاء الامتحان."); }
    finally { setBusy(false); }
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const options = questionForm.options.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      const correct = Number(questionForm.correct) - 1;
      if (options.length < 2 || correct < 0 || correct >= options.length) throw new Error("أدخل اختيارين على الأقل وحدد رقم الإجابة الصحيحة بشكل صحيح.");
      const { data: existing } = await supabase.from("questions").select("id").eq("quiz_id", questionForm.quiz_id);
      const { data: question, error } = await supabase.from("questions").insert({
        quiz_id: questionForm.quiz_id, body: questionForm.body.trim(), question_type: "MCQ",
        points: Number(questionForm.points), sort_order: existing?.length || 0
      }).select("id").single();
      if (error) throw error;
      const { error: optionError } = await supabase.from("options").insert(options.map((body, i) => ({
        question_id: question.id, body, is_correct: i === correct, sort_order: i
      })));
      if (optionError) {
        await supabase.from("questions").delete().eq("id", question.id);
        throw optionError;
      }
      setQuestionForm(old => ({ ...old, body: "", options: "" }));
      setNotice("تم حفظ السؤال والاختيارات.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر حفظ السؤال."); }
    finally { setBusy(false); }
  }

  async function publishQuiz(id: string) {
    setBusy(true); setNotice("");
    try {
      const { data: questionRows, error: questionError } = await supabase.from("questions").select("id").eq("quiz_id", id);
      if (questionError) throw questionError;
      if (!questionRows?.length) throw new Error("لا يمكن نشر امتحان بدون أسئلة.");
      const questionIds = questionRows.map((q: any) => q.id);
      const { data: optionRows, error: optionError } = await supabase.from("options").select("question_id").in("question_id", questionIds);
      if (optionError) throw optionError;
      const optionCounts = new Map<string, number>();
      (optionRows || []).forEach((o: any) => optionCounts.set(o.question_id, (optionCounts.get(o.question_id) || 0) + 1));
      if (questionIds.some((questionId: string) => (optionCounts.get(questionId) || 0) < 2)) throw new Error("كل سؤال يجب أن يحتوي على اختيارين على الأقل قبل النشر.");
      const { error } = await supabase.from("quizzes").update({ published: true }).eq("id", id);
      if (error) throw error;
      setQuizzes(old => old.map(q => q.id === id ? { ...q, published: true } : q));
      setNotice("تم نشر الامتحان وأصبح متاحًا للطلاب.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر نشر الامتحان."); }
    finally { setBusy(false); }
  }

  async function startExam(quiz: Quiz) {
    if (!profile || profile.role !== "STUDENT") return;
    const now = Date.now();
    if (quiz.starts_at && now < new Date(quiz.starts_at).getTime()) { setNotice("الامتحان لم يبدأ بعد. موعد البداية: " + new Date(quiz.starts_at).toLocaleString("ar-EG")); return; }
    if (quiz.ends_at && now >= new Date(quiz.ends_at).getTime()) { setNotice("انتهى وقت إتاحة هذا الامتحان."); return; }
    setBusy(true); setNotice(""); violationLock.current = false; lastViolationAt.current = 0;
    try {
      const { data: attemptId, error: startError } = await supabase.rpc("start_exam", { exam_id: quiz.id });
      if (startError) { const message = String(startError.message || ""); if (message.includes("EXAM_NOT_STARTED")) throw new Error("الامتحان لم يبدأ موعده بعد."); if (message.includes("EXAM_CLOSED")) throw new Error("انتهى وقت إتاحة الامتحان."); throw startError; }
      const { data: rows, error: questionError } = await supabase.from("questions").select("id,body,points,sort_order").eq("quiz_id", quiz.id).order("sort_order");
      if (questionError) throw questionError;
      if (!rows?.length) throw new Error("هذا الامتحان لا يحتوي على أسئلة.");
      const questionIds = rows.map((x: any) => x.id);
      const { data: optionRows, error: optionError } = await supabase.from("options").select("id,question_id,body,sort_order").in("question_id", questionIds).order("sort_order");
      if (optionError) throw optionError;
      const questions: Question[] = rows.map((q: any) => ({
        id: q.id, body: q.body, points: Number(q.points), sort_order: q.sort_order,
        options: (optionRows || []).filter((o: any) => o.question_id === q.id).map((o: any) => ({ id: o.id, body: o.body, sort_order: o.sort_order }))
      }));
      setActiveExam({ id: attemptId as string, quiz, questions, index: 0, selected: {}, strikes: 0, secondsLeft: quiz.duration_minutes * 60, locked: false, result: null });
      try { await document.documentElement.requestFullscreen?.(); } catch { /* Fullscreen is optional on unsupported mobile browsers. */ }
    } catch (e) { setNotice(e instanceof Error ? e.message : "تعذر بدء الامتحان."); }
    finally { setBusy(false); }
  }

  const finishExam = useCallback(async (locked = false) => {
    if (!activeExam) return;
    if (locked) {
      setActiveExam(old => old ? { ...old, locked: true } : old);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("submit_exam", { attempt_id: activeExam.id });
      if (error) throw error;
      setActiveExam(old => old ? { ...old, result: Number(data), secondsLeft: 0 } : old);
      await loadWorkspace();
    } catch (e) { setIntegrityMessage(e instanceof Error ? e.message : "تعذر تسليم الامتحان."); }
    finally { setBusy(false); }
  }, [activeExam, loadWorkspace]);

  const reportViolation = useCallback(async (eventType: "TAB_HIDDEN" | "FULLSCREEN_EXIT" | "WINDOW_BLUR") => {
    if (!activeExam || activeExam.result !== null || activeExam.locked || violationLock.current) return;
    const now = Date.now();
    if (now - lastViolationAt.current < 1800) return;
    lastViolationAt.current = now;
    try {
      const { data, error } = await supabase.rpc("register_integrity_violation", { attempt_id: activeExam.id, event_type: eventType });
      if (error) throw error;
      const next = Number(data.strikes || 0);
      setActiveExam(old => old ? { ...old, strikes: next, locked: Boolean(data.locked) } : old);
      if (data.locked) {
        violationLock.current = true;
        setIntegrityMessage("تم قفل المحاولة بعد تسجيل ثلاث مخالفات. لن يمكن استكمال هذا الامتحان.");
      } else {
        setIntegrityMessage("تنبيه " + next + " من 3: تم تسجيل مغادرة شاشة الامتحان. العودة للامتحان مطلوبة.");
      }
    } catch (e) { setIntegrityMessage(e instanceof Error ? e.message : "تعذر تسجيل مخالفة النزاهة."); }
  }, [activeExam]);

  useEffect(() => {
    if (!activeExam || activeExam.result !== null || activeExam.locked) return;
    const timer = window.setInterval(() => {
      setActiveExam(old => {
        if (!old || old.result !== null || old.locked) return old;
        if (old.secondsLeft <= 1) return { ...old, secondsLeft: 0 };
        return { ...old, secondsLeft: old.secondsLeft - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeExam?.id, activeExam?.result, activeExam?.locked, finishExam]);

  useEffect(() => {
    if (activeExam && activeExam.result === null && !activeExam.locked && activeExam.secondsLeft === 0) void finishExam(false);
  }, [activeExam?.secondsLeft, activeExam?.result, activeExam?.locked, finishExam]);

  useEffect(() => {
    if (!activeExam || activeExam.result !== null || activeExam.locked) return;
    const hidden = () => { if (document.visibilityState === "hidden") void reportViolation("TAB_HIDDEN"); };
    const fullscreen = () => { if (!document.fullscreenElement) void reportViolation("FULLSCREEN_EXIT"); };
    document.addEventListener("visibilitychange", hidden);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => { document.removeEventListener("visibilitychange", hidden); document.removeEventListener("fullscreenchange", fullscreen); };
  }, [activeExam?.id, activeExam?.result, activeExam?.locked, reportViolation]);

  async function chooseOption(optionId: string) {
    if (!activeExam || activeExam.locked) return;
    const q = activeExam.questions[activeExam.index];
    const { error } = await supabase.rpc("save_mcq_answer", { attempt_id: activeExam.id, question_id: q.id, option_id: optionId });
    if (error) { setIntegrityMessage(error.message); return; }
    setActiveExam(old => old ? { ...old, selected: { ...old.selected, [q.id]: optionId } } : old);
  }

  async function reviewTeacher(id: string, approve: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("approve_teacher_request", { request_id: id, approve });
    if (error) setNotice(error.message);
    else { setTeacherRequests(old => old.filter(x => x.id !== id)); setNotice(approve ? "تم اعتماد المعلم." : "تم رفض الطلب."); }
    setBusy(false);
  }

  const completedCount = useMemo(() => attempts.filter(a => a.status === "SUBMITTED").length, [attempts]);
  const currentQuestion = activeExam?.questions[activeExam.index];
  const timeLabel = activeExam ? Math.floor(activeExam.secondsLeft / 60).toString().padStart(2, "0") + ":" + (activeExam.secondsLeft % 60).toString().padStart(2, "0") : "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {profile && <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white"><img src="/quizora-icon.svg" alt="Quizora" className="h-full w-full object-cover"/></span>
            <span><b className="block text-lg">Quizora</b><small className="text-xs text-slate-500">التعليم والاختبارات</small></span>
          </div>
          <nav className="hidden items-center gap-2 text-sm font-semibold md:flex">{([{id:"workspace",label:"مساحة العمل"},{id:"exams",label:"الامتحانات المتاحة"},{id:"stats",label:"الإحصائيات"},{id:"dashboard",label:"لوحة التحكم"}] as const).map(item=><button key={item.id} onClick={()=>{setActivePage(item.id);if(item.id==="dashboard"&&profile.role==="ADMIN")void loadAdminAccounts();}} className={"rounded-xl px-3 py-2 "+(activePage===item.id?"bg-blue-700 text-white":"text-slate-600 hover:bg-slate-100")}>{item.label}</button>)}</nav>
          <div className="hidden items-center gap-3 md:flex">
            {profile ? <><span className="text-sm font-bold">مرحبًا، {profile.name}</span><button className={secondaryClass} onClick={signOut}><LogOut size={17}/> خروج</button></> :
              <><button className={secondaryClass} onClick={() => { setAuthMode("login"); setAuthError(""); }}>دخول</button><button className={primaryClass} onClick={() => { setAuthMode("register"); setAuthError(""); }}>إنشاء حساب</button></>}
          </div>
          <button className="rounded-xl border p-2 md:hidden" onClick={() => setMobileMenu(v => !v)} aria-label="القائمة">{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
        {mobileMenu && <div className="grid gap-2 border-t bg-white p-4 md:hidden">
          {([{id:"workspace",label:"مساحة العمل"},{id:"exams",label:"الامتحانات المتاحة"},{id:"stats",label:"الإحصائيات"},{id:"dashboard",label:"لوحة التحكم"}] as const).map(item=><button key={item.id} onClick={()=>{setActivePage(item.id);setMobileMenu(false);if(item.id==="dashboard"&&profile?.role==="ADMIN")void loadAdminAccounts();}} className="rounded-lg p-3 text-right">{item.label}</button>)}
          {profile ? <><button className={secondaryClass} onClick={signOut}><LogOut size={17}/> تسجيل الخروج</button></> :
            <><button className={secondaryClass} onClick={() => { setAuthMode("login"); setMobileMenu(false); }}>تسجيل الدخول</button><button className={primaryClass} onClick={() => { setAuthMode("register"); setMobileMenu(false); }}>إنشاء حساب</button></>}
        </div>}
      </header>}

      {!profile && <section id="home" className="bg-gradient-to-bl from-blue-950 via-blue-900 to-indigo-900 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-6 md:grid-cols-[1.3fr_.7fr] md:py-24">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><ShieldCheck size={16}/> تعليم منظم وتقييم موثوق</span>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">اختباراتك ودراستك<br/><span className="text-blue-200">في مكان واحد</span></h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">منصة تجمع الامتحانات الإلكترونية، متابعة النتائج، وإدارة المحتوى التعليمي للطلاب والمعلمين.</p>
            <div className="mt-8 flex flex-wrap gap-3">{profile ? <a href="#dashboard" className="rounded-xl bg-white px-6 py-3 font-black text-blue-900">اذهب إلى لوحة التحكم <ChevronLeft className="mr-2 inline"/></a> : <><button className="rounded-xl bg-white px-6 py-3 font-black text-blue-900" onClick={() => setAuthMode("register")}>ابدأ الآن</button><button className="rounded-xl border border-white/40 px-6 py-3 font-bold" onClick={() => setAuthMode("login")}>تسجيل الدخول</button></>}</div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur"><div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-5"><BookOpen className="text-blue-200"/><p className="mt-4 text-3xl font-black">{quizzes.length}</p><p className="mt-1 text-sm text-blue-100">امتحان متاح</p></div>
            <div className="rounded-2xl bg-white/10 p-5"><Award className="text-blue-200"/><p className="mt-4 text-3xl font-black">{completedCount}</p><p className="mt-1 text-sm text-blue-100">محاولة مكتملة</p></div>
            <div className="col-span-2 rounded-2xl bg-white/10 p-5"><ShieldCheck className="text-blue-200"/><p className="mt-3 font-bold">حفظ تلقائي للإجابات</p><p className="mt-1 text-sm leading-6 text-blue-100">تُحفظ إجاباتك أثناء الامتحان وتُحسب النتيجة عند التسليم.</p></div>
          </div></div>
        </div>
      </section>}

      {notice && <div className="mx-auto mt-5 max-w-7xl px-5 sm:px-6"><div role="status" className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="إغلاق"><X size={18}/></button></div></div>}

      {profile && <section id="dashboard" className="scroll-mt-24 py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-blue-700">{activePage==="workspace"?"مساحة العمل":activePage==="exams"?"الامتحانات المتاحة":activePage==="stats"?"الإحصائيات":"لوحة التحكم"}</p><h2 className="mt-2 text-3xl font-black">أهلًا {profile.name}</h2><p className="mt-2 text-slate-500">{profile.role === "TEACHER" ? "إدارة المواد والاختبارات والطلاب" : profile.role === "ADMIN" ? "إدارة المنصة واعتماد حسابات المعلمين" : "تابع اختباراتك ونتائجك"}</p></div><button className={secondaryClass} onClick={() => void loadWorkspace()} disabled={historyLoading}><RefreshCw size={17} className={historyLoading ? "animate-spin" : ""}/> تحديث البيانات</button></div>

          {profile.role === "TEACHER" && activePage === "workspace" && <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="flex items-center gap-2 text-xl font-black"><BookOpen className="text-blue-700"/> المواد الدراسية</h3>
              <form onSubmit={createSubject} className="mt-5 space-y-3"><input className={inputClass} required value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="اسم المادة"/><textarea className={inputClass} value={subjectDescription} onChange={e => setSubjectDescription(e.target.value)} placeholder="وصف مختصر للمادة" rows={2}/><button className={primaryClass} disabled={busy}><Plus size={17}/> إضافة مادة</button></form>
              <div className="mt-5 space-y-2">{subjects.map(s => <div key={s.id} className="rounded-xl bg-slate-50 p-3"><b>{s.name}</b>{s.description && <p className="mt-1 text-sm text-slate-500">{s.description}</p>}</div>)}{!subjects.length && <p className="text-sm text-slate-400">لم تضف مواد بعد.</p>}</div>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="flex items-center gap-2 text-xl font-black"><ClipboardList className="text-blue-700"/> إنشاء امتحان</h3>
              <form onSubmit={createQuiz} className="mt-5 space-y-3"><input className={inputClass} required value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="عنوان الامتحان"/><textarea className={inputClass} value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} placeholder="وصف وتعليمات الامتحان" rows={2}/><select className={inputClass} required value={quizForm.subject_id} onChange={e => setQuizForm({ ...quizForm, subject_id: e.target.value })}><option value="">اختر المادة</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><label className="block text-sm font-semibold">مدة الامتحان بالدقائق<input className={inputClass + " mt-2"} type="number" min={1} max={300} value={quizForm.duration_minutes} onChange={e => setQuizForm({ ...quizForm, duration_minutes: Number(e.target.value) })}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">موعد بدء الامتحان<input className={inputClass + " mt-2"} type="datetime-local" value={quizForm.starts_at} onChange={e => setQuizForm({...quizForm,starts_at:e.target.value})}/><small className="text-xs text-slate-400">اتركه فارغًا للإتاحة فور النشر.</small></label><label className="block text-sm font-semibold">آخر موعد لبدء الامتحان<input className={inputClass + " mt-2"} type="datetime-local" min={quizForm.starts_at || undefined} value={quizForm.ends_at} onChange={e => setQuizForm({...quizForm,ends_at:e.target.value})}/><small className="text-xs text-slate-400">بعده لن تبدأ محاولات جديدة.</small></label></div><button className={primaryClass} disabled={busy || !subjects.length}><Plus size={17}/> حفظ الامتحان</button></form>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2"><h3 className="text-xl font-black">إضافة سؤال اختيار من متعدد</h3>
              <form onSubmit={addQuestion} className="mt-5 grid gap-3 md:grid-cols-2"><select className={inputClass} required value={questionForm.quiz_id} onChange={e => setQuestionForm({ ...questionForm, quiz_id: e.target.value })}><option value="">اختر الامتحان</option>{quizzes.filter(q => !q.published).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}</select><input className={inputClass} required value={questionForm.body} onChange={e => setQuestionForm({ ...questionForm, body: e.target.value })} placeholder="نص السؤال"/><textarea className={inputClass} required rows={5} value={questionForm.options} onChange={e => setQuestionForm({ ...questionForm, options: e.target.value })} placeholder={"اكتب كل اختيار في سطر مستقل"}/><div className="space-y-3"><input className={inputClass} type="number" min={1} value={questionForm.correct} onChange={e => setQuestionForm({ ...questionForm, correct: e.target.value })} placeholder="رقم الإجابة الصحيحة"/><input className={inputClass} type="number" min={0.5} step={0.5} value={questionForm.points} onChange={e => setQuestionForm({ ...questionForm, points: e.target.value })} placeholder="درجة السؤال"/></div><button className={primaryClass + " md:col-span-2"} disabled={busy || !questionForm.quiz_id}><Plus size={17}/> حفظ السؤال</button></form>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2"><h3 className="flex items-center gap-2 text-xl font-black"><BarChart3 className="text-blue-700"/> نتائج الطلاب ومخالفات النزاهة</h3><div className="mt-5 space-y-3">{teacherResults.map((r: any) => <div key={r.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{r.student?.full_name || r.student?.email || "طالب"}</b><p className="mt-1 text-sm text-slate-500">{r.quizzes?.title || "امتحان"}</p></div><div className="text-left"><b className="text-blue-800">{r.score ?? "—"}</b><p className="text-xs text-slate-500">{r.status === "SUBMITTED" ? "تم التسليم" : r.status === "LOCKED" ? "مغلق بسبب مخالفات" : "قيد التنفيذ"}</p></div></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span>الإنذارات: {r.strikes}/3</span><span>تاريخ البدء: {new Date(r.started_at).toLocaleString("ar-EG")}</span></div>{r.events?.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><b>سجل المخالفات</b>{r.events.map((event: any) => <p key={event.id} className="mt-1">{event.strike_number}. {event.event_type === "TAB_HIDDEN" ? "مغادرة صفحة الامتحان" : event.event_type === "FULLSCREEN_EXIT" ? "الخروج من ملء الشاشة" : "فقدان تركيز النافذة"} — {new Date(event.occurred_at).toLocaleString("ar-EG")}</p>)}</div>}</div>)}{!teacherResults.length && <p className="text-sm text-slate-400">ستظهر محاولات الطلاب ونتائجهم هنا بعد بدء الامتحانات.</p>}</div></div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2"><h3 className="text-xl font-black">الاختبارات التي أنشأتها</h3><div className="mt-5 grid gap-3 md:grid-cols-2">{quizzes.map(q => <div key={q.id} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-3"><div><b>{q.title}</b><p className="mt-1 text-sm text-slate-500">{subjects.find(s => s.id === q.subject_id)?.name} • {q.duration_minutes} دقيقة</p></div><span className={"rounded-full px-3 py-1 text-xs font-bold " + (q.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{q.published ? "منشور" : "مسودة"}</span></div>{!q.published && <button className={primaryClass + " mt-4"} onClick={() => void publishQuiz(q.id)} disabled={busy}>نشر الامتحان</button>}</div>)}{!quizzes.length && <p className="text-sm text-slate-400">لم تنشئ اختبارات بعد.</p>}</div></div>
          </div>}

          {profile.role === "STUDENT" && activePage === "exams" && <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div id="available-exams" className="scroll-mt-24 rounded-3xl border bg-white p-6 shadow-sm"><h3 className="flex items-center gap-2 text-xl font-black"><BookOpen className="text-blue-700"/> الامتحانات المتاحة</h3><div className="mt-5 space-y-3">{quizzes.map(q => <div key={q.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><b className="text-lg">{q.title}</b><p className="mt-1 text-sm text-slate-500">{q.subjects?.name || "مادة دراسية"} • {q.duration_minutes} دقيقة</p>{q.description && <p className="mt-2 text-sm leading-6 text-slate-600">{q.description}</p>}{q.starts_at && <p className="mt-2 text-xs text-blue-700">موعد البداية: {new Date(q.starts_at).toLocaleString("ar-EG")}</p>}{q.ends_at && <p className="mt-1 text-xs text-slate-500">آخر موعد للبدء: {new Date(q.ends_at).toLocaleString("ar-EG")}</p>}</div><button className={primaryClass} onClick={() => void startExam(q)} disabled={busy || (!!q.starts_at && Date.now()<new Date(q.starts_at).getTime()) || (!!q.ends_at && Date.now()>=new Date(q.ends_at).getTime())}><Play size={16}/>{q.ends_at && Date.now()>=new Date(q.ends_at).getTime()?"انتهى":q.starts_at && Date.now()<new Date(q.starts_at).getTime()?"لم يبدأ بعد":"ابدأ الامتحان"}</button></div></div>)}{!quizzes.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">لا توجد امتحانات منشورة حاليًا.</p>}</div></div>
            <div className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="flex items-center gap-2 text-xl font-black"><BarChart3 className="text-blue-700"/> سجل النتائج</h3><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-blue-50 p-4"><p className="text-2xl font-black text-blue-800">{attempts.length}</p><p className="mt-1 text-xs text-slate-500">كل المحاولات</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-black text-emerald-800">{completedCount}</p><p className="mt-1 text-xs text-slate-500">امتحانات مكتملة</p></div></div><div className="mt-4 space-y-2">{attempts.map(a => <div key={a.id} className="rounded-xl border p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{a.quizzes?.title || "امتحان"}</b><span className="text-xs text-slate-500">{a.status === "SUBMITTED" ? "مكتمل" : a.status === "LOCKED" ? "مغلق" : "قيد التنفيذ"}</span></div>{a.status === "SUBMITTED" && <p className="mt-2 text-sm font-bold text-emerald-700">الدرجة: {a.score ?? 0}</p>}<p className="mt-1 text-xs text-slate-400">{new Date(a.started_at).toLocaleString("ar-EG")}</p></div>)}{!attempts.length && <p className="text-sm text-slate-400">ستظهر نتائجك هنا بعد أداء الامتحانات.</p>}</div>
              {teacherStatus && <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">طلب المعلم: {teacherStatus === "PENDING" ? "قيد المراجعة" : teacherStatus === "APPROVED" ? "تمت الموافقة" : "مرفوض"}</div>}
              {!teacherStatus && <button className={secondaryClass + " mt-5 w-full"} onClick={async () => { setBusy(true); const { error } = await supabase.from("teacher_requests").insert({ user_id: profile.id, note: "طلب تفعيل حساب معلم" }); setNotice(error ? error.message : "تم إرسال طلب اعتماد المعلم."); if (!error) setTeacherStatus("PENDING"); setBusy(false); }} disabled={busy}>طلب حساب معلم</button>}
            </div>
          </div>}

          {profile.role === "ADMIN" && activePage === "dashboard" && <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm"><div className="mb-8"><h3 className="flex items-center gap-2 text-xl font-black"><Users className="text-blue-700"/> الحسابات المتاحة</h3><div className="mt-4 flex gap-3"><button className={adminAccountRole==="TEACHER"?primaryClass:secondaryClass} onClick={()=>{setAdminAccountRole("TEACHER");void loadAdminAccounts("TEACHER");}}>معلم</button><button className={adminAccountRole==="STUDENT"?primaryClass:secondaryClass} onClick={()=>{setAdminAccountRole("STUDENT");void loadAdminAccounts("STUDENT");}}>طالب</button></div><div className="mt-4 space-y-3">{accountsLoading?<p>جارٍ تحميل الحسابات...</p>:adminAccounts.map(account=><div key={account.id} className="flex items-center justify-between gap-3 rounded-xl border p-4"><div><b>{account.full_name}</b><p className="text-sm text-slate-500">{account.email}</p></div><button className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700" disabled={busy} onClick={()=>void deleteAdminAccount(account)}><Trash2 size={16} className="inline"/> حذف الحساب</button></div>)}{!accountsLoading&&!adminAccounts.length&&<p className="text-sm text-slate-500">لا توجد حسابات في هذه القائمة.</p>}</div></div><h3 className="flex items-center gap-2 text-xl font-black"><Users className="text-blue-700"/> طلبات اعتماد المعلمين</h3><div className="mt-5 space-y-3">{teacherRequests.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"><div><b>{r.profile?.full_name || "حساب جديد"}</b><p className="text-sm text-slate-500">{r.profile?.email || r.user_id}</p></div><div className="flex gap-2"><button className={primaryClass} onClick={() => void reviewTeacher(r.id, true)} disabled={busy}>اعتماد</button><button className={secondaryClass} onClick={() => void reviewTeacher(r.id, false)} disabled={busy}>رفض</button></div></div>)}{!teacherRequests.length && <p className="text-sm text-slate-500">لا توجد طلبات معلقة.</p>}</div></div>}
        </div>
      </section>}

      {!profile && false && <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6"><div className="grid gap-5 md:grid-cols-3">{[
        { icon: BookOpen, title: "اختبارات منظمة", body: "امتحانات بمدة محددة وأسئلة مرتبة ونتائج محفوظة." },
        { icon: ShieldCheck, title: "نزاهة الامتحان", body: "تسجيل مغادرة شاشة الامتحان والتنبيه عند تكرار المخالفة." },
        { icon: BarChart3, title: "متابعة الأداء", body: "سجل للمحاولات والدرجات يساعدك على متابعة تقدمك." }
      ].map(item => <div key={item.title} className="rounded-3xl border bg-white p-6 shadow-sm"><item.icon className="text-blue-700" size={28}/><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 leading-7 text-slate-500">{item.body}</p></div>)}</div><div className="mt-12 rounded-3xl bg-blue-50 p-8 text-center"><h2 className="text-2xl font-black">ابدأ رحلتك التعليمية</h2><p className="mt-2 text-slate-600">أنشئ حسابًا للوصول إلى الامتحانات ومتابعة النتائج.</p><button className={primaryClass + " mt-5"} onClick={() => setAuthMode("register")}>إنشاء حساب جديد</button></div></section>}

      {profile && activePage === "stats" && <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6"><h2 className="text-3xl font-black">الإحصائيات والنتائج</h2>{profile.role==="STUDENT" ? <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-3xl border bg-white p-6"><p className="text-3xl font-black text-blue-800">{attempts.length}</p><p className="text-sm text-slate-500">إجمالي المحاولات</p></div><div className="rounded-3xl border bg-white p-6"><p className="text-3xl font-black text-emerald-700">{completedCount}</p><p className="text-sm text-slate-500">امتحانات مكتملة</p></div></div> : profile.role==="TEACHER" ? <div className="mt-6 rounded-3xl border bg-white p-6"><h3 className="text-xl font-black">نتائج الطلاب</h3><div className="mt-4 space-y-3">{teacherResults.map((r:any)=><div key={r.id} className="flex items-center justify-between rounded-xl border p-4"><div><b>{r.student?.full_name || "طالب"}</b><p className="text-sm text-slate-500">{r.quizzes?.title || "امتحان"}</p></div><b className="text-blue-800">{r.score ?? "قيد التنفيذ"}</b></div>)}{!teacherResults.length&&<p className="text-sm text-slate-500">لا توجد نتائج حتى الآن.</p>}</div></div> : <div className="mt-6 rounded-3xl border bg-white p-6">عدد طلبات المعلمين المعلقة: {teacherRequests.length}</div>}</section>}
      <footer className="border-t bg-white px-5 py-8 text-center text-sm text-slate-500">© 2026 Quizora — منصة التعليم والاختبارات</footer>

      {recoveryMode && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"><div className="my-6 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><LockKeyhole/></div><h2 className="mt-5 text-2xl font-black">تعيين كلمة مرور جديدة</h2><p className="mt-2 text-sm leading-6 text-slate-500">اكتب كلمة مرور جديدة لحسابك ثم أكدها.</p><form onSubmit={saveNewPassword} className="mt-5 space-y-3"><input className={inputClass} name="newPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="كلمة المرور الجديدة"/><input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="تأكيد كلمة المرور"/><button className={primaryClass + " w-full"} type="submit" disabled={busy}>{busy ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور"}</button></form>{authError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{authError}</p>}</div></div>}

      {forgotMode && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"><div className="my-6 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><LockKeyhole/></span><button onClick={() => { setForgotMode(false); setAuthError(""); }} className="rounded-xl p-2 hover:bg-slate-100" aria-label="إغلاق"><X/></button></div><h2 className="mt-5 text-2xl font-black">استعادة كلمة المرور</h2><p className="mt-2 text-sm leading-6 text-slate-500">اكتب بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور.</p><form onSubmit={requestPasswordReset} className="mt-5 space-y-3"><input className={inputClass} name="recoveryEmail" type="email" autoComplete="email" required defaultValue={recoveryEmail} placeholder="البريد الإلكتروني"/><button className={primaryClass + " w-full"} type="submit" disabled={busy}>{busy ? "جارٍ إرسال الرابط..." : "إرسال رابط الاستعادة"}</button></form>{authError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{authError}</p>}<button className="mt-5 w-full text-sm font-bold text-blue-700" onClick={() => { setForgotMode(false); setAuthMode("login"); setAuthError(""); }}>العودة لتسجيل الدخول</button></div></div>}

      {authMode && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={e => { if (profile && e.target === e.currentTarget) setAuthMode(null); }}><div className="my-6 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><LockKeyhole/></span>{profile && {profile && <button onClick={() => setAuthMode(null)} className="rounded-xl p-2 hover:bg-slate-100" aria-label="إغلاق"><X/></button>}}</div><h2 className="mt-5 text-2xl font-black">{authMode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">أدخل بياناتك للوصول إلى حسابك.</p>{authMode === "register" && <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setAuthRole("STUDENT")} className={"rounded-xl border p-3 font-bold " + (authRole === "STUDENT" ? "border-blue-700 bg-blue-50 text-blue-800" : "")}>طالب</button><button type="button" onClick={() => setAuthRole("TEACHER")} className={"rounded-xl border p-3 font-bold " + (authRole === "TEACHER" ? "border-blue-700 bg-blue-50 text-blue-800" : "")}>معلم</button></div>}<form onSubmit={handleAuth} className="mt-5 space-y-3">{authMode === "register" && <input className={inputClass} name="fullName" minLength={2} required placeholder="الاسم بالكامل"/>}<input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="البريد الإلكتروني"/><input className={inputClass} name="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="كلمة المرور (8 أحرف على الأقل)"/><button className={primaryClass + " w-full"} type="submit" disabled={busy}>{busy ? "جارٍ التنفيذ..." : authMode === "login" ? "دخول" : "إنشاء الحساب"}</button></form>{authMode === "login" && <button type="button" className="mt-4 w-full text-right text-sm font-bold text-blue-700" onClick={() => { setForgotMode(true); setAuthError(""); }}>نسيت كلمة المرور؟</button>}{authError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{authError}</p>}<button className="mt-5 w-full text-sm font-bold text-blue-700" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "ليس لديك حساب؟ أنشئ حسابًا" : "لديك حساب؟ سجل الدخول"}</button></div></div>}

      {activeExam && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-5"><div className="my-4 w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-blue-700">امتحان إلكتروني</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{activeExam.quiz.title}</h2></div><div className="rounded-xl bg-blue-50 px-3 py-2 text-lg font-black text-blue-800"><Clock3 className="ml-1 inline" size={17}/>{timeLabel}</div></div>
        {activeExam.locked ? <div className="py-12 text-center"><LockKeyhole className="mx-auto text-red-600" size={54}/><h3 className="mt-4 text-2xl font-black text-red-700">تم إغلاق المحاولة</h3><p className="mt-3 text-slate-600">تم تسجيل ثلاث مخالفات. تواصل مع المعلم إذا كنت ترى أن الإغلاق غير صحيح.</p><button className={primaryClass + " mt-6"} onClick={() => { setActiveExam(null); setIntegrityMessage(""); void loadWorkspace(); }}>إغلاق</button></div> :
        activeExam.result !== null ? <div className="py-12 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={54}/><h3 className="mt-4 text-2xl font-black">تم تسليم الامتحان</h3><p className="mt-3 text-3xl font-black text-blue-800">{activeExam.result}</p><p className="mt-1 text-sm text-slate-500">درجتك النهائية</p><button className={primaryClass + " mt-6"} onClick={() => { setActiveExam(null); setIntegrityMessage(""); void loadWorkspace(); }}>العودة إلى لوحة التحكم</button></div> :
        <><div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span>السؤال {activeExam.index + 1} من {activeExam.questions.length}</span><span>{activeExam.strikes}/3 إنذارات</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: (((activeExam.index + 1) / activeExam.questions.length) * 100) + "%" }}/></div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={17}/> مراقبة نزاهة الامتحان</div><p className="mt-1">مغادرة صفحة الامتحان أو الخروج من ملء الشاشة تُسجل كمخالفة. عند ثلاث مخالفات تُقفل المحاولة.</p>{integrityMessage && <p role="alert" className="mt-2 font-bold">{integrityMessage}</p>}</div>
          {currentQuestion && <><h3 className="mt-7 text-lg font-black leading-8">{currentQuestion.body}</h3><p className="mt-1 text-xs text-slate-400">درجة السؤال: {currentQuestion.points}</p><div className="mt-5 space-y-3">{currentQuestion.options.map((o, i) => <button key={o.id} onClick={() => void chooseOption(o.id)} className={"w-full rounded-xl border p-4 text-right transition " + (activeExam.selected[currentQuestion.id] === o.id ? "border-blue-700 bg-blue-50 font-bold text-blue-800" : "border-slate-200 hover:border-blue-300")}>{String.fromCharCode(1571 + i) + ") " + o.body}</button>)}</div></>}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><button className={secondaryClass} disabled={activeExam.index === 0} onClick={() => setActiveExam(old => old ? { ...old, index: old.index - 1 } : old)}>السابق</button>{activeExam.index < activeExam.questions.length - 1 ? <button className={primaryClass} onClick={() => setActiveExam(old => old ? { ...old, index: old.index + 1 } : old)}>التالي <ChevronLeft size={17}/></button> : <button className={primaryClass} disabled={busy} onClick={() => void finishExam(false)}><Send size={17}/> تسليم الامتحان</button>}</div>
        </>}
      </div></div>}
      {authLoading && <div className="fixed inset-0 z-[60] grid place-items-center bg-white/80"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-blue-700" size={30}/><p className="mt-3 font-bold text-slate-600">جارٍ تحميل المنصة...</p></div></div>}
    </main>
  );
}