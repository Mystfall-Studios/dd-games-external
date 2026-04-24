/**
 * DD Games — Friends Side Panel & Notification System
 * Injected automatically by management.js on every page.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://lqfcntoldutgkzaboqfk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const ABLY_KEY     = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw";
const GUEST_ID     = "00000000-0000-0000-0000-000000000000";

async function init() {
  // Prevent script from initializing multiple times inside hidden iframes
  if (window !== window.top) return;

  const myID = localStorage.getItem("device_id");
  if (!myID || myID === GUEST_ID) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    return "On DD Games";
  }

  const currentGame = detectCurrentGame();

  // ── Styles ──────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

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
    --fp-w:       300px;
    --fp-shadow:  0 0 40px rgba(0,0,0,0.7);
  }

  /* ── CSS RESET FOR PANEL (Prevents host site styles from leaking in) ── */
  #fp-panel, #fp-panel *, #fp-panel *::before, #fp-panel *::after {
    box-sizing: border-box !important;
  }

  #fp-panel button, #fp-panel input {
    min-width: 0 !important; 
    margin: 0;               
  }

  /* ── TAB (the always-visible pull tab on the left edge) ── */
  #fp-tab {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10001;
    background: linear-gradient(180deg, var(--fp-accent), var(--fp-accent2));
    color: white;
    border: none;
    border-radius: 0 10px 10px 0;
    padding: 14px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 3px 0 16px rgba(79,142,247,0.35);
    transition: padding 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  #fp-tab:hover {
    padding: 14px 12px;
    box-shadow: 4px 0 22px rgba(79,142,247,0.5);
  }
  #fp-tab-icon { font-size: 18px; line-height: 1; }
  #fp-tab-badge {
    background: var(--fp-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s, transform 0.2s;
  }
  #fp-tab-badge.visible { opacity: 1; transform: scale(1); }

  /* ── OVERLAY (darkens the rest of the page) ── */
  #fp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 10002;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  #fp-overlay.open { opacity: 1; pointer-events: auto; }

  /* ── SIDE PANEL ── */
  #fp-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--fp-w);
    background: var(--fp-bg);
    border-right: 1px solid var(--fp-border);
    box-shadow: var(--fp-shadow);
    z-index: 10003;
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
    color: var(--fp-text);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-x: hidden; /* Fix for sliding drawer bleed */
  }
  #fp-panel.open { transform: translateX(0); }

  /* header */
  #fp-header {
    display: flex;
    align-items: center;
    padding: 16px 14px 12px;
    border-bottom: 1px solid var(--fp-border);
    gap: 10px;
    flex-shrink: 0;
    background: var(--fp-surface);
  }
  #fp-header-icon { font-size: 20px; }
  #fp-header h3 {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    flex: 1;
    letter-spacing: 0.02em;
  }
  #fp-close-btn {
    background: transparent;
    border: 1px solid var(--fp-border);
    color: var(--fp-muted);
    width: 28px;
    height: 28px;
    border-radius: 7px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  #fp-close-btn:hover { background: var(--fp-border); color: var(--fp-text); }

  /* tabs */
  #fp-tabs {
    display: flex;
    border-bottom: 1px solid var(--fp-border);
    flex-shrink: 0;
  }
  .fp-tab-btn {
    flex: 1;
    padding: 10px 0;
    text-align: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--fp-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    position: relative;
  }
  .fp-tab-btn.active { color: var(--fp-accent); border-bottom-color: var(--fp-accent); }
  .fp-tab-btn:hover:not(.active) { color: var(--fp-text); }
  .fp-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--fp-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 15px;
    height: 15px;
    border-radius: 8px;
    padding: 0 3px;
    margin-left: 4px;
    vertical-align: middle;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s, transform 0.2s;
  }
  .fp-tab-count.visible { opacity: 1; transform: scale(1); }

  /* body */
  #fp-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--fp-border) transparent;
  }
  #fp-body::-webkit-scrollbar { width: 4px; }
  #fp-body::-webkit-scrollbar-thumb { background: var(--fp-border); border-radius: 2px; }

  .fp-pane { display: none; }
  .fp-pane.active { display: block; }

  /* section label */
  .fp-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fp-muted);
    padding: 12px 14px 4px;
  }

  /* friend row */
  .fp-friend {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    transition: background 0.15s;
  }
  .fp-friend:hover { background: var(--fp-surface); }
  .fp-avatar {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    position: relative;
  }
  .fp-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 11px; height: 11px;
    border-radius: 50%;
    border: 2px solid var(--fp-bg);
  }
  .fp-dot.online  { background: var(--fp-green); }
  .fp-dot.offline { background: var(--fp-muted); }
  .fp-friend-info { flex: 1; min-width: 0; }
  .fp-friend-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fp-friend-sub {
    font-size: 11px;
    color: var(--fp-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }
  .fp-friend-sub.online { color: var(--fp-green); }
  .fp-actions { display: flex; gap: 5px; }
  .fp-btn {
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
  .fp-btn:hover { background: var(--fp-border); }
  .fp-btn.ok  { border-color: var(--fp-green); color: var(--fp-green); }
  .fp-btn.ok:hover  { background: rgba(34,212,122,0.12); }
  .fp-btn.del { border-color: var(--fp-red);   color: var(--fp-red);   }
  .fp-btn.del:hover { background: rgba(247,91,91,0.12); }

  /* notif row */
  .fp-notif {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .fp-notif:hover  { background: var(--fp-surface); }
  .fp-notif.unread { background: rgba(79,142,247,0.07); }
  .fp-notif-icon   { font-size: 18px; flex-shrink: 0; padding-top: 1px; }
  .fp-notif-body   { flex: 1; }
  .fp-notif-title  { font-size: 13px; font-weight: 500; line-height: 1.35; }
  .fp-notif-time   { font-size: 11px; color: var(--fp-muted); margin-top: 2px; }

  /* empty state */
  .fp-empty {
    text-align: center;
    color: var(--fp-muted);
    font-size: 13px;
    padding: 36px 20px;
  }
  .fp-empty-icon { font-size: 32px; margin-bottom: 10px; }

  /* add friend bar */
  #fp-add-bar {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid var(--fp-border);
    flex-shrink: 0;
    background: var(--fp-surface);
  }
  #fp-add-input {
    flex: 1;
    background: var(--fp-bg);
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
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  #fp-add-btn:hover { opacity: 0.85; }

  /* quick DM bar */
  #fp-dm-bar {
    display: none;
    flex-wrap: wrap;
    gap: 7px;
    padding: 8px 14px;
    border-top: 1px solid var(--fp-border);
    flex-shrink: 0;
    background: var(--fp-bg);
  }
  #fp-dm-bar.visible { display: flex; }
  #fp-dm-label { font-size: 11px; color: var(--fp-muted); flex-basis: 100%; }
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
    border: none; color: white;
    padding: 7px 12px;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  #fp-dm-send:hover { opacity: 0.85; }

  /* ── TOASTS ── */
  #fp-toasts {
    position: fixed;
    top: 16px; right: 16px;
    z-index: 11000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    width: 290px;
  }
  .fp-toast {
    background: var(--fp-surface);
    border: 1px solid var(--fp-border);
    border-radius: 13px;
    padding: 12px 14px 0;
    box-shadow: 0 6px 24px rgba(0,0,0,0.55);
    font-family: 'DM Sans', sans-serif;
    color: var(--fp-text);
    pointer-events: auto;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    transform: translateX(110%);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
  }
  .fp-toast.in  { transform: translateX(0); opacity: 1; }
  .fp-toast.out { transform: translateX(110%); opacity: 0; transition: transform 0.28s ease, opacity 0.22s ease; }
  .fp-toast-top  { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .fp-toast-icon { font-size: 15px; flex-shrink: 0; }
  .fp-toast-title { font-size: 13px; font-weight: 600; flex: 1; }
  .fp-toast-body  { font-size: 12px; color: var(--fp-muted); padding-bottom: 11px; line-height: 1.4; }
  .fp-toast-bar-track { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.07); }
  .fp-toast-bar { height: 100%; border-radius: 2px; width: 100%; }
  `;
  document.head.appendChild(style);

  // ── HTML ────────────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML("beforeend", `
    <div id="fp-toasts"></div>

    <div id="fp-overlay"></div>

    <button id="fp-tab" title="Friends">
      <span id="fp-tab-icon">👥</span>
      <div id="fp-tab-badge"></div>
    </button>

    <div id="fp-panel">
      <div id="fp-header">
        <span id="fp-header-icon">👥</span>
        <h3>Friends</h3>
        <button id="fp-close-btn" title="Close">✕</button>
      </div>

      <div id="fp-tabs">
        <button class="fp-tab-btn active" data-tab="friends">
          Friends
        </button>
        <button class="fp-tab-btn" data-tab="requests">
          Requests<span class="fp-tab-count" id="fp-req-count"></span>
        </button>
        <button class="fp-tab-btn" data-tab="notifs">
          Notifs<span class="fp-tab-count" id="fp-notif-count"></span>
        </button>
      </div>

      <div id="fp-body">
        <div class="fp-pane active" id="fp-pane-friends">
          <div class="fp-empty"><div class="fp-empty-icon">👥</div>Loading...</div>
        </div>
        <div class="fp-pane" id="fp-pane-requests">
          <div class="fp-empty"><div class="fp-empty-icon">📬</div>No pending requests.</div>
        </div>
        <div class="fp-pane" id="fp-pane-notifs">
          <div class="fp-empty"><div class="fp-empty-icon">🔔</div>No notifications yet.</div>
        </div>
      </div>

      <div id="fp-dm-bar">
        <div id="fp-dm-label"></div>
        <input id="fp-dm-input" placeholder="Quick message…" maxlength="200">
        <button id="fp-dm-send">Send</button>
      </div>

      <div id="fp-add-bar">
        <input id="fp-add-input" placeholder="Add by username…" maxlength="30">
        <button id="fp-add-btn">Add</button>
      </div>
    </div>
  `);

  // ── State ────────────────────────────────────────────────────────────────
  let panelOpen    = false;
  let friends      = [];
  let pendingIn    = [];
  let notifs       = [];
  let presence     = {};
  let dmTargetID   = null;
  let dmTargetName = null;
  let unreadNotifs = 0;
  let unreadReqs   = 0;
  let ablyClient   = null;

  const tabEl      = document.getElementById("fp-tab");
  const tabBadge   = document.getElementById("fp-tab-badge");
  const overlay    = document.getElementById("fp-overlay");
  const panel      = document.getElementById("fp-panel");
  const toastsEl   = document.getElementById("fp-toasts");
  const reqCount   = document.getElementById("fp-req-count");
  const notifCount = document.getElementById("fp-notif-count");

  // ── Helpers ──────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  const GRADS = [
    ["#1d4ed8","#7c3aed"],["#0369a1","#0891b2"],["#7c3aed","#db2777"],
    ["#047857","#0369a1"],["#b45309","#dc2626"],["#6d28d9","#2563eb"],
  ];
  function grad(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
    const [a, b] = GRADS[Math.abs(h) % GRADS.length];
    return `linear-gradient(135deg,${a},${b})`;
  }

  function ago(iso) {
    if (!iso) return "never";
    const d = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (d < 1)  return "just now";
    if (d < 60) return `${d}m ago`;
    if (d < 1440) return `${Math.floor(d/60)}h ago`;
    return `${Math.floor(d/1440)}d ago`;
  }

  function online(uid) {
    const p = presence[uid];
    return p && (Date.now() - new Date(p.last_seen)) < 3 * 60 * 1000;
  }

  // ── Badges ───────────────────────────────────────────────────────────────
  function updateBadges() {
    const total = unreadNotifs + unreadReqs;
    tabBadge.textContent = total > 9 ? "9+" : total;
    tabBadge.classList.toggle("visible", total > 0);
    reqCount.textContent = unreadReqs;
    reqCount.classList.toggle("visible", unreadReqs > 0);
    notifCount.textContent = unreadNotifs;
    notifCount.classList.toggle("visible", unreadNotifs > 0);
  }

  // ── Panel open / close ───────────────────────────────────────────────────
  function openPanel() {
    panelOpen = true;
    panel.classList.add("open");
    overlay.classList.add("open");
    loadAll();
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove("open");
    overlay.classList.remove("open");
    closeDm();
  }

  tabEl.addEventListener("click", openPanel);
  overlay.addEventListener("click", closePanel);
  document.getElementById("fp-close-btn").addEventListener("click", closePanel);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll(".fp-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".fp-pane").forEach(p => p.classList.toggle("active", p.id === `fp-pane-${name}`));
    if (name === "notifs") markNotifsRead();
  }

  document.querySelectorAll(".fp-tab-btn").forEach(b => {
    b.addEventListener("click", () => switchTab(b.dataset.tab));
  });

  async function markNotifsRead() {
    const ids = notifs.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    notifs.forEach(n => n.read = true);
    unreadNotifs = 0;
    updateBadges();
  }

  // ── Load all ─────────────────────────────────────────────────────────────
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
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${myID},addressee_id.eq.${myID}`);
    if (!data || !data.length) { friends = []; return; }
    const ids = data.map(r => r.requester_id === myID ? r.addressee_id : r.requester_id);
    const { data: users } = await supabase.from("users").select('user_id,"Name"').in("user_id", ids);
    friends = (users || []).map(u => ({ id: u.user_id, name: u.Name || "User" }));
  }

  async function loadRequests() {
    const { data } = await supabase
      .from("friendships").select("id, requester_id")
      .eq("addressee_id", myID).eq("status", "pending");
    if (!data || !data.length) { pendingIn = []; unreadReqs = 0; return; }
    const ids = data.map(r => r.requester_id);
    const { data: users } = await supabase.from("users").select('user_id,"Name"').in("user_id", ids);
    pendingIn = data.map(r => {
      const u = (users || []).find(x => x.user_id === r.requester_id);
      return { fid: r.id, id: r.requester_id, name: u?.Name || "User" };
    });
    unreadReqs = pendingIn.length;
  }

  async function loadNotifs() {
    const { data } = await supabase
      .from("notifications").select("*")
      .eq("user_id", myID)
      .order("created_at", { ascending: false })
      .limit(30);
    notifs = data || [];
    unreadNotifs = notifs.filter(n => !n.read).length;
  }

  async function loadPresence() {
    const ids = friends.map(f => f.id);
    if (!ids.length) return;
    const { data } = await supabase.from("presence")
      .select("user_id, current_game, last_seen").in("user_id", ids);
    (data || []).forEach(p => { presence[p.user_id] = p; });
  }

  // ── Render: Friends ──────────────────────────────────────────────────────
  function renderFriends() {
    const pane = document.getElementById("fp-pane-friends");
    if (!friends.length) {
      pane.innerHTML = `<div class="fp-empty"><div class="fp-empty-icon">👥</div>No friends yet.<br>Search for someone below!</div>`;
      return;
    }
    const on  = friends.filter(f =>  online(f.id));
    const off = friends.filter(f => !online(f.id));
    let html = "";
    if (on.length)  html += `<div class="fp-section-label">Online — ${on.length}</div>`  + on.map(f => friendRow(f, true)).join("");
    if (off.length) html += `<div class="fp-section-label">Offline</div>` + off.map(f => friendRow(f, false)).join("");
    pane.innerHTML = html;
    pane.querySelectorAll("[data-msg]").forEach(b => b.addEventListener("click", () => openDm(b.dataset.msg, b.dataset.name)));
    pane.querySelectorAll("[data-rm]").forEach(b  => b.addEventListener("click", () => removeFriend(b.dataset.rm)));
  }

  function friendRow(f, isOnline) {
    const p = presence[f.id] || {};
    const sub = isOnline ? (p.current_game || "Online") : `Last seen ${ago(p.last_seen)}`;
    return `
    <div class="fp-friend">
      <div class="fp-avatar" style="background:${grad(f.id)}">
        ${esc((f.name||"?")[0].toUpperCase())}
        <div class="fp-dot ${isOnline ? "online" : "offline"}"></div>
      </div>
      <div class="fp-friend-info">
        <div class="fp-friend-name">${esc(f.name)}</div>
        <div class="fp-friend-sub ${isOnline ? "online" : ""}">${esc(sub)}</div>
      </div>
      <div class="fp-actions">
        <button class="fp-btn" title="Quick message" data-msg="${f.id}" data-name="${esc(f.name)}">💬</button>
        <button class="fp-btn del" title="Remove" data-rm="${f.id}">✕</button>
      </div>
    </div>`;
  }

  // ── Render: Requests ─────────────────────────────────────────────────────
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
        <div class="fp-avatar" style="background:${grad(r.id)}">
          ${esc((r.name||"?")[0].toUpperCase())}
        </div>
        <div class="fp-friend-info">
          <div class="fp-friend-name">${esc(r.name)}</div>
          <div class="fp-friend-sub">Wants to be friends</div>
        </div>
        <div class="fp-actions">
          <button class="fp-btn ok"  data-accept="${r.fid}" data-uid="${r.id}" data-name="${esc(r.name)}">✓</button>
          <button class="fp-btn del" data-decline="${r.fid}">✕</button>
        </div>
      </div>`;
    });
    pane.innerHTML = html;
    pane.querySelectorAll("[data-accept]").forEach(b  => b.addEventListener("click", () => acceptReq(b.dataset.accept, b.dataset.uid, b.dataset.name)));
    pane.querySelectorAll("[data-decline]").forEach(b => b.addEventListener("click", () => declineReq(b.dataset.decline)));
  }

  // ── Render: Notifs ───────────────────────────────────────────────────────
  function renderNotifs() {
    const pane = document.getElementById("fp-pane-notifs");
    if (!notifs.length) {
      pane.innerHTML = `<div class="fp-empty"><div class="fp-empty-icon">🔔</div>No notifications yet.</div>`;
      return;
    }
    pane.innerHTML = notifs.slice(0, 30).map(n => {
      const { icon, title } = nMeta(n);
      return `
      <div class="fp-notif ${n.read ? "" : "unread"}" data-nid="${n.id}" data-type="${n.type}">
        <div class="fp-notif-icon">${icon}</div>
        <div class="fp-notif-body">
          <div class="fp-notif-title">${title}</div>
          <div class="fp-notif-time">${ago(n.created_at)}</div>
        </div>
      </div>`;
    }).join("");
    pane.querySelectorAll(".fp-notif").forEach(el => {
      el.addEventListener("click", () => handleNotifClick(el.dataset.nid, el.dataset.type));
    });
  }

  function nMeta(n) {
    const d = n.data || {};
    switch (n.type) {
      case "friend_request":  return { icon: "👋", title: `<b>${esc(d.from_name)}</b> sent you a friend request` };
      case "friend_accepted": return { icon: "🤝", title: `<b>${esc(d.from_name)}</b> accepted your friend request` };
      case "friend_online":   return { icon: "🟢", title: `<b>${esc(d.name)}</b> is now online` };
      case "quick_message":   return { icon: "💬", title: `<b>${esc(d.from_name)}</b>: ${esc(d.message)}` };
      default:                return { icon: "🔔", title: esc(n.type) };
    }
  }

  async function handleNotifClick(nid, type) {
    await supabase.from("notifications").update({ read: true }).eq("id", nid);
    const n = notifs.find(x => x.id == nid);
    if (n) n.read = true;
    unreadNotifs = notifs.filter(x => !x.read).length;
    updateBadges();
    renderNotifs();
    switchTab(type === "friend_request" ? "requests" : "friends");
  }

  // ── Friend actions ───────────────────────────────────────────────────────
  document.getElementById("fp-add-btn").addEventListener("click", sendRequest);
  document.getElementById("fp-add-input").addEventListener("keydown", e => { if (e.key === "Enter") sendRequest(); });

  async function sendRequest() {
    const val = document.getElementById("fp-add-input").value.trim();
    if (!val) return;

    // Fixed: limit(1) to avoid multiple rows crashing maybeSingle, eq instead of ilike, error handling
    const { data: target, error } = await supabase
      .from("users")
      .select("user_id, Name")
      .ilike("Name", val)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase Error:", error);
      toast({ icon: "⚠️", title: "Error", body: "Could not connect to database.", color: "var(--fp-yellow)" });
      return;
    }

    if (!target) {
      toast({ icon: "❌", title: "User not found", body: `No user named "${esc(val)}"`, color: "var(--fp-red)" });
      return;
    }
    if (target.user_id === myID) {
      toast({ icon: "🤔", title: "That's you!", body: "You can't add yourself.", color: "var(--fp-yellow)" });
      return;
    }
    if (friends.find(f => f.id === target.user_id)) {
      toast({ icon: "✅", title: "Already friends", color: "var(--fp-green)" });
      return;
    }

    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(requester_id.eq.${myID},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${myID})`)
      .maybeSingle();
    if (existing) {
      toast({ icon: "⏳", title: "Already pending", color: "var(--fp-yellow)" });
      return;
    }

    await supabase.from("friendships").insert({ requester_id: myID, addressee_id: target.user_id, status: "pending" });

    const { data: me } = await supabase.from("users").select("Name").eq("user_id", myID).maybeSingle();
    const myName = me?.Name || "Someone";

    await supabase.from("notifications").insert({
      user_id: target.user_id, type: "friend_request",
      data: { from_id: myID, from_name: myName }, read: false
    });
    ablyNotify(target.user_id, { type: "friend_request", from_id: myID, from_name: myName });

    document.getElementById("fp-add-input").value = "";
    toast({ icon: "📨", title: "Request sent!", body: `Sent to ${esc(target.Name)}.`, color: "var(--fp-accent)" });
  }

  async function acceptReq(fid, uid, name) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", fid);
    const { data: me } = await supabase.from("users").select("Name").eq("user_id", myID).maybeSingle();
    const myName = me?.Name || "Someone";
    await supabase.from("notifications").insert({
      user_id: uid, type: "friend_accepted",
      data: { from_id: myID, from_name: myName }, read: false
    });
    ablyNotify(uid, { type: "friend_accepted", from_id: myID, from_name: myName });
    await loadAll();
  }

  async function declineReq(fid) {
    await supabase.from("friendships").delete().eq("id", fid);
    await loadAll();
  }

  async function removeFriend(friendId) {
    if (!confirm("Remove this friend?")) return;
    await supabase.from("friendships").delete()
      .or(`and(requester_id.eq.${myID},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${myID})`);
    await loadAll();
  }

  // ── Quick DM ─────────────────────────────────────────────────────────────
  function openDm(id, name) {
    dmTargetID = id; dmTargetName = name;
    document.getElementById("fp-dm-label").textContent = `To: ${name}`;
    document.getElementById("fp-dm-bar").classList.add("visible");
    document.getElementById("fp-dm-input").focus();
  }
  function closeDm() {
    dmTargetID = null;
    document.getElementById("fp-dm-bar").classList.remove("visible");
    document.getElementById("fp-dm-input").value = "";
  }

  document.getElementById("fp-dm-send").addEventListener("click", sendDm);
  document.getElementById("fp-dm-input").addEventListener("keydown", e => {
    if (e.key === "Enter")  sendDm();
    if (e.key === "Escape") closeDm();
  });

  async function sendDm() {
    const msg = document.getElementById("fp-dm-input").value.trim();
    if (!msg || !dmTargetID) return;
    const { data: me } = await supabase.from("users").select("Name").eq("user_id", myID).maybeSingle();
    const myName = me?.Name || "Someone";
    await supabase.from("notifications").insert({
      user_id: dmTargetID, type: "quick_message",
      data: { from_id: myID, from_name: myName, message: msg }, read: false
    });
    ablyNotify(dmTargetID, { type: "quick_message", from_id: myID, from_name: myName, message: msg });
    document.getElementById("fp-dm-input").value = "";
    toast({ icon: "💬", title: "Sent!", body: `Message sent to ${esc(dmTargetName)}.`, color: "var(--fp-accent)" });
    closeDm();
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast({ icon = "🔔", title, body = "", onClick, color = "var(--fp-accent)" }) {
    const el = document.createElement("div");
    el.className = "fp-toast";
    el.innerHTML = `
      <div class="fp-toast-top">
        <span class="fp-toast-icon">${icon}</span>
        <span class="fp-toast-title">${title}</span>
      </div>
      ${body ? `<div class="fp-toast-body">${body}</div>` : ""}
      <div class="fp-toast-bar-track">
        <div class="fp-toast-bar" style="background:${color}"></div>
      </div>`;
    toastsEl.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add("in");
      const bar = el.querySelector(".fp-toast-bar");
      setTimeout(() => { bar.style.transition = "width 5s linear"; bar.style.width = "0%"; }, 50);
    });
    const dismiss = () => {
      el.classList.add("out");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    };
    const timer = setTimeout(dismiss, 5300);
    el.onclick = () => { clearTimeout(timer); dismiss(); if (onClick) onClick(); };
  }

  // ── Ably ─────────────────────────────────────────────────────────────────
  function initAbly() {
    if (typeof Ably === 'undefined') return; // Prevents crash if Ably didn't load
    ablyClient = new Ably.Realtime({ key: ABLY_KEY, clientId: myID });
    ablyClient.channels.get(`presence:${myID}`).subscribe(msg => handleAbly(msg.data));
    ablyClient.connection.once("connected", announceOnline);
  }

  function ablyNotify(targetID, payload) {
    if (ablyClient) ablyClient.channels.get(`presence:${targetID}`).publish("notify", payload);
  }

  async function announceOnline() {
    if (!friends.length) await loadFriends();
    const { data: me } = await supabase.from("users").select("Name").eq("user_id", myID).maybeSingle();
    await supabase.from("presence").upsert(
      { user_id: myID, current_game: currentGame, last_seen: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    for (const f of friends) {
      ablyNotify(f.id, { type: "friend_online", from_id: myID, name: me?.Name || "Someone", current_game: currentGame });
    }
  }

  function handleAbly(data) {
    if (!data?.type) return;
    
    // Auto-update UI based on incoming notification
    loadNotifs().then(() => {
        renderNotifs();
        updateBadges();
    });

    if (data.type === "friend_request" || data.type === "friend_accepted" || data.type === "quick_message") {
        toast(nMeta({ type: data.type, data: data }));
        if (data.type === "friend_request") loadRequests().then(renderRequests);
        if (data.type === "friend_accepted") loadFriends().then(renderFriends);
    } else if (data.type === "friend_online") {
        // Optimistically update presence instead of doing a full database fetch
        presence[data.from_id] = { user_id: data.from_id, current_game: data.current_game, last_seen: new Date().toISOString() };
        if (panelOpen) renderFriends();
    }
  }

  // Final initialization calls
  initAbly();
  updateBadges();
}

init();