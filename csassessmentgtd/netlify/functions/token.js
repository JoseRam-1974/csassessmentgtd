const crypto = require("crypto");

exports.handler = async () => {
  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing CSRF_SECRET" }) };
  }

  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString("hex");
  const data = `${timestamp}.${random}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const token = `${data}.${signature}`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  };
};
