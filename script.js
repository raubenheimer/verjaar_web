// ======= CHANGE THIS PIN =======
const CORRECT_PIN = "12345678"; // <-- set your secret 8-digit code here

const lockScreen = document.getElementById("lockScreen");
const messageScreen = document.getElementById("messageScreen");
const pinForm = document.getElementById("pinForm");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");
const replayBtn = document.getElementById("replayBtn");
const lockAgainBtn = document.getElementById("lockAgainBtn");

// ----- Simple view toggles -----
function showMessage() {
  lockScreen.classList.add("hidden");
  messageScreen.classList.remove("hidden");
  burstConfetti();
}

function showLock() {
  messageScreen.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  pinInput.value = "";
  pinError.textContent = "";
  pinInput.focus();
}

// ----- PIN handling -----
function onlyDigits(str) {
  return (str || "").replace(/\D/g, "");
}

pinInput.addEventListener("input", () => {
  // Keep it digits-only even if someone pastes text
  const cleaned = onlyDigits(pinInput.value);
  if (cleaned !== pinInput.value) pinInput.value = cleaned;
  pinError.textContent = "";
});

pinForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const pin = onlyDigits(pinInput.value);

  if (pin.length !== 8) {
    pinError.textContent = "Please enter exactly 8 digits.";
    shake(pinInput);
    return;
  }

  if (pin === CORRECT_PIN) {
    showMessage();
  } else {
    pinError.textContent = "That code isn’t right — try again 💗";
    shake(pinInput);
    pinInput.select?.();
  }
});

replayBtn.addEventListener("click", () => burstConfetti());
lockAgainBtn.addEventListener("click", () => showLock());

function shake(el) {
  el.classList.remove("shake");
  // force reflow so animation restarts
  void el.offsetWidth;
  el.classList.add("shake");
}

// ======= Confetti (tiny canvas implementation) =======
let confettiCanvas = null;
let confettiCtx = null;
let animId = null;

function ensureCanvas() {
  if (confettiCanvas) return;

  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confettiCanvas";
  confettiCanvas.style.position = "fixed";
  confettiCanvas.style.inset = "0";
  confettiCanvas.style.width = "100%";
  confettiCanvas.style.height = "100%";
  confettiCanvas.style.pointerEvents = "none";
  confettiCanvas.style.zIndex = "9999";
  document.body.appendChild(confettiCanvas);

  confettiCtx = confettiCanvas.getContext("2d", { alpha: true });

  const resize = () => {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  window.addEventListener("resize", resize);
  resize();
}

function burstConfetti() {
  ensureCanvas();

  // cancel existing animation
  if (animId) cancelAnimationFrame(animId);

  const W = window.innerWidth;
  const H = window.innerHeight;

  const pieces = [];
  const count = 160;
  const gravity = 0.12;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: W * (0.15 + Math.random() * 0.7),
      y: -20 - Math.random() * 80,
      vx: -2.6 + Math.random() * 5.2,
      vy: 1.2 + Math.random() * 3.6,
      size: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: -0.18 + Math.random() * 0.36,
      life: 0,
      ttl: 220 + Math.floor(Math.random() * 60),
      shape: Math.random() < 0.5 ? "rect" : "circle",
      hue: Math.floor(Math.random() * 360)
    });
  }

  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;

    confettiCtx.clearRect(0, 0, W, H);

    for (const p of pieces) {
      p.life++;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      const alpha = Math.max(0, 1 - p.life / p.ttl);

      confettiCtx.save();
      confettiCtx.globalAlpha = alpha;
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);

      // color via HSL; looks lively without picking fixed colors
      confettiCtx.fillStyle = `hsl(${p.hue} 90% 60%)`;

      if (p.shape === "rect") {
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
        confettiCtx.fill();
      }

      confettiCtx.restore();
    }

    // stop when most pieces are done or after ~3.2s
    const done = pieces.every(p => p.life >= p.ttl) || elapsed > 3200;

    if (!done) {
      animId = requestAnimationFrame(frame);
    } else {
      confettiCtx.clearRect(0, 0, W, H);
      animId = null;
    }
  }

  animId = requestAnimationFrame(frame);
}

// Focus the input on load for convenience
window.addEventListener("load", () => {
  pinInput.focus();
});