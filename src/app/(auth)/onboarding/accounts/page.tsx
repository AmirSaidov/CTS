"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, MapPin } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/form";
import { StepBar } from "@/shared/ui/stepper";
import { LinkedAccounts } from "@/features/account/linked-accounts";

export default function OnboardingAccountsPage() {
  const router = useRouter();
  const [city, setCity] = useState("Бишкек");
  const [saving, setSaving] = useState(false);

  return (
    <AuthShell
      slogan={
        <>
          Последний
          <br />
          шаг
        </>
      }
      sub="Привязка займёт меньше минуты."
    >
      <StepBar current={4} total={4} />
      <AuthTitle eyebrow="Онбординг" title="Привяжите аккаунты" sub="Организаторы проверяют игроков по игровым ID. Ранг и статистика подтянутся автоматически [ГДЕ ДОСТУПНО API]." />
      <LinkedAccounts
        variant="cards"
        next="/onboarding/accounts"
        accounts={[
          { kind: "riot", value: "AKTAN#KGZ", verified: true },
          { kind: "steam", value: null, verified: false },
          { kind: "discord", value: null, verified: false },
          { kind: "telegram", value: null, verified: false },
        ]}
      />
      <Field label="Город" htmlFor="city">
        <Input id="city" icon={MapPin} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
      </Field>
      <div className="flex gap-4">
        <Button size="lg" icon={ArrowLeft} href="/onboarding/games">
          Назад
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={Check}
          className="flex-1"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await api.saveOnboarding({ city });
            router.push("/me");
            router.refresh();
          }}
        >
          Готово
        </Button>
      </div>
    </AuthShell>
  );
}
