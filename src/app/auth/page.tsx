"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { useT } from "@/lib/use-t";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.replace("/today");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const ar = lang === "ar";

  if (done) return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand-mark" style={{ margin: "0 auto 16px" }}>{ar ? "م" : "M"}</div>
        <h2 className="auth-title">{ar ? "تحقق من بريدك الإلكتروني" : "Check your email"}</h2>
        <p className="auth-sub">{ar ? "أرسلنا لك رابط تأكيد، افتحه لتفعيل حسابك." : "We sent you a confirmation link — open it to activate your account."}</p>
        <button className="btn primary" style={{ width: "100%", marginTop: 16 }} onClick={() => { setDone(false); setMode("login"); }}>
          {ar ? "العودة لتسجيل الدخول" : "Back to sign in"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand-mark" style={{ margin: "0 auto 16px" }}>{ar ? "م" : "M"}</div>
        <h2 className="auth-title">{mode === "login" ? (ar ? "تسجيل الدخول" : "Sign in") : (ar ? "إنشاء حساب" : "Create account")}</h2>
        <p className="auth-sub">{ar ? "بياناتك تُزامن بين أجهزتك تلقائياً" : "Your data syncs across all your devices"}</p>

        <div className="auth-fields">
          <label className="auth-label">{ar ? "البريد الإلكتروني" : "Email"}</label>
          <input className="auth-input" type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />

          <label className="auth-label">{ar ? "كلمة المرور" : "Password"}</label>
          <input className="auth-input" type="password" value={password} autoComplete={mode === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>

        {error && <p className="auth-error"><Icon name="circle-x" />{error}</p>}

        <button className="btn primary" style={{ width: "100%", marginTop: 8 }} onClick={submit} disabled={loading || !email || !password}>
          {loading ? (ar ? "جاري…" : "Please wait…") : mode === "login" ? (ar ? "دخول" : "Sign in") : (ar ? "إنشاء الحساب" : "Create account")}
        </button>

        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login"
            ? (ar ? "ليس لديك حساب؟ أنشئ واحداً" : "No account? Create one")
            : (ar ? "لديك حساب؟ سجّل دخولك" : "Have an account? Sign in")}
        </button>

        <button className="auth-skip" onClick={() => router.replace("/today")}>
          <Icon name="arrow-left" />{ar ? "تخطّ، استمر بدون حساب" : "Skip, continue without account"}
        </button>
      </div>
    </div>
  );
}
