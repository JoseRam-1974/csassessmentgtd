const crypto = require("crypto");

function verifyToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, random, signature] = parts;
  const data = `${timestamp}.${random}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");

  // Verificar firma
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  // Verificar expiración (15 minutos)
  const age = Date.now() - parseInt(timestamp);
  if (age > 15 * 60 * 1000) return false;

  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Validar token CSRF
  const token = body.csrfToken;
  const secret = process.env.CSRF_SECRET;

  if (!token || !secret || !verifyToken(token, secret)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Token inválido o expirado" }) };
  }

  // Remover token del payload
  delete body.csrfToken;

  // Enviar al Apps Script
  const SHEETS_URL = process.env.APPS_SCRIPT_URL;
  if (!SHEETS_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing configuration" }) };
  }

  try {
    const response = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
