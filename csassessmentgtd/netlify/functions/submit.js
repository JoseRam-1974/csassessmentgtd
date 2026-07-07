exports.handler = async (event) => {
  console.log("Method:", event.httpMethod);
  console.log("Origin:", event.headers.origin);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const origin = event.headers.origin || "";
  const allowed = [
    "https://csassessmentgtd.netlify.app",
    "https://csdiagnosticogtd.netlify.app",
    "https://assessment.gtd.cl"
  ];
  if (!allowed.includes(origin)) {
    console.log("Forbidden origin:", origin);
    return { statusCode: 403, body: "Forbidden" };
  }

  const SHEETS_URL = process.env.APPS_SCRIPT_URL;
  if (!SHEETS_URL) {
    console.log("Missing APPS_SCRIPT_URL");
    return { statusCode: 500, body: "Missing configuration" };
  }

  console.log("Sending to Apps Script...");
  try {
    const response = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body
    });
    console.log("Apps Script response status:", response.status);
    const data = await response.json();
    console.log("Apps Script response:", JSON.stringify(data));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.log("Error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
