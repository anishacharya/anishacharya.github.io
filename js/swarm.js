/* Site-wide background: a small universe of agent galaxies on a spacetime
   fabric. Each galaxy forms by capturing free agents into a rotating spiral,
   tightens, collapses into a black hole, and bangs back out; the survivors
   drift as a new generation until another galaxy captures them. Several
   galaxies run out of phase, so the structure keeps reorganising.
   Adapted from the the agent swarm landing page. Decorative only: the
   canvas is aria-hidden, fixed behind the content, and never takes pointer
   events. Pauses while the tab is hidden; a still frame under reduced motion. */
(function () {
  "use strict";

  var canvas = document.getElementById("swarm");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  // the static background field would double up behind the universe
  document.documentElement.classList.add("has-swarm");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var HUES = [268, 226, 190, 165];
  var NARROW = 640, COLUMN = 884, LINK = 120, TRAIL = 26, frames = 0;
  var W = 0, H = 0, DPR = 1, N = 0;
  var agents = [], events = [], centers = [], wells = [], pending = [];

  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // --- galaxies ---------------------------------------------------------------
  // GROW      captures free agents into a rotating spiral that slowly tightens
  // COLLAPSE  members spiral into the centre along their own motion
  // HOLD      a black hole: one bright point inside a photon ring
  // BANG      members are flung outward as a new generation, and the galaxy ends
  var GROW = 0, COLLAPSE = 1, HOLD = 2, BANG = 3;
  var T_COLLAPSE = 2400, T_HOLD = 700, T_BANG = 3000;

  function maxCenters() { return W < NARROW ? 2 : W > 1600 ? 4 : 3; }
  function galaxyRadius() { return Math.min(W, H) * (W < NARROW ? 0.3 : 0.2); }

  // somewhere in the margins, clear of the reading column and of other galaxies
  function spot() {
    var gutter = (W - COLUMN) / 2, best = null, bestD = -1;
    for (var k = 0; k < 14; k++) {
      var x;
      if (W >= NARROW && gutter > 140) x = Math.random() < 0.5 ? rand(30, gutter - 10) : rand(W - gutter + 10, W - 30);
      else x = Math.random() < 0.5 ? rand(20, W * 0.2) : rand(W * 0.8, W - 20);
      var y = rand(H * 0.12, H * 0.88), d = 1e9;
      for (var i = 0; i < centers.length; i++) d = Math.min(d, Math.hypot(centers[i].x - x, centers[i].y - y));
      if (d > bestD) { bestD = d; best = { x: x, y: y }; }
    }
    return best;
  }

  function spawn(life) {
    var p = spot();
    centers.push({
      x: p.x, y: p.y, phase: GROW, t: 0, life: life || rand(10000, 16000),
      R0: galaxyRadius() * rand(0.8, 1.15), spin: Math.random() < 0.5 ? -1 : 1,
      tilt: rand(-0.8, 0.8), hue: HUES[(Math.random() * HUES.length) | 0] + rand(-12, 12)
    });
  }

  // how much the galaxy bends spacetime: grows as it forms, peaks as a black hole
  function mass(c) {
    if (c.phase === GROW) return 0.3 * smooth(c.t / c.life);
    if (c.phase === COLLAPSE) return 0.3 + 0.7 * smooth(c.t / T_COLLAPSE);
    if (c.phase === HOLD) return 1;
    return 1 - smooth(c.t / 900);
  }

  function beginCollapse(c) {
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (a.c !== c) continue;
      var dx = a.x - c.x, dy = a.y - c.y, r = Math.hypot(dx, dy) || 0.001, ux = dx / r, uy = dy / r;
      a.r0 = r; a.th0 = Math.atan2(dy, dx);
      a.vr0 = Math.max(-0.4, Math.min(0.2, (a.vx * ux + a.vy * uy) * 0.06));
      a.w0 = Math.max(-0.008, Math.min(0.008, (a.vy * ux - a.vx * uy) * 0.06 / r));
      a.rEnd = 2 + (i % 5); a.tr.length = 0;
    }
  }

  function bang(c) {
    var shift = rand(40, 130);
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (a.c !== c) continue;
      var ang = Math.atan2(a.y - c.y, a.x - c.x) + rand(-0.4, 0.4), sp = rand(2, 5);
      a.x = c.x + Math.cos(ang) * 3; a.y = c.y + Math.sin(ang) * 3;
      a.vx = Math.cos(ang) * sp; a.vy = Math.sin(ang) * sp;
      a.boost = 4; a.c = null;
      a.hue = (a.hue + shift) % 360;           // the survivors are a new generation
    }
    events.push({ x: c.x, y: c.y, t: 0, hue: c.hue });
  }

  // --- click wells ------------------------------------------------------------
  // a click drops a transient mass: it pulls the fabric and nearby agents in,
  // and sends a ripple outward that nudges agents as it passes
  var W_LIFE = 3400, W_SPEED = 0.42;
  function perturb(ev) {
    if (ev.target && ev.target.closest && ev.target.closest("a, button, input, textarea, select")) return;
    var r = canvas.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    wells.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: 0 });
    if (wells.length > 5) wells.shift();
  }

  // --- spacetime fabric -------------------------------------------------------
  var WX = 0, WY = 0;                          // warp output, reused to avoid allocations
  function warp(x, y) {
    WX = 0; WY = 0;
    var i, d, dx, dy, ux, uy, disp, q, off;
    for (i = 0; i < centers.length; i++) {
      var c = centers[i];
      dx = x - c.x; dy = y - c.y; d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      if (d > 700) continue;
      ux = dx / d; uy = dy / d; disp = 0;
      var m = mass(c);
      if (m > 0.001) { q = d / 210; disp -= 52 * m * q * Math.exp(0.5 - 0.5 * q * q); }
      if (c.phase === BANG && c.t < 2600) {
        off = d - c.t * 0.5;
        disp += 20 * Math.exp(-c.t / 1500) * Math.exp(-off * off / 5000) * Math.sin(off / 20);
      }
      WX += ux * disp; WY += uy * disp;
    }
    for (i = 0; i < wells.length; i++) {
      var w = wells[i];
      dx = x - w.x; dy = y - w.y; d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      if (d > 640) continue;
      ux = dx / d; uy = dy / d; q = d / 120;
      var env = Math.exp(-w.t / 1300);
      var pull = -40 * smooth(w.t / 220) * env * q * Math.exp(0.5 - 0.5 * q * q);
      off = d - w.t * W_SPEED;
      var wave = 13 * Math.exp(-w.t / 1800) * Math.exp(-off * off / 3200) * Math.sin(off / 14);
      WX += ux * (pull + wave); WY += uy * (pull + wave);
    }
  }

  var FAB = 44, FAB_STEP = 12;
  function latticePath(x0, x1, y0, y1) {
    var x, y, first;
    for (x = Math.floor(x0 / FAB) * FAB; x <= x1; x += FAB) {
      first = true;
      for (y = y0; y <= y1; y += FAB_STEP) {
        warp(x, y);
        if (first) { ctx.moveTo(x + WX, y + WY); first = false; } else ctx.lineTo(x + WX, y + WY);
      }
    }
    for (y = Math.floor(y0 / FAB) * FAB; y <= y1; y += FAB) {
      first = true;
      for (x = x0; x <= x1; x += FAB_STEP) {
        warp(x, y);
        if (first) { ctx.moveTo(x + WX, y + WY); first = false; } else ctx.lineTo(x + WX, y + WY);
      }
    }
  }

  function drawFabric() {
    ctx.strokeStyle = "rgba(170,190,255,0.05)"; ctx.lineWidth = 0.7;
    ctx.beginPath(); latticePath(0, W + FAB, -FAB, H + FAB); ctx.stroke();
    // each well in spacetime lights up as it deepens, so the bend reads clearly
    for (var i = 0; i < centers.length; i++) {
      var c = centers[i], m = mass(c);
      if (m < 0.05) continue;
      var PR = 380, g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, PR);
      g.addColorStop(0, "rgba(196,210,255," + (0.24 * m).toFixed(3) + ")");
      g.addColorStop(0.55, "rgba(196,210,255," + (0.1 * m).toFixed(3) + ")");
      g.addColorStop(1, "rgba(196,210,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 0.8;
      ctx.beginPath(); latticePath(c.x - PR, c.x + PR, c.y - PR, c.y + PR); ctx.stroke();
    }
    for (i = 0; i < wells.length; i++) {
      var w = wells[i], env = Math.exp(-w.t / 1300);
      for (var k = 0; k < 3; k++) {
        var rr = (w.t - k * 160) * W_SPEED, ra = 0.45 * Math.exp(-w.t / 1500) * (1 - k * 0.28);
        if (rr <= 0 || ra < 0.01) continue;
        ctx.strokeStyle = "rgba(200,215,255," + ra.toFixed(3) + ")"; ctx.lineWidth = 1 - k * 0.25;
        ctx.beginPath(); ctx.arc(w.x, w.y, rr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(240,255,252," + (0.7 * env).toFixed(3) + ")"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w.x, w.y, 3 + 4 * env, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // --- agents -----------------------------------------------------------------
  function seed() {
    agents = [];
    for (var i = 0; i < N; i++) {
      agents.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: rand(-0.25, 0.25), vy: rand(-0.25, 0.25),
        hue: HUES[(Math.random() * HUES.length) | 0], r: rand(1.1, 2.8),
        ph: Math.random() * Math.PI * 2, c: null, boost: 0, tr: []
      });
    }
  }

  function flock(a, i, sepScale) {
    var cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
    for (var j = 0; j < agents.length; j++) {
      if (j === i) continue;
      var b = agents[j], dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
      if (d > LINK * LINK || d === 0) continue;
      d = Math.sqrt(d); n++;
      cx += b.x; cy += b.y; ax += b.vx; ay += b.vy;
      if (d < 26) { sx -= dx / d; sy -= dy / d; }
    }
    if (n) {
      a.vx += (cx / n - a.x) * 0.0002 + (ax / n - a.vx) * 0.01 + sx * 0.03 * sepScale;
      a.vy += (cy / n - a.y) * 0.0002 + (ay / n - a.vy) * 0.01 + sy * 0.03 * sepScale;
    }
  }

  function step(dt) {
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i], c = a.c;

      // falling in: a spiral that starts from each agent's own radial and angular
      // speed (no jolt), turns faster as it falls, and rests on a tiny core
      if (c && (c.phase === COLLAPSE || c.phase === HOLD)) {
        var T = T_COLLAPSE, rad, ang;
        if (c.phase === COLLAPSE) {
          var u = Math.min(1, c.t / T), u2 = u * u, u3 = u2 * u;
          rad = (2 * u3 - 3 * u2 + 1) * a.r0 + (u3 - 2 * u2 + u) * T * a.vr0 + (3 * u2 - 2 * u3) * a.rEnd;
          ang = a.th0 + a.w0 * T * u + 2.4 * c.spin * u3;
        } else {
          rad = a.rEnd;
          ang = a.th0 + a.w0 * T + 2.4 * c.spin + (a.w0 + 3 * 2.4 * c.spin / T) * c.t;
        }
        rad = Math.max(0.5, rad);
        a.x = c.x + Math.cos(ang) * rad; a.y = c.y + Math.sin(ang) * rad;
        continue;
      }

      flock(a, i, c ? 0.5 : 1);

      if (c && c.phase === GROW) {
        // orbit: inner agents circle faster than outer ones (differential
        // rotation), which winds the galaxy into spiral arms as it tightens
        var dx = a.x - c.x, dy = a.y - c.y, r = Math.hypot(dx, dy) || 1, ux = dx / r, uy = dy / r;
        var g = smooth(c.t / c.life), rstar = c.R0 * (1 - 0.6 * g);
        var vt = 1.15 * Math.sqrt(70 / (r + 70)) * (0.55 + 0.7 * g);
        var vr = -(r - rstar * (0.35 + 0.65 * ((i % 7) / 6))) * 0.004;
        a.vx += (-uy * c.spin * vt + ux * vr - a.vx) * 0.03;
        a.vy += (ux * c.spin * vt + uy * vr - a.vy) * 0.03;
        a.hue += (c.hue - a.hue) * 0.0015;     // members take on the galaxy's lineage
      } else if (!c) {
        // free: drift, and be captured now and then by a forming galaxy nearby
        var best = null, bd = 1e9;
        for (var k = 0; k < centers.length; k++) {
          var cc = centers[k];
          if (cc.phase !== GROW || cc.t > cc.life * 0.8) continue;
          var dd = Math.hypot(a.x - cc.x, a.y - cc.y);
          if (dd < bd) { bd = dd; best = cc; }
        }
        if (best && bd < best.R0 * 2.2) {
          a.vx += (best.x - a.x) / bd * 0.012; a.vy += (best.y - a.y) / bd * 0.012;
          if (a.boost < 0.3 && Math.random() < 0.006 * dt / 16) a.c = best;
        }
      }

      // gentle wander so nothing settles into a crystal
      a.ph += dt * 0.0007;
      a.vx += Math.cos(a.ph) * 0.005; a.vy += Math.sin(a.ph * 1.3) * 0.005;

      // click wells: a brief pull, and a kick as the ripple passes
      for (var n2 = 0; n2 < wells.length; n2++) {
        var w2 = wells[n2], wx = w2.x - a.x, wy = w2.y - a.y, wd = Math.hypot(wx, wy) || 1;
        if (wd > 520) continue;
        var g2 = Math.exp(-w2.t / 1300) * Math.exp(-wd * wd / (2 * 170 * 170));
        a.vx += wx / wd * g2 * 0.045 * dt / 16; a.vy += wy / wd * g2 * 0.045 * dt / 16;
        if (Math.abs(wd - w2.t * W_SPEED) < 26) {
          var kick = 0.14 * Math.exp(-w2.t / 1800);
          a.vx -= wx / wd * kick; a.vy -= wy / wd * kick;
        }
      }

      // steer off the edges rather than wrapping
      var m = 70;
      if (a.x < m) a.vx += (m - a.x) * 0.0005;
      if (a.x > W - m) a.vx -= (a.x - (W - m)) * 0.0005;
      if (a.y < m) a.vy += (m - a.y) * 0.0005;
      if (a.y > H - m) a.vy -= (a.y - (H - m)) * 0.0005;

      // speed cap: calm when free, quicker in orbit, released after a bang
      var MAX = (c ? 1.3 : 0.6) + a.boost;
      a.boost *= Math.pow(0.985, dt / 16);
      var sp = Math.hypot(a.vx, a.vy);
      if (sp > MAX) { a.vx = a.vx / sp * MAX; a.vy = a.vy / sp * MAX; }

      a.x += a.vx * dt * 0.06; a.y += a.vy * dt * 0.06;
      if (a.x < 6) { a.x = 6; a.vx = Math.abs(a.vx); }
      if (a.x > W - 6) { a.x = W - 6; a.vx = -Math.abs(a.vx); }
      if (a.y < 6) { a.y = 6; a.vy = Math.abs(a.vy); }
      if (a.y > H - 6) { a.y = H - 6; a.vy = -Math.abs(a.vy); }
    }
  }

  // --- drawing ----------------------------------------------------------------
  function drawHorizon(c, h) {
    if (h <= 0.01) return;
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(c.tilt);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "hsla(" + c.hue.toFixed(0) + ",80%,80%," + (0.35 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(0, 0, 44, 10, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(125,211,252," + (0.2 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(240,255,252," + (0.8 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, Math.PI * 2); ctx.stroke();
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, c, dx, dy, d;
    drawFabric();

    // gravitational lensing: everything is drawn where bent spacetime puts it
    for (i = 0; i < agents.length; i++) {
      a = agents[i]; warp(a.x, a.y); a.rx = a.x + WX; a.ry = a.y + WY;
      if ((frames & 1) === 0) { a.tr.push(a.rx, a.ry); if (a.tr.length > 2 * TRAIL) a.tr.splice(0, 2); }
    }
    frames++;

    // trails, like a long exposure: orbits draw spiral streaks, a bang draws
    // outbound rays. Free drifters get none, so the field stays quiet.
    ctx.lineWidth = 1; ctx.lineCap = "round";
    var tb = {};
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      var streak = (a.c && a.c.phase !== HOLD) || a.boost > 0.4;
      if (!streak || a.tr.length < 6) continue;
      var hk = ((a.hue % 360 + 360) % 360 / 30) | 0;
      (tb[hk] || (tb[hk] = [])).push(a);
    }
    for (var hk2 in tb) {
      ctx.strokeStyle = "hsla(" + (+hk2 * 30 + 15) + ",90%,76%,0.16)";
      ctx.beginPath();
      var list = tb[hk2];
      for (j = 0; j < list.length; j++) {
        var tr = list[j].tr;
        ctx.moveTo(tr[0], tr[1]);
        for (var q = 2; q < tr.length; q += 2) ctx.lineTo(tr[q], tr[q + 1]);
        ctx.lineTo(list[j].rx, list[j].ry);
      }
      ctx.stroke();
    }

    // galaxy light: a faint disc while forming, a core glow as it collapses,
    // a soft flare at the bang
    for (i = 0; i < centers.length; i++) {
      c = centers[i];
      var g = c.phase === GROW ? smooth(c.t / c.life) : 1;
      if (c.phase === GROW && g > 0.05) {
        var gr = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.R0 * 1.1);
        gr.addColorStop(0, "hsla(" + c.hue.toFixed(0) + ",80%,75%," + (0.07 * g).toFixed(3) + ")");
        gr.addColorStop(1, "hsla(" + c.hue.toFixed(0) + ",80%,70%,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, c.R0 * 1.1, 0, Math.PI * 2); ctx.fill();
      }
      var z = c.phase === COLLAPSE ? smooth(c.t / T_COLLAPSE) : c.phase === HOLD ? 1 : 0;
      var flare = c.phase === BANG ? 0.6 * (1 - smooth(c.t / 1500)) : 0;
      var core = Math.max(z, flare);
      if (core > 0.02) {
        var cr = 34 + core * 60 + flare * 60, cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, cr);
        cg.addColorStop(0, "rgba(240,255,252," + (0.5 * core).toFixed(3) + ")");
        cg.addColorStop(0.3, "hsla(" + c.hue.toFixed(0) + ",90%,78%," + (0.18 * core).toFixed(3) + ")");
        cg.addColorStop(1, "hsla(" + c.hue.toFixed(0) + ",90%,70%,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(c.x, c.y, cr, 0, Math.PI * 2); ctx.fill();
      }
    }

    // links: local neighbours by lineage colour; inside a collapsing galaxy the
    // members also reach each other, a fine web that fades as they fall in.
    // Batched by colour and opacity so a few dozen strokes draw them all.
    ctx.lineWidth = 0.7;
    var HUE_B = 12, LOC_B = 5, LOC_MAX = 0.28, paths = {}, web = [];
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      for (j = i + 1; j < agents.length; j++) {
        b = agents[j];
        dx = b.rx - a.rx; dy = b.ry - a.ry; d = dx * dx + dy * dy;
        if (d > LINK * LINK) {
          if (a.c && a.c === b.c && a.c.phase === COLLAPSE && ((i + j) & 3) === 0) web.push(a, b);
          continue;
        }
        d = Math.sqrt(d);
        var la = (1 - d / LINK) * (Math.abs(a.hue - b.hue) < 14 ? 0.28 : 0.1);
        if (la < 0.008) continue;
        var hb = (((a.hue + b.hue) / 2 % 360 + 360) % 360 / (360 / HUE_B)) | 0;
        var key = hb * LOC_B + Math.min(LOC_B - 1, (la / LOC_MAX * LOC_B) | 0);
        (paths[key] || (paths[key] = [])).push(a, b);
      }
    }
    for (var k2 in paths) {
      var lp = paths[k2], kk = +k2;
      ctx.strokeStyle = "hsla(" + (((kk / LOC_B) | 0) * (360 / HUE_B) + 15).toFixed(0) + ",85%,74%," +
        (((kk % LOC_B) + 0.5) / LOC_B * LOC_MAX).toFixed(3) + ")";
      ctx.beginPath();
      for (j = 0; j < lp.length; j += 2) { ctx.moveTo(lp[j].rx, lp[j].ry); ctx.lineTo(lp[j + 1].rx, lp[j + 1].ry); }
      ctx.stroke();
    }
    if (web.length) {
      ctx.strokeStyle = "hsla(245,80%,82%,0.04)";
      ctx.beginPath();
      for (j = 0; j < web.length; j += 2) { ctx.moveTo(web[j].rx, web[j].ry); ctx.lineTo(web[j + 1].rx, web[j + 1].ry); }
      ctx.stroke();
    }

    // bang shells: one thin ring, wide and slow, fading as it goes
    for (i = 0; i < events.length; i++) {
      var e = events[i], p = e.t / 2800;
      ctx.strokeStyle = "hsla(" + e.hue.toFixed(0) + ",90%,78%," + ((1 - p) * 0.28).toFixed(3) + ")";
      ctx.lineWidth = 1.6 * (1 - p) + 0.3;
      ctx.beginPath(); ctx.arc(e.x, e.y, 8 + (1 - (1 - p) * (1 - p)) * Math.min(W, H) * 0.45, 0, Math.PI * 2); ctx.stroke();
    }

    // agents; halos fade as they fall in so a black hole stays a point of light
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      var falling = a.c && (a.c.phase === COLLAPSE || a.c.phase === HOLD);
      var hz = falling ? (a.c.phase === HOLD ? 1 : smooth(a.c.t / T_COLLAPSE)) : 0;
      ctx.fillStyle = "hsla(" + a.hue.toFixed(0) + ",92%,78%,0.85)";
      ctx.beginPath(); ctx.arc(a.rx, a.ry, a.r, 0, Math.PI * 2); ctx.fill();
      var haloA = 0.09 * (1 - hz * 0.85);
      if (haloA > 0.005) {
        ctx.fillStyle = "hsla(" + a.hue.toFixed(0) + ",95%,70%," + haloA.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(a.rx, a.ry, a.r * 5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // event horizons: visible at the black hole, lingering into the bang
    for (i = 0; i < centers.length; i++) {
      c = centers[i];
      var h = c.phase === HOLD ? 1 : c.phase === COLLAPSE ? smooth((c.t / T_COLLAPSE - 0.6) / 0.4)
            : c.phase === BANG ? 1 - smooth(c.t / 700) : 0;
      drawHorizon(c, h);
    }
  }

  // --- the clock --------------------------------------------------------------
  function tick(dt) {
    var i;
    for (i = wells.length - 1; i >= 0; i--) { wells[i].t += dt; if (wells[i].t > W_LIFE) wells.splice(i, 1); }
    for (i = events.length - 1; i >= 0; i--) { events[i].t += dt; if (events[i].t > 2800) events.splice(i, 1); }
    for (i = centers.length - 1; i >= 0; i--) {
      var c = centers[i];
      c.t += dt;
      if (c.phase === GROW && c.t > c.life) { c.phase = COLLAPSE; c.t -= c.life; beginCollapse(c); }
      else if (c.phase === COLLAPSE && c.t > T_COLLAPSE) { c.phase = HOLD; c.t -= T_COLLAPSE; }
      else if (c.phase === HOLD && c.t > T_HOLD) { c.phase = BANG; c.t = 0; bang(c); }
      else if (c.phase === BANG && c.t > T_BANG) {
        centers.splice(i, 1);
        pending.push(rand(1500, 4500));        // a new galaxy forms elsewhere, after a pause
      }
    }
    for (i = pending.length - 1; i >= 0; i--) {
      pending[i] -= dt;
      if (pending[i] <= 0) { pending.splice(i, 1); if (centers.length < maxCenters()) spawn(); }
    }
    step(dt);
  }

  // the opening state: galaxies already forming, staggered so their collapses
  // never line up; the first one waits a few seconds
  function genesis() {
    centers = []; pending = []; events = []; wells = [];
    var K = maxCenters();
    for (var k = 0; k < K; k++) {
      spawn(k === 0 ? rand(5000, 7000) : rand(9000, 18000));
      if (k > 0) centers[k].t = rand(0, 4000);
    }
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i], best = null, bd = 1e9;
      for (k = 0; k < centers.length; k++) {
        var d = Math.hypot(a.x - centers[k].x, a.y - centers[k].y);
        if (d < bd) { bd = d; best = centers[k]; }
      }
      if (best && bd < best.R0 * 1.6 && Math.random() < 0.75) { a.c = best; a.hue = best.hue + rand(-10, 10); }
    }
  }

  var lastW = -1;
  function resize() {
    if (canvas.clientWidth === lastW && W) return;   // ignore height-only changes (phone URL bar)
    lastW = canvas.clientWidth;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    N = Math.round(Math.min(190, Math.max(44, (W * H) / 7500)));
    seed(); genesis();
  }

  var last = 0, running = false, raf = 0;
  function frame(ts) {
    var dt = Math.min(ts - last, 42) || 16;
    last = ts;
    tick(dt); draw(dt);
    raf = running ? requestAnimationFrame(frame) : 0;
  }
  function setRunning(on) {
    on = on && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(function (t) { last = t; frame(t); });
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  window.addEventListener("resize", resize);
  if (!reduced) window.addEventListener("pointerdown", perturb);
  resize();

  if (reduced) {
    // still frame: galaxies well formed
    for (var s = 0; s < 500; s++) tick(16);
    draw(16);
  } else {
    document.addEventListener("visibilitychange", function () { setRunning(true); });
    setRunning(true);
  }
})();
