
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { username, phone, email, code } = req.body || {};

    if (!username || !phone || !email || !code) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields."
      });
    }

    if (
      typeof username !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string" ||
      typeof code !== "string" ||
      username.length > 40 ||
      phone.length > 25 ||
      email.length > 100 ||
      code.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address."
      });
    }

    if (!process.env.YTS_UNLOCK_CODE ||
        !process.env.YTS_SESSION_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration missing."
      });
    }

    const submitted = Buffer.from(code, "utf8");
    const expected = Buffer.from(process.env.YTS_UNLOCK_CODE, "utf8");

    const validCode =
      submitted.length === expected.length &&
      crypto.timingSafeEqual(submitted, expected);

    if (!validCode) {
      return res.status(401).json({
        success: false,
        message: "Incorrect unlock code."
      });
    }

    const sessionData = {
      username: username.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      expires: Date.now() + 24 * 60 * 60 * 1000
    };

    const payload = Buffer.from(
      JSON.stringify(sessionData)
    ).toString("base64url");

    const signature = crypto
      .createHmac("sha256", process.env.YTS_SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const token = payload + "." + signature;

    res.setHeader("Set-Cookie",
      `yts_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
    );

    return res.status(200).json({
      success: true,
      message: "Welcome to YTS SCORE!"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};
