module.exports = function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: "Supabase environment variables are not configured." });
  }
  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
};
