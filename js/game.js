(function () {
  "use strict";

  const config = window.SEEK_SONNY_CONFIG;
  const screens = { start: document.querySelector("#start-screen"), game: document.querySelector("#game-screen"), result: document.querySelector("#result-screen") };
  const sceneImage = document.querySelector("#scene-image");
  const stage = document.querySelector("#scene-stage");
  const sonnyLayer = document.querySelector("#sonny-layer");
  const effectLayer = document.querySelector("#effect-layer");
  const timerDisplay = document.querySelector("#timer");
  const remainingDisplay = document.querySelector("#remaining");
  const loadingScene = document.querySelector("#loading-scene");
  const resultScreen = screens.result;
  const returnButton = document.querySelector("#play-again-button");
  const returnButtonLabel = returnButton.querySelector(".button-label");
  const returnButtonIcon = returnButton.querySelector("[aria-hidden]");
  let startTime = 0, elapsedTime = 0, animationFrame = null, remaining = config.sonnyCount, placements = [];

  document.querySelector("#sonny-preview").innerHTML = window.Sonny.createSVG({ id: "preview-sonny" });

  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle("is-hidden", key !== name));
  }

  function formatTime(milliseconds, suffix = false) {
    const value = (milliseconds / 1000).toFixed(2);
    return `${Number(value) < 10 ? "0" : ""}${value}${suffix ? "s" : ""}`;
  }

  function tick(now) {
    elapsedTime = now - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
    animationFrame = requestAnimationFrame(tick);
  }

  // Measures the visible image, not its container, so overlays stay correct with object-fit.
  function syncLayerToImage() {
    const imageRect = sceneImage.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    [sonnyLayer, effectLayer].forEach((layer) => {
      layer.style.left = `${imageRect.left - stageRect.left}px`;
      layer.style.top = `${imageRect.top - stageRect.top}px`;
      layer.style.width = `${imageRect.width}px`;
      layer.style.height = `${imageRect.height}px`;
    });
  }

  function generatePlacements() {
    const spots = [];
    const minGap = 16;
    for (let i = 0; i < config.sonnyCount; i += 1) {
      let candidate, attempts = 0;
      do {
        const size = 5.5 + Math.random() * 2.5; // Percentage of scene width.
        candidate = { x: 2 + Math.random() * (96 - size), y: 3 + Math.random() * (91 - size), size, rotation: -20 + Math.random() * 40 };
        attempts += 1;
      } while (attempts < 100 && spots.some((spot) => Math.hypot(candidate.x - spot.x, candidate.y - spot.y) < minGap));
      spots.push(candidate);
    }
    return spots;
  }

  function placeSonnys() {
    sonnyLayer.replaceChildren();
    placements = generatePlacements();
    placements.forEach((spot, index) => {
      const sonny = window.Sonny.createElement(index);
      sonny.style.cssText = `left:${spot.x}%;top:${spot.y}%;width:${spot.size}%;aspect-ratio:1;transform:rotate(${spot.rotation}deg)`;
      sonny.addEventListener("pointerup", handleFound);
      sonnyLayer.append(sonny);
    });
  }

  function handleFound(event) {
    event.preventDefault();
    const sonny = event.currentTarget;
    if (sonny.classList.contains("found")) return;
    sonny.classList.add("found");
    remaining -= 1;
    remainingDisplay.textContent = remaining;
    const effect = document.createElement("span");
    effect.className = "found-effect";
    effect.style.left = `${sonny.offsetLeft + sonny.offsetWidth / 2}px`;
    effect.style.top = `${sonny.offsetTop + sonny.offsetHeight / 2}px`;
    effectLayer.append(effect);
    effect.addEventListener("animationend", () => effect.remove());
    if (remaining === 0) window.setTimeout(finishGame, 380);
  }

  function beginTimerAndGame() {
    loadingScene.classList.add("is-hidden");
    syncLayerToImage();
    placeSonnys();
    startTime = performance.now();
    animationFrame = requestAnimationFrame(tick);
  }

  function startGame() {
    cancelAnimationFrame(animationFrame);
    remaining = config.sonnyCount;
    remainingDisplay.textContent = remaining;
    timerDisplay.textContent = "00.00";
    loadingScene.classList.remove("is-hidden");
    showScreen("game");
    const scene = config.scenes[Math.floor(Math.random() * config.scenes.length)];
    sceneImage.onload = beginTimerAndGame;
    // If an asset is not supplied yet, retain a playable neutral scene for development.
    sceneImage.onerror = () => {
      sceneImage.onerror = null;
      sceneImage.src = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='850'><defs><pattern id='p' width='110' height='110' patternUnits='userSpaceOnUse' patternTransform='rotate(28)'><rect width='110' height='110' fill='%23314939'/><circle cx='18' cy='30' r='13' fill='%23d4a542'/><path d='M55 10h40v35H55zM10 70h50v30H10z' fill='%235d725b'/></pattern></defs><rect width='100%' height='100%' fill='url(%23p)'/><text x='50%' y='50%' fill='%23fff' opacity='.18' font-family='monospace' font-size='30' text-anchor='middle'>ADD SCENE IMAGES TO /assets/images</text></svg>`);
    };
    sceneImage.src = scene;
  }

  function finishGame() {
    cancelAnimationFrame(animationFrame);
    elapsedTime = performance.now() - startTime;
    document.querySelector("#final-time").textContent = formatTime(elapsedTime, true);
    document.querySelector("#leaderboard-section").classList.add("is-hidden");
    document.querySelector("#score-form").reset();
    document.querySelector("#submit-status").textContent = "";
    document.querySelector("#submit-score").disabled = false;
    resultScreen.classList.remove("leaderboard-only");
    resultScreen.setAttribute("aria-labelledby", "result-title");
    returnButtonLabel.textContent = "PLAY AGAIN";
    returnButtonIcon.textContent = "↻";
    showScreen("result");
  }

  function renderLeaderboard(entries, player) {
    const body = document.querySelector("#leaderboard-body");
    const combined = [...entries];
    if (player && !combined.some((entry) => entry.nickname === player.nickname && Math.abs(Number(entry.time) - player.time) < .001)) combined.push(player);
    combined.sort((a, b) => Number(a.time) - Number(b.time));
    body.replaceChildren(...combined.slice(0, 10).map((entry, index) => {
      const row = document.createElement("tr");
      if (player && entry.nickname === player.nickname && Math.abs(Number(entry.time) - player.time) < .001) row.className = "is-player";
      [String(index + 1).padStart(2, "0"), entry.nickname, `${Number(entry.time).toFixed(2)}s`].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); });
      return row;
    }));
    document.querySelector("#leaderboard-section").classList.remove("is-hidden");
  }

  document.querySelector("#score-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#submit-score");
    const nickname = document.querySelector("#nickname").value.trim().toUpperCase();
    if (!nickname) return;
    const player = { nickname, time: Number((elapsedTime / 1000).toFixed(2)) };
    button.disabled = true;
    document.querySelector("#submit-status").textContent = "SENDING FIELD NOTE…";
    const result = await window.Leaderboard.submitScore(player.nickname, player.time);
    const entries = await window.Leaderboard.fetchLeaderboard();
    renderLeaderboard(entries, player);
    document.querySelector("#submit-status").textContent = result.fallback ? "DEMO MODE · SCORE SHOWN LOCALLY" : "SCORE SUBMITTED";
  });

  document.querySelector("#start-button").addEventListener("click", startGame);
  document.querySelector("#highscore-button").addEventListener("click", async () => {
    resultScreen.classList.add("leaderboard-only");
    resultScreen.setAttribute("aria-labelledby", "leaderboard-title");
    returnButtonLabel.textContent = "BACK";
    returnButtonIcon.textContent = "←";
    showScreen("result");
    const entries = await window.Leaderboard.fetchLeaderboard();
    renderLeaderboard(entries);
  });
  returnButton.addEventListener("click", () => showScreen("start"));
  document.querySelector("#quit-button").addEventListener("click", () => { cancelAnimationFrame(animationFrame); showScreen("start"); });
  window.addEventListener("resize", () => { if (!screens.game.classList.contains("is-hidden")) syncLayerToImage(); });
})();
