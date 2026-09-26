(function () {
  "use strict";

  const fallbackEntries = [
    { nickname: "SUNSPOT", time: 18.42 }, { nickname: "MARA", time: 21.08 },
    { nickname: "EAGLE EYE", time: 24.67 }, { nickname: "JUNE", time: 29.31 },
    { nickname: "DOT", time: 33.9 },
  ];

  function endpointIsConfigured() {
    const url = window.SEEK_SONNY_CONFIG.appsScriptUrl;
    return url && !url.includes("YOUR_GOOGLE");
  }

  /** POSTs a score using the agreed { nickname, time } backend contract. */
  async function submitScore(nickname, time) {
    try {
      if (!endpointIsConfigured()) throw new Error("Leaderboard endpoint is not configured yet.");
      // Apps Script redirects and CORS headers vary by deployment. If a real endpoint
      // rejects this request, its response headers, fetch mode, or a JSONP-style
      // workaround may need adjusting after deployment.
      const response = await fetch(window.SEEK_SONNY_CONFIG.appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ nickname, time }),
      });
      if (!response.ok) throw new Error(`Score submission failed (${response.status}).`);
      return { success: true, fallback: false };
    } catch (error) {
      console.warn("Using local score fallback:", error.message);
      return { success: true, fallback: true };
    }
  }

  /** Fetches the sorted board, falling back to demo entries while no backend exists. */
  async function fetchLeaderboard() {
    try {
      if (!endpointIsConfigured()) throw new Error("Leaderboard endpoint is not configured yet.");
      const response = await fetch(window.SEEK_SONNY_CONFIG.appsScriptUrl);
      if (!response.ok) throw new Error(`Leaderboard fetch failed (${response.status}).`);
      const entries = await response.json();
      if (!Array.isArray(entries)) throw new Error("Unexpected leaderboard response.");
      return entries.sort((a, b) => Number(a.time) - Number(b.time)).slice(0, 10);
    } catch (error) {
      console.warn("Using demo leaderboard:", error.message);
      return fallbackEntries.map((entry) => ({ ...entry }));
    }
  }

  window.Leaderboard = { submitScore, fetchLeaderboard };
})();
