import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiRequestError } from "@/shared/api/client";
import { toast } from "./stores";

/**
 * Ошибки API {code, message, fields}: ошибки полей — под инпутами, общие — в root формы и тостом.
 * Имена полей Django (snake_case) уже переведены в camelCase в client.ts.
 */
export function applyServerErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>) {
  if (e instanceof ApiRequestError) {
    const fields = Object.entries(e.fields);
    for (const [name, msgs] of fields) setError(name as Path<T>, { type: "server", message: msgs[0] });
    if (!fields.length) {
      setError("root", { type: "server", message: e.message });
      toast.error(e.message);
    }
    return;
  }
  setError("root", { type: "server", message: "Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз." });
  toast.error("Нет связи с сервером");
}
