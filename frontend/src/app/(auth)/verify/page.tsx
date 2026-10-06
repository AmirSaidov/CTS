"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { ApiRequestError, isReal } from "@/shared/api/client";
import { toast } from "@/shared/lib/stores";
import { countdown } from "@/shared/lib/format";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { Button } from "@/shared/ui/button";
import { OtpInput } from "@/shared/ui/otp";
import { StepBar } from "@/shared/ui/stepper";

// бэкенд разрешает повторную отправку раз в 60 секунд
const RESEND_AFTER = 60;

function Verify() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "aktan@mail.kg";
  const isOrg = params.get("role") === "organizer";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(RESEND_AFTER);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const submit = async (value = code) => {
    if (value.length < 6) return setError("Введите все 6 цифр");
    setLoading(true);
    setError(null);
    try {
      await api.verify(value);
      // с API кабинет — из профиля (на /verify можно попасть и без ?role, например после входа)
      const me = isReal("me") ? await api.me().catch(() => null) : null;
      router.push((me ? me.defaultCabinet === "org" : isOrg) ? "/org" : "/me");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiRequestError ? (e.fields.code?.[0] ?? e.message) : "Нет связи с сервером");
      setLoading(false);
    }
  };

  return (
    <>
      <StepBar current={2} total={2} />
      <AuthTitle
        eyebrow="Подтверждение"
        title="Проверьте почту"
        sub={
          <>
            Мы отправили 6-значный код на <b className="text-text">{email}</b>. Введите его ниже.
          </>
        }
      />
      <div className="flex flex-col gap-3">
        <OtpInput
          value={code}
          invalid={!!error}
          autoFocus
          onChange={(v) => {
            setCode(v);
            setError(null);
            if (v.length === 6) submit(v);
          }}
        />
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        <div className="flex items-center justify-between">
          {left > 0 ? (
            <span className="mono text-[11px] tracking-[0.14em] text-text-3 uppercase" aria-live="polite">
              Отправить повторно через {countdown(left * 1000).slice(3)}
            </span>
          ) : (
            <button
              type="button"
              className="mono text-[11px] tracking-[0.14em] text-accent-hover uppercase hover:text-text"
              onClick={async () => {
                try {
                  await api.resendCode();
                  setLeft(RESEND_AFTER);
                  toast.success("Код отправлен ещё раз");
                } catch (e) {
                  toast.error("Не удалось отправить код", e instanceof ApiRequestError ? e.message : "Нет связи с сервером");
                }
              }}
            >
              Отправить код повторно
            </button>
          )}
          <Link href="/register" className="text-[14px] text-text-2 hover:text-text">
            Изменить почту
          </Link>
        </div>
      </div>
      <Button variant="primary" size="lg" icon={ArrowRight} loading={loading} block onClick={() => submit()}>
        Подтвердить
      </Button>
    </>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell
      slogan={
        <>
          Почти
          <br />
          готово
        </>
      }
      sub="Подтверждение защищает аккаунт и историю ваших турниров."
    >
      <Suspense>
        <Verify />
      </Suspense>
    </AuthShell>
  );
}
