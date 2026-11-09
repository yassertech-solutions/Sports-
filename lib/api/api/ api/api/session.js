
const { verifySession } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const session = verifySession(req);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "No active session"
    });
  }

  return res.status(200).json({
    success: true,
    username: session.username
  });
};
