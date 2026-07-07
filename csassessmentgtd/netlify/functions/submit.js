exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const origin = event.headers.origin || "";
  const allowed = [
    "https://csdiagnosticogtd.netlify.app",
    "https://assessment.gtd.cl"
  ];
  if (!allowed.includes(origin)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const SHEETS_URL = process.env.APPS_SCRIPT_URL;
  if (!SHEETS_URL) {
    return { statusCode: 500, body: "Missing configuration" };
  }

  try {
    const response = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body
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
