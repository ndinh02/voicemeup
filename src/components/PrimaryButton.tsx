import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
};

export default function PrimaryButton({ variant = "solid", className = "", ...rest }: Props) {
  const base = "w-full rounded-full px-6 py-4 text-center font-mono text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const styles =
    variant === "solid"
      ? "bg-ink text-paper"
      : "border-2 border-ink bg-transparent text-ink";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
