import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "link";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variantClass = variant === "primary" ? "" : ` re-button--${variant}`;
  return <button className={`re-button${variantClass} ${className}`} {...props} />;
}

export function Chip({ pressed, children, ...props }: { pressed?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="re-chip" aria-pressed={pressed ?? false} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string | null }) {
  return (
    <div className="re-field">
      <label>{label}</label>
      {children}
      {error ? <span className="re-error-text">{error}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="re-input" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="re-textarea" {...props} />;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`re-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="re-badge">{children}</span>;
}

export function Banner({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return <div className={`re-banner${danger ? " re-banner--danger" : ""}`}>{children}</div>;
}
