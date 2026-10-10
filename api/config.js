module.exports = function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const socketUrl = process.env.CHATWAVE_SERVER_URL || "";
  if (!socketUrl) return res.status(503).json({ error: "CHATWAVE_SERVER_URL is not configured." });
  return res.status(200).json({ socketUrl });
};
