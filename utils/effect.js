const Tile = require("./tile");

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pointFor(layout, point) {
  return {
    x: layout.padding + point.col * (layout.tileWidth + layout.gap) + layout.tileWidth / 2,
    y: layout.padding + point.row * (layout.tileHeight + layout.gap) + layout.tileHeight / 2
  };
}

function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

function visiblePath(points, progress) {
  if (points.length <= 1) {
    return points;
  }

  const target = pathLength(points) * easeOutCubic(progress);
  const result = [points[0]];
  let walked = 0;

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const segment = Math.hypot(current.x - previous.x, current.y - previous.y);
    if (walked + segment <= target) {
      result.push(current);
      walked += segment;
      continue;
    }

    const ratio = segment ? (target - walked) / segment : 0;
    result.push({
      x: previous.x + (current.x - previous.x) * clamp(ratio, 0, 1),
      y: previous.y + (current.y - previous.y) * clamp(ratio, 0, 1)
    });
    break;
  }

  return result;
}

function createEffectEngine(canvas, render) {
  const requestFrame = canvas && canvas.requestAnimationFrame ?
    canvas.requestAnimationFrame.bind(canvas) :
    (callback) => setTimeout(() => callback(Date.now()), 16);
  const cancelFrame = canvas && canvas.cancelAnimationFrame ?
    canvas.cancelAnimationFrame.bind(canvas) :
    clearTimeout;

  const state = {
    selectedPulse: 0,
    linePath: [],
    lineProgress: 0,
    particles: [],
    taps: [],
    errorProgress: 0,
    shakeProgress: 0,
    running: false,
    frameId: null
  };

  function start() {
    if (state.running) {
      return;
    }
    state.running = true;
    state.frameId = requestFrame(loop);
  }

  function stop() {
    state.running = false;
    if (state.frameId) {
      cancelFrame(state.frameId);
      state.frameId = null;
    }
  }

  function loop() {
    step();
    render();
    if (state.running) {
      state.frameId = requestFrame(loop);
    }
  }

  function step() {
    state.selectedPulse = (state.selectedPulse + 0.045) % 1;
    if (state.linePath.length) {
      state.lineProgress = clamp(state.lineProgress + 0.08, 0, 1);
    }
    if (state.errorProgress > 0) {
      state.errorProgress = clamp(state.errorProgress - 0.08, 0, 1);
    }
    if (state.shakeProgress > 0) {
      state.shakeProgress = clamp(state.shakeProgress - 0.12, 0, 1);
    }
    state.taps = state.taps
      .map((tap) => ({
        ...tap,
        life: tap.life - 0.075
      }))
      .filter((tap) => tap.life > 0);
    state.particles = state.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.16,
        life: particle.life - 0.045
      }))
      .filter((particle) => particle.life > 0);
  }

  function playLine(path) {
    state.linePath = path || [];
    state.lineProgress = 0;
  }

  function clearLine() {
    state.linePath = [];
    state.lineProgress = 0;
  }

  function playError() {
    state.errorProgress = 1;
    state.shakeProgress = 1;
  }

  function playTap(layout, tile) {
    const rect = Tile.getRect(layout, tile, 1);
    state.taps.push({
      x: rect.centerX,
      y: rect.centerY,
      radius: Math.max(rect.width, rect.height) * 0.36,
      life: 1
    });
  }

  function playParticles(layout, tiles) {
    const colors = ["#ffffff", "#fff176", "#ffbf4d", "#7df2a8"];
    tiles.forEach((tile) => {
      const rect = Tile.getRect(layout, tile, 1);
      for (let i = 0; i < 14; i += 1) {
        const angle = Math.PI * 2 * (i / 14) + Math.random() * 0.28;
        const speed = 1.6 + Math.random() * 2.6;
        state.particles.push({
          x: rect.centerX,
          y: rect.centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 2.5 + Math.random() * 4,
          color: colors[i % colors.length],
          life: 1
        });
      }
    });
  }

  function drawLine(ctx, layout) {
    if (!state.linePath.length) {
      return;
    }

    const points = state.linePath.map((point) => pointFor(layout, point));
    const visible = visiblePath(points, state.lineProgress);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    visible.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 241, 118, 0.92)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(ctx) {
    state.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawTapFeedback(ctx) {
    state.taps.forEach((tap) => {
      const progress = 1 - tap.life;
      ctx.save();
      ctx.globalAlpha = clamp(tap.life, 0, 1) * 0.55;
      ctx.strokeStyle = "#fff176";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "rgba(255, 248, 132, 0.95)";
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, tap.radius + progress * 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function shakeOffset() {
    if (state.shakeProgress <= 0) {
      return { x: 0, y: 0 };
    }
    const wave = Math.sin((1 - state.shakeProgress) * Math.PI * 8);
    return {
      x: wave * state.shakeProgress * 10,
      y: 0
    };
  }

  return {
    state,
    start,
    stop,
    playLine,
    clearLine,
    playError,
    playTap,
    playParticles,
    drawLine,
    drawParticles,
    drawTapFeedback,
    shakeOffset
  };
}

module.exports = {
  createEffectEngine
};
