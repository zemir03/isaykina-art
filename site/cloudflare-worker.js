// Замени на токен бота (не храни реальный токен в публичном репо)
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const CHAT_ID = "@my_art_orders";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const { name, contact, created } = await request.json();
    if (!name || !contact) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing fields" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const text = [
      "Новая заявка с сайта-визитки",
      "",
      "Имя: " + name,
      "Контакт: " + contact,
      "Когда: " + (created || new Date().toLocaleString("ru-RU")),
      "",
      "—",
      "Подсказка: можно ответить клиенту и уточнить тип работы, сроки и референсы.",
    ].join("\n");

    const tgRes = await fetch(
      "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          disable_web_page_preview: true,
        }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: tgData.description || "telegram error" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}
