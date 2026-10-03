import { getLocale } from "next-intl/server";
import { LocaleSettings } from "@/features/settings/locale";

export const metadata = { title: "Язык и часовой пояс" };

export default async function LocalePage() {
  return <LocaleSettings locale={await getLocale()} />;
}
