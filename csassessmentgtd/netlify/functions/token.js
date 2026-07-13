const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async () => {
  try {
    const store = getStore("csrf-tokens");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutos

    await store.set(token, JSON.stringify({ expires }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudo generar el token" })
    };
  }
};
