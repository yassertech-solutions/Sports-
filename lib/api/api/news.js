
const { requireAuth } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  const session = requireAuth(req, res);
  if (!session) return;

  const newsKey = process.env.YTS_NEWS_API_KEY;

  if (!newsKey) {
    return res.status(503).json({
      success: false,
      message: "Football news service is not configured yet.",
      articles: []
    });
  }

  try {
    const url = new URL("https://newsapi.org/v2/everything");

    url.searchParams.set("q", "football OR soccer");
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "15");

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": newsKey
      }
    });

    const data = await response.json();

    if (!response.ok || data.status !== "ok") {
      return res.status(502).json({
        success: false,
        message: "Unable to retrieve football news.",
        articles: []
      });
    }

    const articles = (data.articles || [])
      .filter(article => article.title && article.url)
      .map(article => ({
        title: article.title,
        link: article.url,
        source: article.source?.name || "Football News"
      }));

    return res.status(200).json({
      success: true,
      articles
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "News service connection failed.",
      articles: []
    });
  }
};
