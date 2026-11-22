(function () {
  const DATA = window.FUTSAL, CATS = DATA.cats, PLAYS = DATA.plays;
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };

  // ---------- tabs / routing ----------
  const boards = {};
  let lastTab = null;
  function route() {
    const h = (location.hash || "#jugadas").slice(1).split("/");
    const tab = ["jugadas", "pizarra", "videos"].includes(h[0]) ? h[0] : "jugadas";
    if (tab !== lastTab) { window.scrollTo(0, 0); lastTab = tab; }
    document.querySelectorAll(".tab").forEach(s => s.hidden = s.id !== "tab-" + tab);
    document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
    if (tab === "jugadas") { initPlays(); if (h[1]) selectPlay(h[1], false); }
    if (tab === "pizarra") initFree();
    if (tab === "videos") { initVideos(); showVideoCat(h[1] || currentVcat || window.VIDEO_CATS[0].id); }
  }
  window.addEventListener("hashchange", route);

  // ---------- JUGADAS ----------
  let currentPlay = null, playFilter = "todas";
  function initPlays() {
    if (boards.plays) return;
    const b = boards.plays = new FutsalBoard($("#board-plays"), { onStep: onStep });
    b.onPlayState = p => { $("#pb-play").textContent = p ? "❚❚ Pausa" : "▶ Reproducir"; };
    $("#pb-play").onclick = () => b.playPause();
    $("#pb-prev").onclick = () => b.step(-1);
    $("#pb-next").onclick = () => b.step(1);
    $("#pb-restart").onclick = () => { b.stop(); b.goto(0); };
    document.querySelectorAll("[data-speed]").forEach(btn => btn.onclick = () => {
      b.speed = parseFloat(btn.dataset.speed);
      document.querySelectorAll("[data-speed]").forEach(x => x.classList.toggle("active", x === btn));
    });
    const f = $("#play-filter");
    [["todas", "Todas"]].concat(Object.entries(CATS)).forEach(([k, v]) => {
      const c = document.createElement("button"); c.className = "chip" + (k === playFilter ? " active" : ""); c.textContent = v;
      c.onclick = () => { playFilter = k; f.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x === c)); renderPlayList(); };
      f.appendChild(c);
    });
    $("#to-board").onclick = e => {
      e.preventDefault();
      initFree();
      const fb = boards.free; fb.stop(); fb.play = null; fb.frames = null; fb.clearTrails();
      fb.state = JSON.parse(JSON.stringify(b.state)); fb.ball = JSON.parse(JSON.stringify(b.ball)); fb.ballXY = null; fb.showRivals = true;
      fb.render(); location.hash = "#pizarra";
    };
    renderPlayList();
    selectPlay(PLAYS[0].id, false);
  }
  function renderPlayList() {
    const list = $("#play-list"); list.innerHTML = "";
    PLAYS.filter(p => playFilter === "todas" || p.cat === playFilter).forEach(p => {
      const c = document.createElement("button");
      c.className = "play-card" + (currentPlay && currentPlay.id === p.id ? " active" : "");
      c.innerHTML = `<div class="pc-cat">${CATS[p.cat]}</div><div class="pc-title">${p.title}</div><div class="pc-sum">${p.summary}</div>`;
      c.onclick = () => { location.hash = "#jugadas/" + p.id; if (window.innerWidth < 1000) $("#board-plays").scrollIntoView({ behavior: "smooth", block: "center" }); };
      list.appendChild(c);
    });
  }
  function selectPlay(id, autoplay) {
    const p = PLAYS.find(x => x.id === id); if (!p || !boards.plays) return;
    if (currentPlay === p) return;
    currentPlay = p;
    $("#play-cat").textContent = CATS[p.cat];
    $("#play-title").textContent = p.title;
    $("#play-summary").textContent = p.summary;
    $("#play-source").textContent = "Fuente: " + p.source;
    const ol = $("#play-steps"); ol.innerHTML = "";
    p.steps.forEach((s, i) => {
      const li = document.createElement("li"); li.textContent = s.text;
      li.onclick = () => { boards.plays.stop(); boards.plays.goto(i + 1); };
      ol.appendChild(li);
    });
    boards.plays.loadPlay(p);
    renderPlayList();
    if (autoplay) boards.plays.playPause();
  }
  function onStep(i, n) {
    const p = currentPlay; if (!p) return;
    $("#step-now").textContent = i === 0 ? "Posición inicial. Pulsa reproducir o toca un paso." : `${i}/${n} · ${p.steps[i - 1].text}`;
    document.querySelectorAll("#play-steps li").forEach((li, k) => {
      li.classList.toggle("now", k === i - 1); li.classList.toggle("done", k < i - 1);
    });
  }

  // ---------- PIZARRA LIBRE ----------
  let rec = [];
  function initFree() {
    if (boards.free) return;
    const b = boards.free = new FutsalBoard($("#board-free"), {});
    b.onPlayState = p => { $("#rec-play").textContent = p ? "❚❚ Pausa" : "▶ Reproducir"; };
    const sel = $("#formation");
    for (const k in FUTSAL_FORMATIONS) { const o = document.createElement("option"); o.value = k; o.textContent = FUTSAL_FORMATIONS[k].label; sel.appendChild(o); }
    sel.onchange = () => b.setFormation(sel.value);
    document.querySelectorAll("#tools .tool").forEach(t => t.onclick = () => {
      b.tool = t.dataset.tool;
      document.querySelectorAll("#tools .tool").forEach(x => x.classList.toggle("active", x === t));
      $("#board-free").style.cursor = b.tool === "move" ? "" : "crosshair";
    });
    $("#toggle-rivals").onclick = () => { b.showRivals = !b.showRivals; $("#toggle-rivals").textContent = b.showRivals ? "Ocultar rivales" : "Mostrar rivales"; b.render(); };
    $("#undo-draw").onclick = () => b.undoDrawing();
    $("#clear-draw").onclick = () => b.clearDrawings();
    // grabación de jugadas propias
    const upd = () => { $("#rec-count").textContent = rec.length + (rec.length === 1 ? " paso" : " pasos"); };
    $("#rec-add").onclick = () => {
      if (b.frames) { b.frames = null; b.play = null; b.clearTrails(); }
      rec.push(b.snapshot()); upd();
    };
    $("#rec-clear").onclick = () => { rec = []; upd(); b.frames = null; b.clearTrails(); };
    $("#rec-play").onclick = () => {
      if (b.playing) return b.stop();
      if (rec.length < 2) { alertMsg("Añade al menos dos pasos."); return; }
      const last = b.snapshot();
      b.loadPlay(toPlay("Mi jugada", rec)); b.playPause();
      void last;
    };
    $("#rec-save").onclick = () => {
      if (rec.length < 2) { alertMsg("Añade al menos dos pasos antes de guardar."); return; }
      const dlg = $("#save-dlg"); $("#save-name").value = "";
      dlg.returnValue = ""; dlg.showModal();
      dlg.onclose = () => {
        if (dlg.returnValue !== "ok") return;
        const name = $("#save-name").value.trim() || "Mi jugada";
        const mine = store.get("futsal-mis-jugadas", []);
        mine.push({ name, rec, date: Date.now() });
        if (!store.set("futsal-mis-jugadas", mine)) alertMsg("No se ha podido guardar en este navegador.");
        renderMine();
      };
    };
    upd(); renderMine();
    sel.value = "3-1"; b.setFormation("3-1");
  }
  function toPlay(name, snaps) {
    return {
      id: "mine", cat: "mine", title: name, summary: "", source: "",
      start: snaps[0].state, ball: snaps[0].ball,
      steps: snaps.slice(1).map((s, i) => ({ text: "Paso " + (i + 1), moves: s.state, ball: s.ball, dur: 1.4 })),
    };
  }
  function renderMine() {
    const box = $("#my-plays"), mine = store.get("futsal-mis-jugadas", []);
    box.innerHTML = mine.length ? "" : '<p class="muted">Todavía no has guardado ninguna.</p>';
    mine.forEach((m, i) => {
      const row = document.createElement("div"); row.className = "my-play";
      const sp = document.createElement("span"); sp.textContent = m.name;
      const play = document.createElement("button"); play.textContent = "▶"; play.title = "Reproducir";
      play.onclick = () => { rec = m.rec; $("#rec-count").textContent = rec.length + " pasos"; boards.free.loadPlay(toPlay(m.name, m.rec)); boards.free.playPause(); };
      const del = document.createElement("button"); del.textContent = "🗑"; del.title = "Borrar";
      del.onclick = () => { const all = store.get("futsal-mis-jugadas", []); all.splice(i, 1); store.set("futsal-mis-jugadas", all); renderMine(); };
      row.append(sp, play, del); box.appendChild(row);
    });
  }
  function alertMsg(t) { $("#rec-count").textContent = t; setTimeout(() => { $("#rec-count").textContent = rec.length + " pasos"; }, 2500); }

  // ---------- VÍDEOS ----------
  let vInit = false, currentVcat = null;
  function initVideos() {
    if (vInit) return; vInit = true;
    const bar = $("#video-cats");
    window.VIDEO_CATS.forEach(c => {
      const b = document.createElement("a"); b.className = "chip"; b.textContent = c.title; b.href = "#videos/" + c.id; b.dataset.cat = c.id; b.style.textDecoration = "none";
      bar.appendChild(b);
    });
  }
  function showVideoCat(id) {
    const c = window.VIDEO_CATS.find(x => x.id === id) || window.VIDEO_CATS[0];
    currentVcat = c.id;
    document.querySelectorAll("#video-cats .chip").forEach(x => x.classList.toggle("active", x.dataset.cat === c.id));
    const terms = c.terms.map(t => `<div class="term"><b>${t.name}</b><p>${t.text}</p>${t.play ? `<a href="#jugadas/${t.play}">Verlo en la pizarra →</a>` : ""}</div>`).join("");
    const vids = c.videos.map(v => {
      if (v.type === "mp4") {
        const src = v.src + (v.start ? `#t=${v.start}` : "");
        return `<article class="vcard"><div class="vmedia"><video controls preload="none" playsinline poster="${v.poster}" src="${src}"></video></div>
          <div class="vbody"><div class="vtag">${v.tag}</div><div class="vtitle">${v.title}</div><p class="vdesc">${v.desc}</p></div></article>`;
      }
      return `<article class="vcard"><div class="vmedia ${v.short ? "short" : ""}" data-yt="${v.id}">
          <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy"><button class="yt-btn" aria-label="Reproducir ${v.title}"></button></div>
          <div class="vbody"><div class="vtag">${v.tag}</div><div class="vtitle">${v.title}</div><p class="vdesc">${v.desc}</p>
          <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Abrir en YouTube</a></div></article>`;
    }).join("");
    $("#video-content").innerHTML = `
      <div class="vcat-head">
        <div><div class="eyebrow">Teoría</div><h1>${c.title}</h1><div class="theory">${c.theory}</div></div>
        <div>${terms ? `<div class="eyebrow" style="margin-bottom:10px">Movimientos clave</div><div class="terms">${terms}</div>` : ""}</div>
      </div>
      <div class="eyebrow" style="margin-bottom:10px">Vídeos</div>
      <div class="vgrid">${vids}</div>`;
    document.querySelectorAll("[data-yt] .yt-btn").forEach(btn => btn.onclick = () => {
      const m = btn.parentElement, id = m.dataset.yt;
      m.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Vídeo de YouTube"></iframe>`;
    });
  }

  route();
})();
