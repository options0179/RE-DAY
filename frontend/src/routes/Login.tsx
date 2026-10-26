import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "../components/layout";
import { Button, Field, TextInput } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

type Mode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const signup = await api.auth.signup({ email, password, displayName });
        // 이메일 발송 인프라가 없는 로컬/MVP 환경 — devVerificationToken으로 즉시 인증 처리.
        await api.auth.verifyEmail(signup.devVerificationToken);
        setNotice("회원가입과 이메일 인증이 완료됐습니다. 로그인해주세요.");
        setMode("login");
      } else {
        const response = await api.auth.login({ email, password });
        login(response.accessToken, response.user);
        navigate("/home");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "요청을 처리하지 못했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PublicHeader />
      <div className="re-container" style={{ maxWidth: 420 }}>
        <h1>RE:DAY 시작하기</h1>
        <p style={{ color: "var(--re-ink-muted)" }}>{mode === "login" ? "로그인" : "회원가입"}</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          <Field label="이메일 입력">
            <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="비밀번호 입력">
            <TextInput type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {mode === "signup" ? (
            <Field label="표시 이름">
              <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
          ) : null}

          {error ? <span className="re-error-text">{error}</span> : null}
          {notice ? <span style={{ color: "var(--re-ink-muted)", fontSize: 13 }}>{notice}</span> : null}

          <Button type="submit" disabled={submitting}>
            {mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, color: "var(--re-ink-muted)" }}>
          {mode === "login" ? "처음 오셨나요?" : "이미 계정이 있나요?"}{" "}
          <Button variant="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "회원가입" : "로그인"}
          </Button>
        </p>
      </div>
    </div>
  );
}
