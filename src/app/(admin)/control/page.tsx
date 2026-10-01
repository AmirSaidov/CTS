import { redirect } from "next/navigation";

/** Экрана «Обзор» в макете нет — до его отрисовки пункт ведёт на «Пользователи» */
export default function ControlIndex() {
  redirect("/control/users");
}
