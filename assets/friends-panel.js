/**
 * DD Games — Friends Panel & Notification System
 * Import this module on any page after Ably is loaded.
 * Usage: import '/dd-games/assets/friends-panel.js';
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://lqfcntoldutgkzaboqfk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const ABLY_KEY     = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw";
const GUEST_ID     = "00000000-0000-0000-0000-000000000000";

async function init() {
  const myID = localStorage.getItem("device_id");
  if (!myID || myID === GUEST_ID) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Detect current game from path ──────────────────────────────────────
  function detectCurrentGame() {
    const path = location.pathname;
    const match = path.match(/\/games\/(.+)\.html/);
    if (match) {
      return decodeURIComponent(match[1])
        .replace(/^0-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    if (path.includes("list.html"))  return "Browsing Games";
    if (path.includes("chat.html"))  return "In Chat";
    if (path.includes("main.html"))  return "On DD Games";
    return "On DD Games";
  }

  const currentGame = detectCurrentGame();

  // ── Inject styles ──────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --fp-bg:      #080d1a;
    --fp-surface: #0e1525;
    --fp-border:  #1a2540;
    --fp-accent:  #4f8ef7;
    --fp-accent2: #7c6af6;
    --fp-green:   #22d47a;
    --fp-red:     #f75b5b;
    --fp-yellow:  #f7c94f;
    --fp-text:    #e4eaf8;
    --fp-muted:   #4a5878;
    --fp-radius:  12px;
    --fp-w:       320px;
    --fp-shadow:  0 8px 40px rgba(0,0,0,0.6);
  }

  #fp-fab {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--fp-accent), var(--fp-accent2));
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(79,142,247,0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    font-size: 20px;
  }
  #fp-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(79,142,247,0.55); }

  #fp-fab-badge {
    position: absolute;
    top: -4px; right: -4px;
    background: var(--fp-red);
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid var(--fp-bg);
    pointer-events: none;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s, transform 0.2s;
  }
  #fp-fab-badge.visible { opacity: 1; transform: scale(1); }

  #fp-panel {
    position: fixed;
    bottom: 90px;
    left: 24px;
    width: var(--fp-w);
    max-height: 70vh;
    background: var(--fp-bg);
    border: 1px solid var(--fp-border);
    border-radius: 18px;
    box-shadow: var(--fp-shadow);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    font-family: 'DM Sans', sans-serif;
    color: var(--fp-text);
    overflow: hidden;
    transform: translateY(12px) scale(0.97);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
  }
  #fp-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }

  #fp-header {
    display: flex;
    align-items: center;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--fp-border);
    gap: 8px;
    flex-shrink: 0;
  }
  #fp-header h3 {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    flex: 1;
    letter-spacing: 0.03em;
  }
  #fp-header-btns button {
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    color: var(--fp-text);
    padding: 5px 10px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  #fp-header-btns button:hover { background: var(--fp-border); border-color: var(--fp-accent); }

  #fp-tabs {
    display: flex;
    border-bottom: 1px solid var(--fp-border);
    flex-shrink: 0;
  }
  .fp-tab {
    flex: 1;
    padding: 9px 0;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--fp-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    user-select: none;
    position: relative;
  }
  .fp-tab.active { color: var(--fp-accent); border-bottom-color: var(--fp-accent); }
  .fp-tab-badge {
    position: absolute;
    top: 4px; right: 20%;
    background: var(--fp-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 15px;
    height: 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s, transform 0.2s;
  }
  .fp-tab-badge.visible { opacity: 1; transform: scale(1); }

  #fp-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--fp-border) transparent;
  }
  #fp-body::-webkit-scrollbar { width: 4px; }
  #fp-body::-webkit-scrollbar-thumb { background: var(--fp-border); border-radius: 2px; }

  .fp-pane { display: none; padding: 10px 12px; }
  .fp-pane.active { display: block; }

  .fp-friend {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--fp-radius);
    transition: background 0.15s;
  }
  .fp-friend:hover { background: var(--fp-surface); }
  .fp-avatar {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    position: relative;
  }
  .fp-status-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 10px; height: 10px;
    border-radius: 50%;
    border: 2px solid var(--fp-bg);
  }
  .fp-status-dot.online  { background: var(--fp-green); }
  .fp-status-dot.offline { background: var(--fp-muted); }
  .fp-friend-info { flex: 1; min-width: 0; }
  .fp-friend-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fp-friend-status {
    font-size: 11px;
    color: var(--fp-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }
  .fp-friend-status.online { color: var(--fp-green); }
  .fp-friend-actions { display: flex; gap: 5px; }
  .fp-action-btn {
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    color: var(--fp-text);
    width: 28px; height: 28px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .fp-action-btn:hover { background: var(--fp-border); }
  .fp-action-btn.accept { border-color: var(--fp-green); color: var(--fp-green); }
  .fp-action-btn.accept:hover { background: rgba(34,212,122,0.12); }
  .fp-action-btn.reject { border-color: var(--fp-red); color: var(--fp-red); }
  .fp-action-btn.reject:hover { background: rgba(247,91,91,0.12); }

  #fp-add-bar {
    display: flex;
    gap: 7px;
    padding: 10px 12px;
    border-top: 1px solid var(--fp-border);
    flex-shrink: 0;
  }
  #fp-add-input {
    flex: 1;
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    color: var(--fp-text);
    padding: 8px 11px;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  #fp-add-input:focus { border-color: var(--fp-accent); }
  #fp-add-input::placeholder { color: var(--fp-muted); }
  #fp-add-btn {
    background: linear-gradient(135deg, var(--fp-accent), var(--fp-accent2));
    border: none;
    color: white;
    padding: 8px 13px;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  #fp-add-btn:hover { opacity: 0.88; }

  .fp-empty { text-align: center; color: var(--fp-muted); font-size: 13px; padding: 28px 16px; }
  .fp-empty-icon { font-size: 28px; margin-bottom: 8px; }
  .fp-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fp-muted);
    padding: 8px 10px 4px;
  }

  .fp-notif {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 9px 10px;
    border-radius: var(--fp-radius);
    transition: background 0.15s;
    cursor: pointer;
  }
  .fp-notif:hover { background: var(--fp-surface); }
  .fp-notif.unread { background: rgba(79,142,247,0.06); }
  .fp-notif-icon  { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .fp-notif-text  { flex: 1; }
  .fp-notif-title { font-size: 13px; font-weight: 500; line-height: 1.3; }
  .fp-notif-time  { font-size: 11px; color: var(--fp-muted); margin-top: 2px; }

  #fp-toasts {
    position: fixed;
    top: 20px; right: 20px;
    z-index: 11000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    max-width: 300px;
  }
  .fp-toast {
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    border-radius: 14px;
    padding: 13px 15px 0;
    box-shadow: 0 6px 24px rgba(0,0,0,0.5);
    font-family: 'DM Sans', sans-serif;
    color: var(--fp-text);
    pointer-events: auto;
    cursor: pointer;
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
    overflow: hidden;
    position: relative;
  }
  .fp-toast.in  { transform: translateX(0); opacity: 1; }
  .fp-toast.out { transform: translateX(120%); opacity: 0; transition: transform 0.3s ease, opacity 0.25s ease; }
  .fp-toast-header { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
  .fp-toast-icon  { font-size: 16px; flex-shrink: 0; }
  .fp-toast-title { font-size: 13px; font-weight: 600; }
  .fp-toast-body  { font-size: 12px; color: var(--fp-muted); padding-bottom: 12px; }
  .fp-toast-bar-wrap { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--fp-border); }
  .fp-toast-bar { height: 100%; border-radius: 2px; width: 100%; transition: width linear; }

  #fp-dm-bar {
    display: none;
    flex-wrap: wrap;
    gap: 7px;
    padding: 8px 12px;
    border-top: 1px solid var(--fp-border);
    flex-shrink: 0;
    background: var(--fp-bg);
  }
  #fp-dm-bar.visible { display: flex; }
  #fp-dm-target-label { font-size: 11px; color: var(--fp-muted); flex-basis: 100%; }
  #fp-dm-input {
    flex: 1;
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    color: var(--fp-text);
    padding: 7px 10px;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  #fp-dm-input:focus { border-color: var(--fp-accent); }
  #fp-dm-input::placeholder { color: var(--fp-muted); }
  #fp-dm-send {
    background: var(--fp-accent);
    border: none;
    color: white;
    padding: 7px 12px;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  #fp-dm-send:hover { opacity: 0.85; }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML("beforeend", `
    <div id="fp-toasts"></div>

    <button id="fp-fab" title="Friends">
      👥
      <div id="fp-fab-badge"></div>
    </button>

    <div id="fp-panel">
      <div id="fp-header">
        <h3>Friends</h3>
        <div id="fp-header-btns">
          <button id="fp-close-btn">✕</button>
        </div>
      </div>

      <div id="fp-tabs">
        <div class="fp-tab active" data-tab="friends">Friends</div>
        <div class="fp-tab" data-tab="requests">
          Requests
          <div class="fp-tab-badge" id="fp-req-badge"></div>
        </div>
        <div class="fp-tab" data-tab="notifs">
          Notifs
          <div class="fp-tab-badge" id="fp-notif-badge"></div>
        </div>
      </div>

      <div id="fp-body">
        <div class="fp-pane active" id="fp-pane-friends">
          <div class="fp-empty"><div class="fp-empty-icon">👥</div>Loading friends...</div>
        </div>
        <div class="fp-pane" id="fp-pane-requests">
          <div class="fp-empty"><div class="fp-empty-icon">📬</div>No pending requests.</div>
        </div>
        <div class="fp-pane" id="fp-pane-notifs">
          <div class="fp-empty"><div class="fp-empty-icon">🔔</div>No notifications yet.</div>
        </div>
      </div>

      <div id="fp-dm-bar">
        <div id="fp-dm-target-label"></div>
        <input id="fp-dm-input" placeholder="Quick message…" maxlength="200">
        <button id="fp-dm-send">Send</button>
      </div>

      <div id="fp-add-bar">
        <input id="fp-add-input" placeholder="Add by username…" maxlength="30">
        <button id="fp-add-btn">Add</button>
      </div>
    </div>
  `);

  // ── State ──────────────────────────────────────────────────────────────
  let panelOpen    = false;
  let friends      = [];
  let pendingIn    = [];
  let notifs       = [];
  let presence     = {};
  let dmTargetID   = null;
  let dmTargetName = null;
  let unreadNotifs = 0;
  let unreadReqs   = 0;

  const fab        = document.getElementById("fp-fab");
  const panel      = document.getElementById("fp-panel");
  const fabBadge   = document.getElementById("fp-fab-badge");
  const reqBadge   = document.getElementById("fp-req-badge");
  const notifBadge = document.getElementById("fp-notif-badge");
  const toastsEl   = document.getElementById("fp-toasts");

  // ── Helpers ────────────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  const GRAD = [
    ["#1d4ed8","#7c3aed"],["#0369a1","#0891b2"],["#7c3aed","#db2777"],
    ["#047857","#0369a1"],["#b45309","#dc2626"],["#6d28d9","#2563eb"],
  ];
  function avatarGrad(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
    const [a, b] = GRAD[Math.abs(h) % GRAD.length];
    return `linear-gradient(135deg,${a},${b})`;
  }

  function timeAgo(iso) {
    if (!iso) return "never";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function isOnline(uid) {
    const p = presence[uid];
    if (!p) return false;
    return Date.now() - new Date(p.last_seen).getTime() < 3 * 60 * 1000;
  }

  // ── Toast ──────────────────────────────────────────────────────────────
  function showToast({ icon = "🔔", title, body = "", onClick, color = "var(--fp-accent)" }) {
    const el = document.createElement("div");
    el.className = "fp-toast";
    el.innerHTML = `
      <div class="fp-toast-header">
        <span class="fp-toast-icon">${icon}</span>
        <span class="fp-toast-title">${title}</span>
      </div>
      <div class="fp-toast-body">${body}</div>
      <div class="fp-toast-bar-wrap">
        <div class="fp-toast-bar" style="background:${color}"></div>
      </div>`;
    toastsEl.appendChild(el);

    requestAnimationFrame(() => {
      el.classList.add("in");
      const bar = el.querySelector(".fp-toast-bar");
      setTimeout(() => {
        bar.style.transition = "width 5s linear";
        bar.style.width = "0%";
      }, 50);
    });

    const dismiss = () => {
      el.classList.add("out");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    };
    const timer = setTimeout(dismiss, 5300);
    el.onclick = () => { clearTimeout(timer); dismiss(); if (onClick) onClick(); };
  }

  // ── Badges ─────────────────────────────────────────────────────────────
  function updateBadges() {
    const total = unreadNotifs + unreadReqs;
    fabBadge.textContent = total > 9 ? "9+" : total;
    fabBadge.classList.toggle("visible", total > 0);
    reqBadge.textContent = unreadReqs;
    reqBadge.classList.toggle("visible", unreadReqs > 0);
    notifBadge.textContent = unreadNotifs;
    notifBadge.classList.toggle("visible", unreadNotifs > 0);
  }

  // ── Render: Friends ────────────────────────────────────────────────────
  function renderFriends() {
    const pane = document.getElementById("fp-pane-friends");
    if (!friends.length) {
      pane.innerHTML = `<div class="fp-empty"><div class="fp-empty-icon">👥</div>No friends yet.<br>Add someone below!</div>`;
      return;
    }
    const online  = friends.filter(f =>  isOnline(f.id));
    const offline = friends.filter(f => !isOnline(f.id));
    let html = "";
    if (online.length)  html += `<div class="fp-section-label">Online — ${online.length}</div>`  + online.map(f => friendCard(f, true)).join("");
    if (offline.length) html += `<div class="fp-section-label">Offline</div>` + offline.map(f => friendCard(f, false)).join("");
    pane.innerHTML = html;
    pane.querySelectorAll("[data-msg]").forEach(btn => {
      btn.addEventListener("click", () => openDmBar(btn.dataset.msg, btn.dataset.name));
    });
    pane.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeFriend(btn.dataset.remove));
    });
  }

  function friendCard(f, online) {
    const p = presence[f.id] || {};
    const statusText = online ? (p.current_game || "Online") : `Last seen ${timeAgo(p.last_seen)}`;
    return `
    <div class="fp-friend">
      <div class="fp-avatar" style="background:${avatarGrad(f.id)}">
        ${(f.name || "?")[0].toUpperCase()}
        <div class="fp-status-dot ${online ? "online" : "offline"}"></div>
      </div>
      <div class="fp-friend-info">
        <div class="fp-friend-name">${escHtml(f.name)}</div>
        <div class="fp-friend-status ${online ? "online" : ""}">${escHtml(statusText)}</div>
      </div>
      <div class="fp-friend-actions">
        <button class="fp-action-btn" title="Quick message" data-msg="${f.id}" data-name="${escHtml(f.name)}">💬</button>
        <button class="fp-action-btn reject" title="Remove" data-remove="${f.id}">✕</button>
      </div>
    </div>`;
  }

  // ── Render: Requests ───────────────────────────────────────────────────
  function renderRequests() {
    const pane = document.getElementById("fp-pane-requests");
    if (!pendingIn.length) {
      pane.innerHTML = `<div class="fp-empty"><div class="fp-empty-icon">📬</div>No pending requests.</div>`;
      return;
    }
    let html = `<div class="fp-section-label">Incoming — ${pendingIn.length}</div>`;
    pendingIn.forEach(r => {
      html += `
      <div class="fp-friend">
        <div class="fp-avatar" style="background:${avatarGrad(r.id)}">
          ${(r.name || "?")[0].toUpperCase()}
        </div>
        <div class="fp-friend-info">
          <div class="fp-friend-name">${escHtml(r.name)}</div>
          <div class="fp-friend-status">Wants to be friends</div>
        </div>
        <div class="fp-friend-actions">
          <button class="fp-action-btn accept" data-accept="${r.friendship_id}" data-uid="${r.id}" data-name="${escHtml(r.name)}">✓</button>
          <button class="fp-action-btn reject"  data-decline="${r.friendship_id}">✕</button>
        </div>
      </div>`;
    });
    pane.innerHTML = html;
    pane.querySelectorAll("[data-accept]").forEach(btn => {
      btn.addEventListener("click", () => acceptRequest(btn.dataset.accept, btn.dataset.uid, btn.dataset.name));
    });
    pane.querySelectorAll("[data-decline]").forEach(btn => {
      btn.addEventListener("click", () => declineRequest(btn.dataset.decline));
    });
  }

  // ── Render: Notifs ─────────────────────────────────────────────────────
  function renderNotifs() {
    const pane = document.getElementById("fp-pane-notifs");
    if (!notifs.length) {
      pane.innerHTML = `<div class="fp-empty"><div class="fp-empty-icon">🔔</div>No notifications yet.</div>`;
      return;
    }
    let html = "";
    notifs.slice(0, 30).forEach(n => {
      const { icon, title } = notifMeta(n);
      html += `
      <div class="fp-notif ${n.read ? "" : "unread"}" data-nid="${n.id}" data-type="${n.type}">
        <div class="fp-notif-icon">${icon}</div>
        <div class="fp-notif-text">
          <div class="fp-notif-title">${title}</div>
          <div class="fp-notif-time">${timeAgo(n.created_at)}</div>
        </div>
      </div>`;
    });
    pane.innerHTML = html;
    pane.querySelectorAll(".fp-notif").forEach(el => {
      el.addEventListener("click", () => handleNotifClick(el.dataset.nid, el.dataset.type));
    });
  }

  function notifMeta(n) {
    const d = n.data || {};
    switch (n.type) {
      case "friend_request":  return { icon: "👋", title: `<b>${escHtml(d.from_name)}</b> sent you a friend request` };
      case "friend_accepted": return { icon: "🤝", title: `<b>${escHtml(d.from_name)}</b> accepted your friend request` };
      case "friend_online":   return { icon: "🟢", title: `<b>${escHtml(d.name)}</b> is now online` };
      case "quick_message":   return { icon: "💬", title: `<b>${escHtml(d.from_name)}</b>: ${escHtml(d.message)}` };
      default:                return { icon: "🔔", title: escHtml(n.type) };
    }
  }

  async function handleNotifClick(nid, type) {
    await supabase.from("notifications").update({ read: true }).eq("id", nid);
    const n = notifs.find(x => x.id == nid);
    if (n) n.read = true;
    unreadNotifs = notifs.filter(x => !x.read).length;
    updateBadges();
    renderNotifs();
    if (type === "friend_request") switchTab("requests");
    else switchTab("friends");
  }

  // ── Tabs ───────────────────────────────────────────────────────────────
  function switchTab(tab) {
    document.querySelectorAll(".fp-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    document.querySelectorAll(".fp-pane").forEach(p => p.classList.toggle("active", p.id === `fp-pane-${tab}`));
    if (tab === "notifs") markNotifsRead();
  }

  async function markNotifsRead() {
    const ids = notifs.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    notifs.forEach(n => n.read = true);
    unreadNotifs = 0;
    updateBadges();
  }

  // ── Panel open/close ───────────────────────────────────────────────────
  fab.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.classList.toggle("open", panelOpen);
    if (panelOpen) loadAll();
  });
  document.getElementById("fp-close-btn").addEventListener("click", () => {
    panelOpen = false;
    panel.classList.remove("open");
    closeDmBar();
  });
  document.querySelectorAll(".fp-tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // ── Data loaders ───────────────────────────────────────────────────────
  async function loadAll() {
    await Promise.all([loadFriends(), loadRequests(), loadNotifs()]);
    await loadPresence();
    renderFriends();
    renderRequests();
    renderNotifs();
    updateBadges();
  }

  async function loadFriends() {
    const { data } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${myID},addressee_id.eq.${myID}`);
    if (!data) return;
    const ids = data.map(r => r.requester_id === myID ? r.addressee_id : r.requester_id);
    if (!ids.length) { friends = []; return; }
    const { data: users } = await supabase.from("users").select('user_id,"Name"').in("user_id", ids);
    friends = (users || []).map(u => ({ id: u.user_id, name: u.Name || "User" }));
  }

  async function loadRequests() {
    const { data } = await supabase
      .from("friendships")
      .select("id, requester_id")
      .eq("addressee_id", myID)
      .eq("status", "pending");
    if (!data || !data.length) { pendingIn = []; unreadReqs = 0; return; }
    const ids = data.map(r => r.requester_id);
    const { data: users } = await supabase.from("users").select('user_id,"Name"').in("user_id", ids);
    pendingIn = data.map(r => {
      const u = (users || []).find(x => x.user_id === r.requester_id);
      return { friendship_id: r.id, id: r.requester_id, name: u?.Name || "User" };
    });
    unreadReqs = pendingIn.length;
  }

  async function loadNotifs() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", myID)
      .order("created_at", { ascending: false })
      .limit(30);
    notifs = data || [];
    unreadNotifs = notifs.filter(n => !n.read).length;
  }

  async function loadPresence() {
    const ids = friends.map(f => f.id);
    if (!ids.length) return;
    const { data } = await supabase.from("presence").select("user_id, current_game, last_seen").in("user_id", ids);
    (data || []).forEach(p => { presence[p.user_id] = p; });
  }

  // ── Add friend ─────────────────────────────────────────────────────────
  document.getElementById("fp-add-btn").addEventListener("click", sendFriendRequest);
  document.getElementById("fp-add-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendFriendRequest();
  });

  async function sendFriendRequest() {
    const val = document.getElementById("fp-add-input").value.trim();
    if (!val) return;
    const { data: target } = await supabase
      .from("users").select('user_id,"Name"')
      .ilike('"Name"', val)
      .maybeSingle();
    if (!target) { showToast({ icon: "❌", title: "User not found", body: `No user named "${escHtml(val)}"`, color: "var(--fp-red)" }); return; }
    if (target.user_id === myID) { showToast({ icon: "🤔", title: "That's you!", body: "You can't add yourself.", color: "var(--fp-yellow)" }); return; }
    if (friends.find(f => f.id === target.user_id)) { showToast({ icon: "✅", title: "Already friends", body: `You and ${escHtml(target.Name)} are already friends.`, color: "var(--fp-green)" }); return; }
    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(requester_id.eq.${myID},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${myID})`)
      .maybeSingle();
    if (existing) { showToast({ icon: "⏳", title: "Already pending", body: "A friend request already exists.", color: "var(--fp-yellow)" }); return; }

    await supabase.from("friendships").insert({ requester_id: myID, addressee_id: target.user_id, status: "pending" });
    const { data: me } = await supabase.from("users").select('"Name"').eq("user_id", myID).maybeSingle();
    await supabase.from("notifications").insert({
      user_id: target.user_id,
      type: "friend_request",
      data: { from_id: myID, from_name: me?.Name || "Someone" },
      read: false
    });
    ablyNotify(target.user_id, { type: "friend_request", from_id: myID, from_name: me?.Name || "Someone" });
    document.getElementById("fp-add-input").value = "";
    showToast({ icon: "📨", title: "Request sent!", body: `Sent to ${escHtml(target.Name)}.`, color: "var(--fp-accent)" });
  }

  // ── Accept / Decline / Remove ──────────────────────────────────────────
  async function acceptRequest(friendshipId, requesterId, requesterName) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    const { data: me } = await supabase.from("users").select('"Name"').eq("user_id", myID).maybeSingle();
    await supabase.from("notifications").insert({
      user_id: requesterId,
      type: "friend_accepted",
      data: { from_id: myID, from_name: me?.Name || "Someone" },
      read: false
    });
    ablyNotify(requesterId, { type: "friend_accepted", from_id: myID, from_name: me?.Name || "Someone" });
    await loadAll();
  }

  async function declineRequest(friendshipId) {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await loadAll();
  }

  async function removeFriend(friendId) {
    if (!confirm("Remove this friend?")) return;
    await supabase.from("friendships").delete()
      .or(`and(requester_id.eq.${myID},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${myID})`);
    await loadAll();
  }

  // ── Quick DM ───────────────────────────────────────────────────────────
  function openDmBar(id, name) {
    dmTargetID   = id;
    dmTargetName = name;
    document.getElementById("fp-dm-target-label").textContent = `To: ${name}`;
    document.getElementById("fp-dm-bar").classList.add("visible");
    document.getElementById("fp-dm-input").focus();
  }

  function closeDmBar() {
    dmTargetID = null;
    document.getElementById("fp-dm-bar").classList.remove("visible");
    document.getElementById("fp-dm-input").value = "";
  }

  document.getElementById("fp-dm-send").addEventListener("click", sendQuickMessage);
  document.getElementById("fp-dm-input").addEventListener("keydown", e => {
    if (e.key === "Enter")  sendQuickMessage();
    if (e.key === "Escape") closeDmBar();
  });

  async function sendQuickMessage() {
    const msg = document.getElementById("fp-dm-input").value.trim();
    if (!msg || !dmTargetID) return;
    const { data: me } = await supabase.from("users").select('"Name"').eq("user_id", myID).maybeSingle();
    await supabase.from("notifications").insert({
      user_id: dmTargetID,
      type: "quick_message",
      data: { from_id: myID, from_name: me?.Name || "Someone", message: msg },
      read: false
    });
    ablyNotify(dmTargetID, { type: "quick_message", from_id: myID, from_name: me?.Name || "Someone", message: msg });
    document.getElementById("fp-dm-input").value = "";
    showToast({ icon: "💬", title: "Message sent!", body: `Sent to ${escHtml(dmTargetName)}.`, color: "var(--fp-accent)" });
    closeDmBar();
  }

  // ── Ably ───────────────────────────────────────────────────────────────
  let ablyClient = null;

  function initAbly() {
    ablyClient = new Ably.Realtime({ key: ABLY_KEY, clientId: myID });
    const myChannel = ablyClient.channels.get(`presence:${myID}`);
    myChannel.subscribe(msg => handleAblyMessage(msg.data));
    ablyClient.connection.once("connected", announceOnline);
  }

  function ablyNotify(targetID, payload) {
    ablyClient.channels.get(`presence:${targetID}`).publish("notify", payload);
  }

  async function announceOnline() {
    if (!friends.length) await loadFriends();
    const { data: me } = await supabase.from("users").select('"Name"').eq("user_id", myID).maybeSingle();
    await supabase.from("presence").upsert(
      { user_id: myID, current_game: currentGame, last_seen: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    for (const f of friends) {
      ablyNotify(f.id, { type: "friend_online", from_id: myID, name: me?.Name || "Someone", current_game: currentGame });
    }
  }

  function handleAblyMessage(data) {
    if (!data || !data.type) return;
    const openPanel = (tab) => {
      if (!panelOpen) { panelOpen = true; panel.classList.add("open"); loadAll(); }
      switchTab(tab);
    };
    switch (data.type) {
      case "friend_online":
        presence[data.from_id] = { user_id: data.from_id, current_game: data.current_game || "Online", last_seen: new Date().toISOString() };
        if (panelOpen) renderFriends();
        showToast({ icon: "🟢", title: `${escHtml(data.name)} is online`, body: data.current_game || "Just joined DD Games", color: "var(--fp-green)", onClick: () => openPanel("friends") });
        break;
      case "friend_request":
        loadRequests().then(() => { renderRequests(); updateBadges(); });
        showToast({ icon: "👋", title: "Friend request!", body: `${escHtml(data.from_name)} wants to be friends.`, color: "var(--fp-accent)", onClick: () => openPanel("requests") });
        break;
      case "friend_accepted":
        loadFriends().then(() => loadPresence().then(renderFriends));
        showToast({ icon: "🤝", title: "Friend accepted!", body: `${escHtml(data.from_name)} accepted your request.`, color: "var(--fp-green)", onClick: () => openPanel("friends") });
        break;
      case "quick_message":
        loadNotifs().then(updateBadges);
        showToast({ icon: "💬", title: escHtml(data.from_name), body: escHtml(data.message), color: "var(--fp-accent2)", onClick: () => openPanel("notifs") });
        break;
    }
  }

  // ── Presence heartbeat ─────────────────────────────────────────────────
  setInterval(async () => {
    await supabase.from("presence").upsert(
      { user_id: myID, current_game: currentGame, last_seen: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, 90000);

  // ── Boot ───────────────────────────────────────────────────────────────
  initAbly();
  loadRequests().then(() => loadNotifs().then(updateBadges));
}

// ── Entry point ────────────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}