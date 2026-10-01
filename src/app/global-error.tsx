"use client";

/** Падение корневого layout: без шрифтов и провайдеров, только инлайн-стили в токенах */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ background: "#0b0d11", color: "#fff", fontFamily: "system-ui, sans-serif", minHeight: "100dvh", display: "grid", placeItems: "center", margin: 0 }}>
        <main style={{ maxWidth: 520, padding: 24 }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.16em", color: "#8ba3be" }}>ERR.500 // ОШИБКА СЕРВЕРА</p>
          <h1 style={{ fontSize: 56, lineHeight: 1, textTransform: "uppercase", margin: "16px 0" }}>Сервер упал</h1>
          <p style={{ color: "#b3b9c2" }}>Что-то пошло не так на нашей стороне. Мы уже знаем и чиним.</p>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#5c636e" }}>REQ-ID {error.digest ?? "—"}</p>
          <button onClick={() => reset()} style={{ marginTop: 16, height: 44, padding: "0 20px", background: "#d5dbe3", color: "#0b0d11", border: 0, fontWeight: 600, textTransform: "uppercase", cursor: "pointer" }}>
            Обновить страницу
          </button>
        </main>
      </body>
    </html>
  );
}
