/* Pizarra de fútbol sala: pista SVG, jugadores arrastrables, reproducción de jugadas.
   Coordenadas de pista en metros: x 0..40 (0 = nuestra portería), y 0..20. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const L = 40, Wd = 20, PAD = 2.2;            // metros
  const OURS = ["G1", "G2", "G3", "G4", "G5"], RIVALS = ["R1", "R2", "R3", "R4", "R5"];

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const clone = o => JSON.parse(JSON.stringify(o));

  // Formaciones base para la pizarra libre
  const FORMATIONS = {
    "3-1": {
      label: "Ataque 3-1 (rombo)",
      pos: { G1: [1.2, 10], G2: [7, 10], G3: [13, 2.5], G4: [15.5, 17.5], G5: [30.5, 10],
             R1: [38.8, 10], R2: [28.8, 10.2], R3: [19.7, 6.5], R4: [20.3, 14.7], R5: [14.7, 10.2] },
      ball: "G2" },
    "4-0": {
      label: "Ataque 4-0",
      pos: { G1: [1.2, 10], G2: [17, 2.5], G3: [17, 7.5], G4: [17, 12.5], G5: [17, 17.5],
             R1: [38.8, 10], R2: [23, 4], R3: [23, 9], R4: [23, 14], R5: [27, 10] },
      ball: "G3" },
    "121": {
      label: "Defensa 1-2-1 (rombo)",
      pos: { G1: [1.2, 10], G2: [7.4, 9.6], G3: [11.6, 5.8], G4: [11.6, 13.4], G5: [15.3, 9.6],
             R1: [38.8, 10], R2: [17.5, 17], R3: [18.5, 5.4], R4: [21, 10.6], R5: [5.7, 11] },
      ball: "R4" },
    "saque": {
      label: "Saque inicial",
      pos: { G1: [1.2, 10], G2: [10, 10], G3: [17, 4], G4: [17, 16], G5: [19.6, 10.6],
             R1: [38.8, 10], R2: [30, 10], R3: [23, 4], R4: [23, 16], R5: [23.5, 10] },
      ball: [20, 10] },
  };

  class Board {
    constructor(container, opts = {}) {
      this.c = container;
      this.opts = opts;
      this.state = clone(FORMATIONS["3-1"].pos);
      this.ball = FORMATIONS["3-1"].ball;
      this.showRivals = true;
      this.tool = "move";            // move | run | pass | rival | erase
      this.drawings = [];
      this.play = null; this.frames = null; this.cur = 0; this.u = 1; this.playing = false; this.speed = 1;
      this.onStep = opts.onStep || (() => {});
      this.vertical = null;
      this.svg = el("svg", { class: "court-svg", role: "img", "aria-label": "Pista de fútbol sala" }, container);
      this.gCourt = el("g", {}, this.svg);
      this.gTrails = el("g", {}, this.svg);
      this.gDraw = el("g", {}, this.svg);
      this.gPlayers = el("g", {}, this.svg);
      this.nodes = {};
      this._defs();
      this._layout();
      new ResizeObserver(() => this._layout()).observe(container);
      this._bindDraw();
    }

    // ---------- geometry ----------
    P(x, y) { return this.vertical ? [(y + PAD) * 10, (L - x + PAD) * 10] : [(x + PAD) * 10, (y + PAD) * 10]; }
    fromClient(ev) {
      const pt = this.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(this.svg.getScreenCTM().inverse());
      let x, y;
      if (this.vertical) { y = p.x / 10 - PAD; x = L - (p.y / 10 - PAD); }
      else { x = p.x / 10 - PAD; y = p.y / 10 - PAD; }
      return [Math.max(-1.5, Math.min(L + 1.5, x)), Math.max(-1.5, Math.min(Wd + 1.5, y))];
    }
    _layout() {
      const w = this.c.clientWidth, h = window.innerHeight;
      const vert = this.opts.forceVertical || (w < 620 && h > w * 1.1);
      if (vert === this.vertical) return;
      this.vertical = vert;
      const W = (L + 2 * PAD) * 10, H = (Wd + 2 * PAD) * 10;
      this.svg.setAttribute("viewBox", vert ? `0 0 ${H} ${W}` : `0 0 ${W} ${H}`);
      this.c.classList.toggle("vertical", vert);
      this._drawCourt();
      this.render();
    }

    _defs() {
      const d = el("defs", {}, this.svg);
      const mk = (id, color) => {
        const m = el("marker", { id, viewBox: "0 0 10 10", refX: 7, refY: 5, markerWidth: 4.2, markerHeight: 4.2, orient: "auto-start-reverse" }, d);
        el("path", { d: "M0,0 L10,5 L0,10 z", fill: color }, m);
      };
      this.uid = Math.random().toString(36).slice(2, 7);
      mk("ah-run-" + this.uid, "#4ade80"); mk("ah-pass-" + this.uid, "#ffffff"); mk("ah-rival-" + this.uid, "#f87171");
      mk("ah-free-" + this.uid, "#facc15");
    }

    _drawCourt() {
      const g = this.gCourt; g.innerHTML = "";
      const [ax, ay] = this.P(0, 0), [bx, by] = this.P(L, Wd);
      const x0 = Math.min(ax, bx), y0 = Math.min(ay, by), w = Math.abs(bx - ax), h = Math.abs(by - ay);
      el("rect", { x: x0 - 14, y: y0 - 14, width: w + 28, height: h + 28, rx: 10, class: "c-out" }, g);
      el("rect", { x: x0, y: y0, width: w, height: h, class: "c-floor" }, g);
      const line = (pts, extra = {}) => el("polyline", Object.assign({ points: pts.map(p => this.P(...p).join(",")).join(" "), class: "c-line", fill: "none" }, extra), g);
      line([[0, 0], [L, 0], [L, Wd], [0, Wd], [0, 0]]);
      line([[20, 0], [20, Wd]]);
      const c = this.P(20, 10);
      el("circle", { cx: c[0], cy: c[1], r: 30, class: "c-line", fill: "none" }, g);
      el("circle", { cx: c[0], cy: c[1], r: 3, class: "c-dot" }, g);
      for (const side of [0, 1]) {
        const gx = side ? L : 0, d = side ? -1 : 1;
        // área de penalti: cuartos de círculo de 6 m desde cada poste + recta
        const pts = [];
        for (let a = 0; a <= 90; a += 6) { const r = a * Math.PI / 180; pts.push([gx + d * 6 * Math.sin(r), 8.5 - 6 * Math.cos(r)]); }
        for (let a = 90; a >= 0; a -= 6) { const r = a * Math.PI / 180; pts.push([gx + d * 6 * Math.sin(r), 11.5 + 6 * Math.cos(r)]); }
        el("polygon", { points: pts.concat([[gx, 14.5 + 3], [gx, 2.5]]).map(p => this.P(...p).join(",")).join(" "), class: "c-area" }, g);
        line(pts);
        for (const m of [6, 10]) { const p = this.P(gx + d * m, 10); el("circle", { cx: p[0], cy: p[1], r: 3, class: "c-dot" }, g); }
        const g0 = this.P(gx, 8.5), g1 = this.P(gx - d * 1, 11.5);
        el("rect", { x: Math.min(g0[0], g1[0]), y: Math.min(g0[1], g1[1]), width: Math.abs(g1[0] - g0[0]), height: Math.abs(g1[1] - g0[1]), class: "c-goal" }, g);
      }
      for (const xx of [10, 15, 25, 30]) line([[xx, Wd - 0.35], [xx, Wd + 0.5]]);
      // flecha de ataque
      const a0 = this.P(23, -1.15), a1 = this.P(31, -1.15);
      el("line", { x1: a0[0], y1: a0[1], x2: a1[0], y2: a1[1], class: "c-attack", "marker-end": `url(#ah-pass-${this.uid})` }, g);
    }

    // ---------- state ----------
    ballPos(state, ball) {
      if (Array.isArray(ball)) return ball;
      const p = state[ball]; if (!p) return [20, 10];
      const dir = ball[0] === "G" ? 1 : -1;
      return [p[0] + 0.75 * dir, p[1] + 0.35];
    }
    setFormation(key) {
      const f = FORMATIONS[key]; if (!f) return;
      this.stop(); this.play = null; this.frames = null;
      this.state = clone(f.pos); this.ball = clone(f.ball); this.ballXY = null;
      this.clearTrails(); this.render();
    }

    // ---------- rendering ----------
    _ensureNodes() {
      if (Object.keys(this.nodes).length) return;
      for (const id of OURS.concat(RIVALS)) {
        const g = el("g", { class: "pl " + (id[0] === "G" ? "ours" : "riv") + (id.endsWith("1") ? " gk" : ""), "data-id": id }, this.gPlayers);
        el("circle", { r: 9.5, class: "pl-shadow", cx: 1.5, cy: 2 }, g);
        el("circle", { r: 9.5, class: "pl-body" }, g);
        if (id[0] === "G" && !id.endsWith("1")) el("path", { class: "pl-stripe", d: "M-3,-9 L3,-9 L3,9 L-3,9 Z" }, g);
        el("circle", { r: 9.5, class: "pl-ring" }, g);
        const t = el("text", { class: "pl-num", "text-anchor": "middle", y: 4 }, g); t.textContent = id[1];
        el("circle", { r: 18, class: "pl-hit" }, g);
        this.nodes[id] = g;
        this._makeDraggable(g, id);
      }
      const b = el("g", { class: "ball", "data-id": "ball" }, this.gPlayers);
      el("circle", { r: 5.2, class: "ball-body" }, b);
      el("circle", { r: 2, class: "ball-dot" }, b);
      el("circle", { r: 7, class: "pl-hit" }, b);
      this.nodes.ball = b;
      this._makeDraggable(b, "ball");
    }
    render() {
      this._ensureNodes();
      for (const id in this.state) {
        const n = this.nodes[id]; if (!n) continue;
        const [x, y] = this.P(...this.state[id]);
        n.setAttribute("transform", `translate(${x},${y})`);
        n.style.display = (id[0] === "R" && !this.showRivals) ? "none" : "";
      }
      const bp = this.ballXY || this.ballPos(this.state, this.ball);
      const [bx, by] = this.P(...bp);
      this.nodes.ball.setAttribute("transform", `translate(${bx},${by})`);
      this._renderDrawings();
    }

    // ---------- drag ----------
    _makeDraggable(node, id) {
      node.addEventListener("pointerdown", ev => {
        if (this.tool !== "move") return;
        ev.preventDefault(); ev.stopPropagation();
        node.setPointerCapture(ev.pointerId);
        this.stop();
        node.classList.add("dragging");
        if (id === "ball") { this.ballXY = this.ballPos(this.state, this.ball); }
        const move = e => {
          const p = this.fromClient(e);
          if (id === "ball") { this.ballXY = p; this.ball = p; }
          else {
            const holder = !Array.isArray(this.ball) && this.ball === id;
            this.state[id] = p;
            if (holder) this.ballXY = null;
          }
          this.render();
        };
        const up = e => {
          node.classList.remove("dragging");
          node.removeEventListener("pointermove", move);
          node.removeEventListener("pointerup", up);
          node.removeEventListener("pointercancel", up);
          if (id === "ball") {
            // si se suelta junto a un jugador, pasa a ser suyo
            let best = null, bd = 1.6;
            for (const pid in this.state) {
              if (pid[0] === "R" && !this.showRivals) continue;
              const d = dist(this.state[pid], this.ballXY); if (d < bd) { bd = d; best = pid; }
            }
            if (best) { this.ball = best; this.ballXY = null; } else { this.ball = this.ballXY; }
            this.render();
          }
          if (this.opts.onChange) this.opts.onChange();
        };
        node.addEventListener("pointermove", move);
        node.addEventListener("pointerup", up);
        node.addEventListener("pointercancel", up);
      });
    }

    // ---------- free drawing (arrows) ----------
    _bindDraw() {
      let cur = null;
      this.svg.addEventListener("pointerdown", ev => {
        if (this.tool === "move") return;
        ev.preventDefault();
        const p = this.fromClient(ev);
        if (this.tool === "erase") {
          let best = -1, bd = 2;
          this.drawings.forEach((d, i) => { const m = [(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2];
            const dd = Math.min(dist(p, d.a), dist(p, d.b), dist(p, m)); if (dd < bd) { bd = dd; best = i; } });
          if (best >= 0) { this.drawings.splice(best, 1); this.render(); }
          return;
        }
        this.svg.setPointerCapture(ev.pointerId);
        cur = { kind: this.tool, a: p, b: p };
        this.drawings.push(cur);
      });
      this.svg.addEventListener("pointermove", ev => { if (!cur) return; cur.b = this.fromClient(ev); this._renderDrawings(); });
      const end = () => { if (cur && dist(cur.a, cur.b) < 0.8) this.drawings.pop(); cur = null; this._renderDrawings(); };
      this.svg.addEventListener("pointerup", end);
      this.svg.addEventListener("pointercancel", end);
    }
    _renderDrawings() {
      const g = this.gDraw; g.innerHTML = "";
      for (const d of this.drawings) this._arrow(g, d.a, d.b, d.kind, 1);
    }
    _arrow(g, a, b, kind, op, opts = {}) {
      const A = this.P(...a), B = this.P(...b);
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]); if (len < 4) return;
      // acortar para no tapar al jugador
      const sh = opts.noShorten ? 0 : Math.min(11, len * 0.3), ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len;
      const s = [A[0] + ux * (opts.startGap ?? 0), A[1] + uy * (opts.startGap ?? 0)], e = [B[0] - ux * sh, B[1] - uy * sh];
      const cls = { run: "ar-run", pass: "ar-pass", rival: "ar-rival", free: "ar-free", block: "ar-block" }[kind] || "ar-free";
      const ln = el("line", { x1: s[0], y1: s[1], x2: e[0], y2: e[1], class: "ar " + cls, opacity: op }, g);
      if (kind === "block") {
        const nx = -uy, ny = ux;
        el("line", { x1: e[0] + nx * 8, y1: e[1] + ny * 8, x2: e[0] - nx * 8, y2: e[1] - ny * 8, class: "ar ar-block", opacity: op, "stroke-width": 4.5 }, g);
      } else {
        const mk = { run: "run", pass: "pass", rival: "rival" }[kind] || "free";
        ln.setAttribute("marker-end", `url(#ah-${mk}-${this.uid})`);
      }
    }
    clearDrawings() { this.drawings = []; this.render(); }
    undoDrawing() { this.drawings.pop(); this.render(); }

    // ---------- plays ----------
    loadPlay(play) {
      this.stop();
      this.play = play;
      const frames = [{ state: clone(play.start), ball: clone(play.ball), block: [] }];
      for (const st of play.steps) {
        const prev = frames[frames.length - 1];
        const s = clone(prev.state);
        for (const k in (st.moves || {})) s[k] = st.moves[k];
        frames.push({ state: s, ball: st.ball !== undefined ? st.ball : prev.ball, block: st.block || [], dur: st.dur || 1.4, text: st.text });
      }
      this.frames = frames;
      this.showRivals = true;
      this.drawings = [];
      this.goto(0);
    }
    goto(i) {
      if (!this.frames) return;
      this.cur = Math.max(0, Math.min(this.frames.length - 1, i));
      this.u = 1;
      this._applyFrame();
      this.onStep(this.cur, this.frames.length - 1);
    }
    _applyFrame() {
      const f = this.frames, i = this.cur, u = ease(this.u);
      const A = f[Math.max(0, i - 1)], B = f[i];
      const st = {};
      for (const id in B.state) st[id] = i === 0 ? B.state[id] : [lerp(A.state[id][0], B.state[id][0], u), lerp(A.state[id][1], B.state[id][1], u)];
      this.state = st;
      // balón: pase (cambia de dueño/posición) => lineal; si lo lleva el mismo jugador, va con él
      if (i > 0 && JSON.stringify(A.ball) !== JSON.stringify(B.ball)) {
        const a = this.ballPos(A.state, A.ball), b = this.ballPos(B.state, B.ball);
        const ub = ease(Math.min(1, this.u * 1.15));
        this.ballXY = [lerp(a[0], b[0], ub), lerp(a[1], b[1], ub)];
      } else this.ballXY = null;
      this.ball = B.ball;
      this._trails();
      this.render();
    }
    clearTrails() { this.gTrails.innerHTML = ""; }
    _trails() {
      const g = this.gTrails; g.innerHTML = "";
      if (!this.frames) return;
      for (let k = 1; k <= this.cur; k++) {
        const A = this.frames[k - 1], B = this.frames[k];
        const live = k === this.cur, op = live ? 1 : 0.28;
        const prog = live ? ease(this.u) : 1;
        for (const id in B.state) {
          const a = A.state[id], b = B.state[id];
          if (dist(a, b) < 0.7) continue;
          const kind = B.block.includes(id) ? "block" : id[0] === "G" ? "run" : "rival";
          const end = [lerp(a[0], b[0], Math.max(prog, 0.02)), lerp(a[1], b[1], Math.max(prog, 0.02))];
          this._arrow(g, a, live ? end : b, kind, op, { noShorten: live && prog < 1 });
        }
        if (JSON.stringify(A.ball) !== JSON.stringify(B.ball)) {
          const a = this.ballPos(A.state, A.ball), b = this.ballPos(B.state, B.ball);
          const end = [lerp(a[0], b[0], Math.max(prog, 0.02)), lerp(a[1], b[1], Math.max(prog, 0.02))];
          this._arrow(g, a, live ? end : b, "pass", op, { noShorten: live && prog < 1 });
        }
      }
    }
    playPause() {
      if (!this.frames) return;
      if (this.playing) return this.stop();
      if (this.cur >= this.frames.length - 1 && this.u >= 1) this.goto(0);
      this.playing = true;
      this.onPlayState && this.onPlayState(true);
      let last = performance.now();
      if (this.u >= 1) { this.cur++; this.u = 0; this.onStep(this.cur, this.frames.length - 1); }
      const tick = now => {
        if (!this.playing) return;
        const dt = (now - last) / 1000; last = now;
        const dur = this.frames[this.cur].dur || 1.4;
        this.u = Math.min(1, this.u + dt * this.speed / dur);
        this._applyFrame();
        if (this.u >= 1) {
          if (this.cur >= this.frames.length - 1) { this.stop(); return; }
          this._hold = (this._hold || 0) + dt * this.speed;
          if (this._hold < 0.45) { requestAnimationFrame(tick); return; }
          this._hold = 0; this.cur++; this.u = 0; this.onStep(this.cur, this.frames.length - 1);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    stop() { if (this.playing) { this.playing = false; this.onPlayState && this.onPlayState(false); } }
    step(d) { this.stop(); this.goto(this.cur + d); }

    // ---------- custom plays (recorded from the free board) ----------
    snapshot() { return { state: clone(this.state), ball: clone(Array.isArray(this.ball) ? (this.ballXY || this.ball) : this.ball) }; }
  }

  window.FutsalBoard = Board;
  window.FUTSAL_FORMATIONS = FORMATIONS;
})();
