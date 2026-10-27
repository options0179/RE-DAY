import { Link } from "react-router-dom";
import { PublicHeader } from "../components/layout";
import { useAuth } from "../lib/auth";

const STEPS = [
  { step: "01", label: "직업 설정" },
  { step: "02", label: "상황 대응" },
  { step: "03", label: "결과 확인" },
  { step: "04", label: "회고" },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div>
      <PublicHeader />
      <div className="re-container">
        <p style={{ color: "var(--re-ink-muted)" }}>RE:DAY / 직업의 하루를 경험하다</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.3 }}>다른 직업의 하루를
          살아본다면?</h1>
        <p style={{ fontSize: 16, color: "var(--re-ink-muted)", maxWidth: 480 }}>
          상황을 마주하고, 직접 선택하고, 그 선택이 만든 하루를 돌아보세요.
        </p>
        <Link to={user ? "/home" : "/login"} className="re-button" style={{ display: "inline-flex", marginTop: 16 }}>
          나의 하루 체험하기
        </Link>

        <div style={{ display: "flex", gap: 16, marginTop: 48, flexWrap: "wrap" }}>
          {STEPS.map((item) => (
            <div key={item.step} className="re-card" style={{ flex: "1 1 160px" }}>
              <div style={{ color: "var(--re-accent)", fontWeight: 700 }}>{item.step}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
