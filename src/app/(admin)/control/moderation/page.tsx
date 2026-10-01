import { api } from "@/shared/api/endpoints";
import { ModerationScreen } from "@/features/control/moderation";

export const metadata = { title: "Модерация" };

export default async function ModerationPage() {
  return <ModerationScreen initial={[...(await api.moderation())]} />;
}
