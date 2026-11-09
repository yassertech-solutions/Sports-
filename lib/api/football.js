
const { requireAuth } = require("../lib/auth");

const ALLOWED_ENDPOINTS = {
  live: "fixtures",
  fixtures: "fixtures",
  standings: "standings",
  teams: "teams",
  players: "players",
  match: "fixtures"
};

const ALLOWED_PARAMS = {
  live: ["live"],
  fixtures: ["date", "league", "season", "team", "next", "last"],
  standings: ["league", "season", "team"],
  teams: ["id", "name", "league", "season", "country"],
  players: ["id", "team", "league", "season", "search"],
  match: ["id"]
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const session = requireAuth(req, res);
  if (!session) return;

  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Football API key is missing."
    });
  }

  const endpointType = req.query.endpoint;
  const endpoint = ALLOWED_ENDPOINTS[endpointType];

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: "Invalid football endpoint."
    });
  }

  const allowed = ALLOWED_PARAMS[endpointType];
  const params = new URLSearchParams();

  for (const key of allowed) {
    const value = req.query[key];

    if (typeof value === "string" && value.trim()) {
      params.set(key, value.trim());
    }
  }

  if (
    ["fixtures", "standings", "teams", "players"].includes(endpointType) &&
    !params.has("season")
  ) {
    params.set("season", String(new Date().getFullYear()));
  }

  if (endpointType === "live" && !params.has("live")) {
    params.set("live", "all");
  }

  if (["fixtures", "standings"].includes(endpointType) &&
      !params.has("date") &&
      !params.has("league") &&
      !params.has("team")) {
    if (endpointType === "fixtures") {
      params.set("date", new Date().toISOString().slice(0, 10));
    } else {
      return res.status(400).json({
        success: false,
        message: "Please select a league."
      });
    }
  }

  try {
    const url = `https://v3.football.api-sports.io/${endpoint}?${params}`;

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Football provider request failed."
      });
    }

    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Football API returned an error.",
        errors: data.errors
      });
    }

    return res.status(200).json({
      success: true,
      endpoint: endpointType,
      results: data.results,
      response: data.response,
      paging: data.paging
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to connect to football service."
    });
  }
};
