import Link from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-2 [--cut:9px]",
  md: "h-11 px-5 text-[14px] gap-2.5 [--cut:10px]",
  lg: "h-14 px-7 text-[17px] gap-3 [--cut:14px]",
};

const VARIANTS: Record<Variant, string> = {
  // на экране одна главная кнопка — светлая заливка со срезом углов
  primary: "cut bg-primary text-primary-ink hover:bg-primary-hover",
  secondary: "border border-line-strong text-text hover:border-accent hover:bg-elev-2",
  ghost: "text-text-2 hover:text-text",
  danger: "border border-accent text-text hover:bg-elev-2",
  link: "text-text hover:text-accent-hover px-0! h-auto!",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  href?: string;
  block?: boolean;
}

export function buttonClass({ variant = "secondary", size = "md", block }: Pick<ButtonProps, "variant" | "size" | "block">) {
  return cn(
    "btn-text relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    // телефон: тач-цель от 44px, длинная подпись переносится вместо вылезания за экран
    "max-tab:h-auto max-tab:min-h-11 max-tab:shrink max-tab:py-2 max-tab:whitespace-normal max-tab:text-center",
    SIZES[size],
    VARIANTS[variant],
    block && "w-full",
  );
}

export function Button({ variant = "secondary", size = "md", icon: Icon, iconRight: IconRight, loading, href, block, className, children, disabled, ...rest }: ButtonProps) {
  const iconSize = size === "lg" ? 18 : 16;
  const content = (
    <>
      {loading ? <LoaderCircle size={iconSize} className="animate-spin" aria-hidden /> : Icon && <Icon size={iconSize} strokeWidth={1.75} aria-hidden />}
      {children}
      {IconRight && <IconRight size={iconSize} strokeWidth={1.75} aria-hidden />}
    </>
  );
  const cls = cn(buttonClass({ variant, size, block }), className);
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled || undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  size = 40,
  href,
  className,
  active,
  ...rest
}: { icon: LucideIcon; label: string; size?: 32 | 40; href?: string; active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(
    "relative inline-flex shrink-0 items-center justify-center border border-line text-text-2 transition-colors hover:border-line-strong hover:text-text",
    size === 32 ? "size-8" : "size-10",
    active && "border-accent text-text",
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls} aria-label={label} title={label}>
        <Icon size={16} strokeWidth={1.75} aria-hidden />
      </Link>
    );
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      <Icon size={16} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
