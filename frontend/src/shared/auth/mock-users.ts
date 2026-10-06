import type { SessionUser } from "@/shared/api/types";
import { TEAMS_REF } from "@/shared/api/mocks/data";

/** Роли для dev-переключателя (cookie `cts_mock_role`). Только для режима моков. */
export const MOCK_ROLES = ["guest", "player", "captain", "organizer"] as const;
export type MockRole = (typeof MOCK_ROLES)[number];

export const MOCK_ROLE_LABELS: Record<MockRole, string> = {
  guest: "Гость",
  player: "Игрок",
  captain: "Капитан",
  organizer: "Организатор",
};

const base: SessionUser = {
  id: "u1",
  nick: "Aktan",
  tag: "AA",
  email: "aktan@mail.kg",
  phone: "+996 ••• ••• 588",
  fullName: "Aktan Sydykov",
  emailVerified: true,
  isPlayer: true,
  isOrganizer: false,
  isPlatformAdmin: false,
  captainOf: null,
  team: TEAMS_REF.tengri,
  org: null,
  defaultCabinet: "player",
  locale: "ru",
  unread: { notifications: 4, invites: 2 },
};

const org: NonNullable<SessionUser["org"]> = {
  slug: "club",
  name: "[Клуб] Cyber Arena",
  role: "owner",
  plan: "free",
  limits: { tournaments: [3, 3], staff: [3, 3], mailings: [412, 1000] },
};

export function mockUser(role: MockRole): SessionUser | null {
  switch (role) {
    case "guest":
      return null;
    case "player":
      return { ...base, nick: "Bolot", tag: "BO", fullName: "Bolot K." };
    case "captain":
      return { ...base, captainOf: "tengri" };
    case "organizer":
      return { ...base, captainOf: "tengri", isOrganizer: true, org, defaultCabinet: "org" };
  }
}
