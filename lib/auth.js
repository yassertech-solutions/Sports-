
const crypto = require("crypto");

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";

  const item = cookies
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(name + "="));

  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function verifySession(req) {
  const secret = process.env.YTS_SESSION_SECRET;

  if (!secret) return null;

  const token = getCookie(req, "yts_session");

  if (!token) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!session.username || !session.expires) return null;

    if (Date.now() > session.expires) return null;

    return session;

  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const session = verifySession(req);

  if (!session) {
    res.status(401).json({
      success: false,
      message: "Session expired. Please unlock YTS SCORE again."
    });

    return null;
  }

  return session;
}

module.exports = {
  verifySession,
  requireAuth
};
