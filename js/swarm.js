/* Homepage hero: an agent swarm that drifts, connects, collapses into a
   singularity, and bangs back out as a new generation. Adapted from the
   the agent swarm landing page. Decorative only: the canvas is
   aria-hidden, sits behind the content, and never takes pointer events.
   Pauses whenever the hero is off screen or the tab is hidden. */
(function () {
  "use strict";

  var canvas = document.getElementById("swarm");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  // the static background field would double up behind the swarm
  document.documentElement.classList.add("has-swarm");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // each hue is a lineage; selection spreads one, mutation invents a new one
  var HUES = [268, 226, 190, 165];
  var W = 0, H = 0, DPR = 1, N = 0, LINK = 138;
  var agents = [], events = [];

  // --- gravity wells: each click drops a transient mass ---------------------
  // each click drops a transient mass. it warps everything drawn near it (a
  // funnel that pulls the grid and the swarm inward) and emits a gravitational
  // wave: a ripple front that travels outward and nudges agents as it passes
  var wells = [], perturbations = 0;
  var W_LIFE = 3400, W_SIGMA = 120, W_PULL = 40, W_WAVE = 13, W_SPEED = 0.42;
  var WX = 0, WY = 0;                       // warp output, reused to avoid allocations

  function warp(x, y) {
    WX = 0; WY = 0;
    for (var n = 0; n < wells.length; n++) {
      var w = wells[n], dx = x - w.x, dy = y - w.y, d2 = dx * dx + dy * dy;
      if (d2 > 640 * 640) continue;
      var d = Math.sqrt(d2) || 0.0001, ux = dx / d, uy = dy / d;
      var env = Math.exp(-w.t / 1300);
      var q = d / W_SIGMA;
      // funnel: displacement toward the mass, peaking one sigma out
      var pull = -W_PULL * smooth(w.t / 220) * env * q * Math.exp(0.5 - 0.5 * q * q);
      // wave: an oscillating radial displacement riding the expanding front
      var off = d - w.t * W_SPEED;
      var wave = W_WAVE * Math.exp(-w.t / 1800) * Math.exp(-off * off / 3200) * Math.sin(off / 14);
      WX += ux * (pull + wave); WY += uy * (pull + wave);
    }

    // human curvature: lasting dents, deeper as clicks accumulate
    for (var hm = 0; hm < masses.length; hm++) {
      var M = masses[hm], mx = x - M.x, my = y - M.y, md2 = mx * mx + my * my;
      if (md2 > 560 * 560) continue;
      var md = Math.sqrt(md2) || 0.0001, mq = md / M_SIGMA;
      var dent = -M_PULL * Math.min(1, M.m / M_ALIGN) * mq * Math.exp(0.5 - 0.5 * mq * mq);
      WX += mx / md * dent; WY += my / md * dent;
    }

    // S0: the network's own mass. spacetime sags as the swarm connects and
    // collapses, and the big bang sends one wave across the whole fabric
    var m = s0Mass();
    var sagging = m > 0.001, banging = phase === BANG && phaseT < 2600;
    if (sagging || banging) {
      var c = center(), sx = x - c.x, sy = y - c.y;
      var sd = Math.sqrt(sx * sx + sy * sy) || 0.0001, sux = sx / sd, suy = sy / sd;
      var disp = 0;
      if (sagging) {
        var sq = sd / 230;
        disp -= 58 * m * sq * Math.exp(0.5 - 0.5 * sq * sq);
      }
      if (banging) {
        var soff = sd - phaseT * 0.62;
        disp += 24 * Math.exp(-phaseT / 1500) * Math.exp(-soff * soff / 5000) * Math.sin(soff / 20);
      }
      WX += sux * disp; WY += suy * disp;
    }
  }

  function s0Mass() {
    if (phase === BANG) return 1 - smooth(phaseT / 900);
    return connected() * 0.35 + collapsed() * 0.65;
  }

  // one lattice, shared by the whole fabric and every local patch, so the
  // brighter patches trace exactly the same (bent) lines
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

  // the spacetime fabric: a faint lattice across the whole field. flat at
  // rest, it bends around every mass. brightest near S0, fading to the edges
  var FAB = 44, FAB_STEP = 12;
  function drawFabric() {
    var c = center(), R = Math.hypot(W, H) * 0.75;
    var fg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
    fg.addColorStop(0, "rgba(170,190,255,0.13)");
    fg.addColorStop(0.45, "rgba(170,190,255,0.075)");
    fg.addColorStop(1, "rgba(170,190,255,0.03)");
    ctx.strokeStyle = fg; ctx.lineWidth = 0.7;
    ctx.beginPath();
    latticePath(0, W + FAB, -FAB, H + FAB);
    ctx.stroke();

    // the well at S0 lights up as it deepens, so the bend reads clearly
    var m = s0Mass();
    if (m > 0.02) {
      var PR = 430;
      var pg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, PR);
      pg.addColorStop(0, "rgba(196,210,255," + (0.26 * m).toFixed(3) + ")");
      pg.addColorStop(0.55, "rgba(196,210,255," + (0.12 * m).toFixed(3) + ")");
      pg.addColorStop(1, "rgba(196,210,255,0)");
      ctx.strokeStyle = pg; ctx.lineWidth = 0.8;
      ctx.beginPath();
      latticePath(c.x - PR, c.x + PR, c.y - PR, c.y + PR);
      ctx.stroke();
    }
  }

  // the bent-spacetime grid, drawn only around each well. one stroke per well;
  // a radial gradient fades the lattice out so it reads as a local distortion
  function drawWells() {
    var n, w, R = 300;
    for (n = 0; n < wells.length; n++) {
      w = wells[n];
      var env = Math.exp(-w.t / 1300), a0 = 0.34 * env * smooth(w.t / 180);
      if (a0 > 0.004) {
        var gr = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, R);
        gr.addColorStop(0, "rgba(190,205,255," + a0.toFixed(3) + ")");
        gr.addColorStop(0.6, "rgba(190,205,255," + (a0 * 0.45).toFixed(3) + ")");
        gr.addColorStop(1, "rgba(190,205,255,0)");
        ctx.strokeStyle = gr; ctx.lineWidth = 0.6;
        ctx.beginPath();
        latticePath(w.x - R, w.x + R, w.y - R, w.y + R);
        ctx.stroke();
      }

      // gravitational wave fronts: three thin rings, a short chirp
      for (var m = 0; m < 3; m++) {
        var rr = (w.t - m * 160) * W_SPEED;
        if (rr <= 0) continue;
        var ra = 0.5 * Math.exp(-w.t / 1500) * (1 - m * 0.28);
        if (ra < 0.01) continue;
        ctx.strokeStyle = "rgba(200,215,255," + ra.toFixed(3) + ")";
        ctx.lineWidth = 1 - m * 0.25;
        ctx.beginPath(); ctx.arc(w.x, w.y, rr, 0, Math.PI * 2); ctx.stroke();
      }

      // the mass itself
      ctx.strokeStyle = "rgba(240,255,252," + (0.7 * env).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w.x, w.y, 3 + 4 * env, 0, Math.PI * 2); ctx.stroke();
    }

    // accumulated human mass: a ring that fills toward the alignment threshold
    for (n = 0; n < masses.length; n++) {
      var M = masses[n], f = Math.min(1, M.m / M_ALIGN), isA = M === aligned;
      if (f < 0.06) continue;
      var rr = 12 + f * 10;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(170,190,255," + (0.18 * f + 0.06).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(M.x, M.y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = isA ? "rgba(94,234,212,0.85)" : "rgba(220,230,255," + (0.35 + 0.4 * f).toFixed(3) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(M.x, M.y, rr, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
    }
  }

  function perturb(ev) {
    if (ev.target && ev.target.closest && ev.target.closest("a, button, input, textarea, select")) return;
    var r = canvas.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    wells.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: 0, id: ++perturbations });
    deposit(ev.clientX - r.left, ev.clientY - r.top);
    if (wells.length > 5) wells.shift();
  }

  // --- the loop -------------------------------------------------------------
  // DRIFT     the calm flock: lineages compete, links form and dissolve
  // CONNECT   every agent links to every other; the network tightens and swirls
  // COLLAPSE  the whole connected network falls into a single point
  // HOLD      the singularity: one bright point, briefly
  // BANG      it explodes outward into a new generation, then drifts again
  var DRIFT = 0, CONNECT = 1, COLLAPSE = 2, HOLD = 3, BANG = 4;
  var phase = DRIFT, phaseT = 0, cycles = 0;
  var T_FIRST = 1800, T_DRIFT = 4800, T_CONNECT = 2200, T_COLLAPSE = 1800,
      T_HOLD = 500, T_BANG = 2200;

  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  // where the singularity forms by default: in the open space right of the
  // identity card on wide screens, at the top-right corner of it on phones,
  // so it never sits behind the name or the bio
  var NARROW = 640;
  function homeS0() {
    var card = document.querySelector(".idcard");
    if (card) {
      var r = card.getBoundingClientRect(), host = canvas.getBoundingClientRect();
      var top = r.top - host.top;
      if (W >= NARROW) return { x: Math.min(W - 90, r.right - host.left - 130), y: top + r.height * 0.42 };
      return { x: W - 46, y: Math.max(40, top - 4) };
    }
    return W < NARROW ? { x: W * 0.8, y: H * 0.18 } : { x: W * 0.72, y: H * 0.3 };
  }

  // where it actually forms. this point can move: human curvature (below)
  // pulls it, and it glides there while the swarm drifts and connects
  var s0x = null, s0y = null;
  function center() {
    if (s0x === null) { var h = homeS0(); s0x = h.x; s0y = h.y; }
    return { x: s0x, y: s0y };
  }

  // --- human alignment -------------------------------------------------------
  // every click also leaves lasting curvature. nearby clicks accumulate into
  // one mass; it decays slowly. once a mass is heavy enough, the network
  // converges there instead of at its own default: people shape where the
  // intelligence goes. with no one pulling, it drifts back home.
  var masses = [], aligned = null, humanPull = 0;
  var M_ALIGN = 2.7,      // mass needed to redirect S0: three nearby clicks
      M_RELEASE = 1.2,    // it lets go again below this (hysteresis)
      M_MERGE = 150,      // clicks within this distance add to the same mass
      M_HALF = 16000,     // half-life of human curvature, ms
      M_SIGMA = 150, M_PULL = 44;

  function deposit(x, y) {
    var best = null, bd = M_MERGE;
    for (var i = 0; i < masses.length; i++) {
      var d = Math.hypot(masses[i].x - x, masses[i].y - y);
      if (d < bd) { bd = d; best = masses[i]; }
    }
    if (best) {
      best.x = (best.x * best.m + x) / (best.m + 1);
      best.y = (best.y * best.m + y) / (best.m + 1);
      best.m += 1;
    } else {
      masses.push({ x: x, y: y, m: 1 });
      if (masses.length > 8) masses.shift();
    }
  }

  function updateAlignment(dt) {
    var decay = Math.pow(0.5, dt / M_HALF), i, top = null;
    for (i = masses.length - 1; i >= 0; i--) {
      masses[i].m *= decay;
      if (masses[i].m < 0.05) { if (masses[i] === aligned) aligned = null; masses.splice(i, 1); }
    }
    for (i = 0; i < masses.length; i++) if (!top || masses[i].m > top.m) top = masses[i];
    if (aligned && aligned.m < M_RELEASE) aligned = null;
    if (top && top.m >= M_ALIGN) aligned = top;
    humanPull = top ? Math.min(1, top.m / M_ALIGN) : 0;

    // glide S0 toward its target, but hold it still once the collapse begins
    if (phase === DRIFT || phase === CONNECT) {
      var tgt = aligned ? { x: Math.max(60, Math.min(W - 60, aligned.x)),
                            y: Math.max(60, Math.min(H - 60, aligned.y)) } : homeS0();
      var c = center(), k = 1 - Math.exp(-dt / 650);
      s0x = c.x + (tgt.x - c.x) * k;
      s0y = c.y + (tgt.y - c.y) * k;
    }
  }

  // 0..1: how fully connected the network is
  function connected() {
    if (phase === CONNECT) return smooth(phaseT / T_CONNECT);
    if (phase === COLLAPSE || phase === HOLD) return 1;
    return 0;
  }

  // 0..1: how far it has fallen into the point
  function collapsed() {
    if (phase === COLLAPSE) return smooth(phaseT / T_COLLAPSE);
    if (phase === HOLD) return 1;
    return 0;
  }

  var lastW = -1;
  function resize() {
    if (canvas.clientWidth === lastW && W) return;   // height is fixed in CSS
    lastW = canvas.clientWidth;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    s0x = null;                                // re-home S0 for the new layout
    var want = Math.round(Math.min(140, Math.max(36, (W * H) / 11000)));
    if (want !== N) { N = want; seed(); }
  }

  function seed() {
    agents = [];
    for (var i = 0; i < N; i++) {
      agents.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        hue: HUES[(Math.random() * HUES.length) | 0],
        r: 1.1 + Math.random() * 1.7,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  // one selection event: a winner is chosen, its lineage spreads to neighbours
  function select() {
    if (!agents.length) return;
    var w = agents[(Math.random() * agents.length) | 0];
    if (Math.random() < 0.12) w.hue = (w.hue + 40 + Math.random() * 90) % 360;
    events.push({ x: w.x, y: w.y, t: 0, hue: w.hue });
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (Math.hypot(a.x - w.x, a.y - w.y) < 155 && Math.random() < 0.55) a.hue = w.hue;
    }
  }

  // at the start of the collapse, record where each agent is and how it is
  // already moving, so the fall continues its motion instead of replacing it
  var SWIRL = 2.4;                               // extra turn during the fall, rad
  function beginCollapse() {
    var c = center();
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i], dx = a.x - c.x, dy = a.y - c.y, r = Math.hypot(dx, dy) || 0.001;
      var ux = dx / r, uy = dy / r;
      a.r0 = r; a.th0 = Math.atan2(dy, dx);
      a.vr0 = Math.max(-0.4, Math.min(0.2, (a.vx * ux + a.vy * uy) * 0.06));     // px/ms
      a.w0 = Math.max(-0.008, Math.min(0.008, (a.vy * ux - a.vx * uy) * 0.06 / r)); // rad/ms
      a.rEnd = 3 + (i % 5);
    }
  }

  // the big bang: every agent is flung outward from the point and reborn as
  // a new generation of lineages
  function bang() {
    var c = center();
    var shift = 40 + Math.random() * 90;
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      var ang = (i / agents.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var sp = 3 + Math.random() * 6;             // spread refills the screen
      a.x = c.x + Math.cos(ang) * 2; a.y = c.y + Math.sin(ang) * 2;
      a.vx = Math.cos(ang) * sp; a.vy = Math.sin(ang) * sp;
      a.hue = (HUES[(Math.random() * HUES.length) | 0] + shift) % 360;
    }
    events.push({ x: c.x, y: c.y, t: 0, hue: 190, big: true });
  }

  function flock(a, i, sepScale) {
    var j, b, dx, dy, d;
    var cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
    for (j = 0; j < agents.length; j++) {
      if (j === i) continue;
      b = agents[j];
      dx = b.x - a.x; dy = b.y - a.y;
      d = dx * dx + dy * dy;
      if (d > LINK * LINK || d === 0) continue;
      d = Math.sqrt(d); n++;
      cx += b.x; cy += b.y;                        // cohesion
      ax += b.vx; ay += b.vy;                      // alignment
      if (d < 34) { sx -= dx / d; sy -= dy / d; }  // separation
    }
    if (n) {
      a.vx += ((cx / n - a.x) * 0.00035) + ((ax / n - a.vx) * 0.014);
      a.vy += ((cy / n - a.y) * 0.00035) + ((ay / n - a.vy) * 0.014);
      a.vx += sx * 0.035 * sepScale; a.vy += sy * 0.035 * sepScale;
    }
  }

  function step(dt) {
    var c = center(), k = connected(), z = collapsed();

    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];

      if (phase === COLLAPSE || phase === HOLD) {
        // fall into the point along a spiral that starts with each agent's own
        // radial and angular speed (so there is no jolt when the collapse
        // begins), accelerates its turn as it falls, and comes to rest on a
        // tiny living core. radius: cubic Hermite from r0 to rEnd.
        var T = T_COLLAPSE, rad, ang;
        if (phase === COLLAPSE) {
          var u = Math.min(1, phaseT / T), u2 = u * u, u3 = u2 * u;
          rad = (2 * u3 - 3 * u2 + 1) * a.r0 + (u3 - 2 * u2 + u) * T * a.vr0 + (3 * u2 - 2 * u3) * a.rEnd;
          ang = a.th0 + a.w0 * T * u + SWIRL * u3;
        } else {
          rad = a.rEnd;                                  // keep turning at the
          ang = a.th0 + a.w0 * T + SWIRL                 // speed it arrived with
              + (a.w0 + 3 * SWIRL / T) * phaseT;
        }
        rad = Math.max(0.5, rad);
        a.x = c.x + Math.cos(ang) * rad;
        a.y = c.y + Math.sin(ang) * rad;
        continue;
      }

      flock(a, i, 1 - k * 0.6);

      if (phase === CONNECT) {
        // the connected network draws together and begins to turn
        var ddx = c.x - a.x, ddy = c.y - a.y;
        var pull = 0.0002 + k * 0.0007;
        a.vx += ddx * pull - ddy * k * 0.0005;
        a.vy += ddy * pull + ddx * k * 0.0005;
        a.vx *= 0.975; a.vy *= 0.975;
      }

      // gentle wander so the swarm never settles into a crystal
      a.ph += dt * 0.0007;
      a.vx += Math.cos(a.ph) * 0.006;
      a.vy += Math.sin(a.ph * 1.3) * 0.006;

      // gravity wells: a brief pull toward each mass, and an outward kick as
      // the wave front passes through
      for (var hm2 = 0; hm2 < masses.length; hm2++) {
        var M2 = masses[hm2], hx = M2.x - a.x, hy = M2.y - a.y, hd = Math.hypot(hx, hy) || 1;
        if (hd > 480) continue;
        var hg = Math.min(1, M2.m / M_ALIGN) * Math.exp(-hd * hd / (2 * 200 * 200)) * 0.018 * dt / 16;
        a.vx += hx / hd * hg; a.vy += hy / hd * hg;
      }

      var boostW = 0;
      for (var n2 = 0; n2 < wells.length; n2++) {
        var w2 = wells[n2], wx = w2.x - a.x, wy = w2.y - a.y, wd = Math.hypot(wx, wy) || 1;
        if (wd > 520) continue;
        var env2 = Math.exp(-w2.t / 1300);
        var g2 = env2 * Math.exp(-wd * wd / (2 * 170 * 170));
        a.vx += wx / wd * g2 * 0.045 * dt / 16;
        a.vy += wy / wd * g2 * 0.045 * dt / 16;
        var off2 = wd - w2.t * W_SPEED;
        if (Math.abs(off2) < 26) {
          var kick = 0.14 * Math.exp(-w2.t / 1800);
          a.vx -= wx / wd * kick; a.vy -= wy / wd * kick;
        }
        boostW = Math.max(boostW, g2 * 1.4 + (Math.abs(off2) < 60 ? 0.8 * Math.exp(-w2.t / 1800) : 0));
      }

      // steer off the edges rather than wrapping, so links stay local
      var m = 90;
      if (a.x < m)     a.vx += (m - a.x) * 0.00055;
      if (a.x > W - m) a.vx -= (a.x - (W - m)) * 0.00055;
      if (a.y < m)     a.vy += (m - a.y) * 0.00055;
      if (a.y > H - m) a.vy -= (a.y - (H - m)) * 0.00055;

      // speed cap: calm while drifting, faster while connecting, released for
      // the bang and easing back to calm as the new generation spreads out
      var MAX = 0.62;
      if (phase === CONNECT) MAX = 0.62 + k * 1.2;
      if (phase === BANG) MAX = 0.62 + 7.5 * (1 - smooth(phaseT / T_BANG));
      MAX += boostW;                             // wells may briefly speed agents up
      var sp = Math.hypot(a.vx, a.vy);
      if (sp > MAX) { a.vx = a.vx / sp * MAX; a.vy = a.vy / sp * MAX; }
      if (sp < 0.12 && phase === DRIFT) { a.vx *= 1.06; a.vy *= 1.06; }

      a.x += a.vx * dt * 0.06;
      a.y += a.vy * dt * 0.06;

      // bounce off the frame so the bang can't throw agents off screen
      if (a.x < 8)     { a.x = 8;     a.vx = Math.abs(a.vx); }
      if (a.x > W - 8) { a.x = W - 8; a.vx = -Math.abs(a.vx); }
      if (a.y < 8)     { a.y = 8;     a.vy = Math.abs(a.vy); }
      if (a.y > H - 8) { a.y = H - 8; a.vy = -Math.abs(a.vy); }
    }
  }

  // ---- instrument layer ----------------------------------------------------
  // drawn under the swarm, very faint: a polar measurement field centred on the
  // singularity point, like a telescope reticle or a detector display
  var bezelSpin = 0;

  function drawField(c, k, z, dt) {
    var R = Math.min(W, H) * (W < NARROW ? 0.2 : 0.26);   // the bezel ring
    var lift = k * 0.5 + z * 0.5;            // field brightens as it converges
    bezelSpin += dt * 0.000012;

    ctx.save();
    ctx.lineWidth = 0.6;

    // range rings: dashed, evenly spaced out to the bezel
    ctx.setLineDash([1.5, 5]);
    for (var r = R / 4; r <= R + 0.5; r += R / 4) {
      ctx.strokeStyle = "rgba(170,190,255," + (0.07 + lift * 0.05).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]);

    // axes: fine crosshair lines through the point, fading with distance
    var ax = ctx.createLinearGradient(c.x - R * 1.6, 0, c.x + R * 1.6, 0);
    ax.addColorStop(0, "rgba(170,190,255,0)");
    ax.addColorStop(0.5, "rgba(170,190,255," + (0.12 + lift * 0.08).toFixed(3) + ")");
    ax.addColorStop(1, "rgba(170,190,255,0)");
    ctx.strokeStyle = ax;
    ctx.beginPath(); ctx.moveTo(c.x - R * 1.6, c.y); ctx.lineTo(c.x + R * 1.6, c.y); ctx.stroke();
    var ay = ctx.createLinearGradient(0, c.y - R * 1.6, 0, c.y + R * 1.6);
    ay.addColorStop(0, "rgba(170,190,255,0)");
    ay.addColorStop(0.5, "rgba(170,190,255," + (0.12 + lift * 0.08).toFixed(3) + ")");
    ay.addColorStop(1, "rgba(170,190,255,0)");
    ctx.strokeStyle = ay;
    ctx.beginPath(); ctx.moveTo(c.x, c.y - R * 1.6); ctx.lineTo(c.x, c.y + R * 1.6); ctx.stroke();

    // bezel: degree ticks every 5°, long every 30°, slowly rotating
    for (var t = 0; t < 72; t++) {
      var ang = bezelSpin + t * Math.PI / 36;
      var major = t % 6 === 0;
      var r0 = R + 3, r1 = R + (major ? 12 : 6);
      ctx.strokeStyle = "rgba(190,205,255," + ((major ? 0.26 : 0.12) + lift * 0.1).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(ang) * r0, c.y + Math.sin(ang) * r0);
      ctx.lineTo(c.x + Math.cos(ang) * r1, c.y + Math.sin(ang) * r1);
      ctx.stroke();
    }

    ctx.restore();
  }

  // lock-on reticle at the singularity point: corner brackets that tighten as
  // the network collapses. No text readout: on a personal page it reads as
  // debug output.
  function drawReticle(c, z, meanR) {
    var s = 30 - z * 16;                     // bracket half-size
    var arm = 7;
    var al = 0.3 + z * 0.55;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(210,255,248," + al.toFixed(3) + ")";
    ctx.beginPath();
    // four corner brackets
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) {
      var x = c.x + q[0] * s, y = c.y + q[1] * s;
      ctx.moveTo(x, y - q[1] * arm); ctx.lineTo(x, y); ctx.lineTo(x - q[0] * arm, y);
    });
    ctx.stroke();

    ctx.restore();
  }

  // event horizon at the singularity: a thin photon ring and a faint,
  // tilted accretion disk
  function drawHorizon(c, h) {
    if (h <= 0.01) return;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(-0.35);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(196,181,253," + (0.35 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(125,211,252," + (0.22 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.ellipse(0, 0, 64, 15, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(240,255,252," + (0.85 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(240,255,252," + (0.25 * h).toFixed(3) + ")";
    ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function draw(dt, force) {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d;
    var c = center(), k = connected(), z = collapsed();
    var flare = phase === BANG ? 1 - smooth(phaseT / 800) : 0;

    var meanR = 0;
    for (i = 0; i < agents.length; i++) meanR += Math.hypot(agents[i].x - c.x, agents[i].y - c.y);
    meanR /= agents.length || 1;
    var links = 0;

    drawFabric();
    drawField(c, k, z, dt);
    drawWells();

    // gravitational lensing: everything is drawn where bent spacetime puts it
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      warp(a.x, a.y); a.rx = a.x + WX; a.ry = a.y + WY;
    }

    // the singularity glow: rises as the network collapses, flares at the bang
    var coreI = Math.max(z, flare);
    if (coreI > 0.02) {
      var cr = 36 + coreI * 70 + flare * 110;
      var cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, cr);
      cg.addColorStop(0, "rgba(240,255,252," + (0.55 * coreI + 0.3 * flare).toFixed(3) + ")");
      cg.addColorStop(0.3, "hsla(262,90%,78%," + (0.2 * coreI + 0.12 * flare).toFixed(3) + ")");
      cg.addColorStop(1, "hsla(262,90%,70%,0)");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(c.x, c.y, cr, 0, Math.PI * 2); ctx.fill();
    }

    // links. drifting: only near neighbours, as before. connecting: every
    // agent reaches every other; the web is kept faint so it reads as fine
    // structure rather than a white mesh
    var diag = Math.hypot(W, H);
    // lines fade out as the network collapses (the glow carries the light)
    // and fade back in after the bang, once the agents are apart again
    var linkFade = phase === BANG ? smooth((phaseT - 250) / 900) : 1 - z * 0.85;
    ctx.lineWidth = 0.7;
    // every link is batched: local links by lineage colour and opacity, the
    // all-to-all web by opacity alone. one path per bucket keeps a fully
    // connected network of 140 agents (9,730 links) to a few dozen strokes
    var BUCKETS = 6, WEB_MAX = 0.055, webPaths = [];
    var HUE_B = 12, LOC_B = 5, LOC_MAX = 0.3, localPaths = {};
    for (i = 0; i < BUCKETS; i++) webPaths.push([]);
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      for (j = i + 1; j < agents.length; j++) {
        b = agents[j];
        dx = b.rx - a.rx; dy = b.ry - a.ry;
        d = dx * dx + dy * dy;
        if (k === 0 && d > LINK * LINK) continue;
        d = Math.sqrt(d);
        var same = Math.abs(a.hue - b.hue) < 12;
        var la = d < LINK ? (1 - d / LINK) * (same ? 0.3 : 0.12) * (1 - k * 0.4) * linkFade : 0;
        var wa = k * WEB_MAX * (1 - 0.6 * Math.min(1, d / (diag * 0.6))) * linkFade;
        if (la < 0.006 && wa < 0.006) continue;
        links++;
        if (la >= wa) {
          var hb = (((a.hue + b.hue) / 2 % 360 + 360) % 360 / (360 / HUE_B)) | 0;
          var ab = Math.min(LOC_B - 1, (la / LOC_MAX * LOC_B) | 0);
          var key = hb * LOC_B + ab;
          (localPaths[key] || (localPaths[key] = [])).push(a, b);
        } else {
          webPaths[Math.min(BUCKETS - 1, (wa / WEB_MAX * BUCKETS) | 0)].push(a, b);
        }
      }
    }
    for (var key2 in localPaths) {
      var lp = localPaths[key2], kk = +key2;
      var hue = ((kk / LOC_B) | 0) * (360 / HUE_B) + 180 / HUE_B;
      var la2 = ((kk % LOC_B) + 0.5) / LOC_B * LOC_MAX;
      ctx.strokeStyle = "hsla(" + hue.toFixed(0) + ",85%,74%," + la2.toFixed(3) + ")";
      ctx.beginPath();
      for (j = 0; j < lp.length; j += 2) { ctx.moveTo(lp[j].rx, lp[j].ry); ctx.lineTo(lp[j + 1].rx, lp[j + 1].ry); }
      ctx.stroke();
    }
    for (i = 0; i < BUCKETS; i++) {
      var wp = webPaths[i];
      if (!wp.length) continue;
      ctx.strokeStyle = "hsla(245,80%,82%," + ((i + 0.5) / BUCKETS * WEB_MAX).toFixed(4) + ")";
      ctx.beginPath();
      for (j = 0; j < wp.length; j += 2) { ctx.moveTo(wp[j].rx, wp[j].ry); ctx.lineTo(wp[j + 1].rx, wp[j + 1].ry); }
      ctx.stroke();
    }

    // selection pulses, and the big bang: the same thin ring, wider and slower
    for (i = events.length - 1; i >= 0; i--) {
      var e = events[i];
      e.t += dt;
      var p = e.t / (e.big ? 2000 : 1150);
      if (p >= 1) { events.splice(i, 1); continue; }
      var ease = e.big ? 1 - (1 - p) * (1 - p) : p;
      var maxR = e.big ? diag * 0.6 : 124;
      ctx.strokeStyle = "hsla(" + e.hue + ",90%,78%," + ((1 - p) * (e.big ? 0.6 : 0.5)).toFixed(3) + ")";
      ctx.lineWidth = (e.big ? 2 : 1.4) * (1 - p) + 0.3;
      ctx.beginPath(); ctx.arc(e.x, e.y, 8 + ease * maxR, 0, Math.PI * 2); ctx.stroke();
    }

    // agents. halos fade as they pile into the point so the core stays a
    // point of light, not a blown-out disc
    var haloA = 0.10 * (1 - z * 0.85);
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      ctx.fillStyle = "hsla(" + a.hue + ",92%,78%,0.85)";
      ctx.beginPath(); ctx.arc(a.rx, a.ry, a.r, 0, Math.PI * 2); ctx.fill();
      if (haloA > 0.005) {
        ctx.fillStyle = "hsla(" + a.hue + ",95%,70%," + haloA.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(a.rx, a.ry, a.r * 5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // event horizon: visible at the singularity, lingering into the bang
    var h = phase === HOLD ? 1 : phase === COLLAPSE ? smooth((phaseT / T_COLLAPSE - 0.6) / 0.4)
          : phase === BANG ? 1 - smooth(phaseT / 600) : 0;
    drawHorizon(c, h);
    drawReticle(c, z, meanR);
  }

  var last = 0, sinceSelect = 0;
  function frame(ts) {
    var dt = Math.min(ts - last, 42) || 16;
    last = ts;
    phaseT += dt;
    updateAlignment(dt);
    for (var wi = wells.length - 1; wi >= 0; wi--) {
      wells[wi].t += dt;
      if (wells[wi].t > W_LIFE) wells.splice(wi, 1);
    }

    if (phase === DRIFT) {
      // lineages keep competing while the swarm drifts
      sinceSelect += dt;
      if (sinceSelect > 2600) { sinceSelect = 0; select(); }
      // the first singularity comes early so visitors see it right away
      if (phaseT > (cycles === 0 ? T_FIRST : T_DRIFT)) { phase = CONNECT; phaseT = 0; }
    } else if (phase === CONNECT) {
      if (phaseT > T_CONNECT) { phase = COLLAPSE; phaseT -= T_CONNECT; beginCollapse(); }  // carry the leftover time: no stalled frame
    } else if (phase === COLLAPSE) {
      if (phaseT > T_COLLAPSE) { phase = HOLD; phaseT -= T_COLLAPSE; }
    } else if (phase === HOLD) {
      if (phaseT > T_HOLD) { phase = BANG; phaseT = 0; bang(); }
    } else if (phaseT > T_BANG) {
      phase = DRIFT; phaseT = 0; cycles++; sinceSelect = 0;
    }

    step(dt);
    draw(dt);
    raf = running ? requestAnimationFrame(frame) : 0;
  }

  var running = false, raf = 0, visible = true;
  function setRunning(on) {
    on = on && visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(function (t) { last = t; frame(t); });
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  window.addEventListener("resize", resize);
  if (!reduced) window.addEventListener("pointerdown", perturb);
  resize();
  // fonts and images can move the identity card after first layout
  window.addEventListener("load", function () { s0x = null; });

  if (reduced) {
    // static frame: the fully connected network, just before it collapses
    for (var s = 0; s < 220; s++) step(16);
    phase = CONNECT; phaseT = T_CONNECT;
    for (s = 0; s < 60; s++) step(16);
    draw(16, true);
  } else {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting; setRunning(true);
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { setRunning(true); });
    setRunning(true);
  }
})();
