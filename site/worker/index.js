// Задай локально или через `wrangler secret put` — не коммить настоящий токен в публичный репозиторий
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const CHAT_ID = "@my_art_orders";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "method not allowed" }, 405);
    }

    try {
      const { name, contact, created } = await request.json();
      if (!name || !contact) {
        return jsonResponse({ ok: false, error: "missing fields" }, 400);
      }

      const text = [
        "Новая заявка с сайта-визитки",
        "",
        "Имя: " + name,
        "Контакт: " + contact,
        "Когда: " + (created || new Date().toLocaleString("ru-RU")),
        "",
        "\u2014",
        "Подсказка: можно ответить клиенту и уточнить тип работы, сроки и референсы.",
      ].join("\n");

      const tgRes = await fetch(
        "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            disable_web_page_preview: true,
          }),
        }
      );

      const tgData = await tgRes.json();

      if (!tgData.ok) {
        return jsonResponse({ ok: false, error: tgData.description || "telegram error" }, 502);
      }

      return jsonResponse({ ok: true });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message }, 500);
    }
  },
};
