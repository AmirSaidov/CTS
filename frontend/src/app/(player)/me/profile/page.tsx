import { api } from "@/shared/api/endpoints";
import { ProfileForm } from "@/features/player/profile-form";

export const metadata = { title: "Мой профиль" };

export default async function MyProfilePage() {
  const player = await api.myProfile();
  return <ProfileForm player={player} />;
}
