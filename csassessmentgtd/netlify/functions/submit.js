const { getStore } = require("@netlify/blobs");

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
  if (!token) {
    return { statusCode: 403, body: JSON.stringify({ error: "Token requerido" }) };
  }

  try {
    const store = getStore("csrf-tokens");
    const entry = await store.get(token);

    if (!entry) {
      return { statusCode: 403, body: JSON.stringify({ error: "Token inválido" }) };
    }

    const { expires } = JSON.parse(entry);
    if (Date.now() > expires) {
      await store.delete(token);
      return { statusCode: 403, body: JSON.stringify({ error: "Token expirado" }) };
    }

    // Token válido — eliminar para que no se reutilice
    await store.delete(token);

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error validando token" }) };
  }

  // Enviar al Apps Script
  const SHEETS_URL = process.env.APPS_SCRIPT_URL;
  if (!SHEETS_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing configuration" }) };
  }

  // Remover el token del payload antes de enviar al Sheet
  delete body.csrfToken;

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
