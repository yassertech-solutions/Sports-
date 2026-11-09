
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  res.setHeader("Set-Cookie",
    "yts_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );

  return res.status(200).json({
    success: true,
    message: "Successfully logged out."
  });
};
