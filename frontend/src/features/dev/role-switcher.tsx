"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import { MOCK_ROLES, MOCK_ROLE_LABELS, type MockRole } from "@/shared/auth/mock-users";
import { useUser } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { setMockRole } from "@/features/auth/mock-session";

/** Только для NEXT_PUBLIC_API_MOCKS=1: переключение роли, чтобы посмотреть все кабинеты без бэкенда. */
export function DevRoleSwitcher() {
  const router = useRouter();
  const user = useUser();
  const [open, setOpen] = useState(false);

  const current: MockRole = !user ? "guest" : user.isPlatformAdmin ? "admin" : user.org?.role === "judge" ? "judge" : user.isOrganizer ? "organizer" : user.captainOf ? "captain" : "player";

  const pick = (r: MockRole) => {
    setMockRole(r);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 max-tab:bottom-20">
      {open && (
        <div className="mb-2 flex w-56 flex-col border border-line-strong bg-elev-1 p-1">
          <span className="mono-label px-3 pt-2 pb-1">DEV · роль (моки)</span>
          {MOCK_ROLES.map((r) => (
            <button key={r} type="button" onClick={() => pick(r)} className={cn("px-3 py-2 text-left text-[13px] hover:bg-elev-2", r === current && "bg-elev-2 font-semibold")}>
              {MOCK_ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} className="mono flex h-9 items-center gap-2 border border-dashed border-text-4 bg-bg px-3 text-[10px] tracking-[0.14em] text-text-3 uppercase hover:text-text" aria-expanded={open}>
        <UserCog size={14} aria-hidden /> {MOCK_ROLE_LABELS[current]}
      </button>
    </div>
  );
}
