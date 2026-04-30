/**
 * DD Games — Friends Side Panel & Notification System
 * Injected automatically by management.js on every page.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- PREVENT DOUBLE LOADING ---
if (window.__FP_LOADED) {
  console.warn("Friends Panel: Already loaded, skipping.");
  throw new Error("Friends Panel: Already loaded.");
}
window.__FP_LOADED = true;

const SUPABASE_URL = "https://lqfcntoldutgkzaboqfk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const ABLY_KEY     = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw";
const GUEST_ID     = "00000000-0000-0000-0000-000000000000";

async function init() {
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

  // ── Styles ── 
  // KEY FIX: Use aggressive specificity + all: revert on the panel wrapper
  // to isolate it from host page global button/input styles.
  const style = document.createElement("style");
  style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  /* ── TOAST CONTAINER (outside panel, needs its own scope) ── */
  #fp-toasts {
    position: fixed !important;
    top: 16px !important;
    right: 16px !important;
    z-index: 11000 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    pointer-events: none !important;
    width: 290px !important;
    font-family: 'DM Sans', sans-serif !important;
  }
  .fp-toast {
    all: initial;
    font-family: 'DM Sans', sans-serif;
    background: #0e1525;
    border: 1px solid #1a2540;
    border-radius: 13px;
    padding: 12px 14px 0;
    box-shadow: 0 6px 24px rgba(0,0,0,0.55);
    color: #e4eaf8;
    pointer-events: auto;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    display: block;
    box-sizing: border-box;
    transform: translateX(110%);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
  }
  .fp-toast.in  { transform: translateX(0) !important; opacity: 1 !important; }
  .fp-toast.out { transform: translateX(110%) !important; opacity: 0 !important; transition: transform 0.28s ease, opacity 0.22s ease !important; }
  .fp-toast-top  { display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 4px !important; }
  .fp-toast-icon { font-size: 15px !important; flex-shrink: 0 !important; }
  .fp-toast-title { font-size: 13px !important; font-weight: 600 !important; flex: 1 !important; color: #e4eaf8 !important; }
  .fp-toast-body  { font-size: 12px !important; color: #4a5878 !important; padding-bottom: 11px !important; line-height: 1.4 !important; }
  .fp-toast-bar-track { position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; height: 3px !important; background: rgba(255,255,255,0.07) !important; }
  .fp-toast-bar { height: 100% !important; border-radius: 2px !important; width: 100% !important; display: block !important; }

  /* ── TAB BUTTON ── */
  #fp-tab {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    position: fixed !important;
    left: 0 !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    z-index: 10001 !important;
    background: linear-gradient(180deg, #4f8ef7, #7c6af6) !important;
    color: white !important;
    border: none !important;
    border-radius: 0 10px 10px 0 !important;
    padding: 14px 8px !important;
    cursor: pointer !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 6px !important;
    box-shadow: 3px 0 16px rgba(79,142,247,0.35) !important;
    transition: padding 0.2s, box-shadow 0.2s !important;
    min-width: 0 !important;
    width: auto !important;
    margin: 0 !important;
    border-radius: 0 10px 10px 0 !important;
  }
  #fp-tab:hover {
    padding: 14px 12px !important;
    box-shadow: 4px 0 22px rgba(79,142,247,0.5) !important;
    background: linear-gradient(180deg, #4f8ef7, #7c6af6) !important;
  }
  #fp-tab-icon { font-size: 18px !important; line-height: 1 !important; }
  #fp-tab-badge {
    background: #f75b5b !important;
    color: white !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    min-width: 16px !important;
    height: 16px !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 3px !important;
    opacity: 0 !important;
    transform: scale(0.5) !important;
    transition: opacity 0.2s, transform 0.2s !important;
  }
  #fp-tab-badge.visible { opacity: 1 !important; transform: scale(1) !important; }

  /* ── OVERLAY ── */
  #fp-overlay {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0,0,0,0.45) !important;
    z-index: 10002 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 0.3s ease !important;
    display: block !important;
  }
  #fp-overlay.open { opacity: 1 !important; pointer-events: auto !important; }

  /* ── SIDE PANEL — core isolation ── */
  #fp-panel {
    all: initial;
    font-family: 'DM Sans', sans-serif;
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 300px !important;
    background: #080d1a !important;
    border-right: 1px solid #1a2540 !important;
    box-shadow: 0 0 40px rgba(0,0,0,0.7) !important;
    z-index: 10003 !important;
    display: flex !important;
    flex-direction: column !important;
    color: #e4eaf8 !important;
    transform: translateX(-100%) !important;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  #fp-panel.open { transform: translateX(0) !important; }

  /* Reset ALL children of fp-panel */
  #fp-panel * {
    box-sizing: border-box !important;
    font-family: 'DM Sans', sans-serif !important;
  }

  /* ── HEADER ── */
  #fp-header {
    display: flex !important;
    align-items: center !important;
    padding: 16px 14px 12px !important;
    border-bottom: 1px solid #1a2540 !important;
    gap: 10px !important;
    flex-shrink: 0 !important;
    background: #0e1525 !important;
    width: 100% !important;
  }
  #fp-header-icon { font-size: 20px !important; }
  #fp-header h3 {
    font-family: 'Syne', sans-serif !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    margin: 0 !important;
    flex: 1 !important;
    letter-spacing: 0.02em !important;
    color: #e4eaf8 !important;
    background: none !important;
    padding: 0 !important;
    border: none !important;
    text-align: left !important;
    text-transform: none !important;
  }
  #fp-close-btn {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    background: transparent !important;
    border: 1px solid #1a2540 !important;
    color: #4a5878 !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 7px !important;
    font-size: 13px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.15s, color 0.15s !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  #fp-close-btn:hover { background: #1a2540 !important; color: #e4eaf8 !important; }

  /* ── TABS ROW ── */
  #fp-tabs {
    display: flex !important;
    border-bottom: 1px solid #1a2540 !important;
    flex-shrink: 0 !important;
    background: #080d1a !important;
    width: 100% !important;
  }
  .fp-tab-btn {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    flex: 1 !important;
    padding: 10px 0 !important;
    text-align: center !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #4a5878 !important;
    background: none !important;
    border: none !important;
    border-bottom: 2px solid transparent !important;
    cursor: pointer !important;
    transition: color 0.15s, border-color 0.15s !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  .fp-tab-btn.active { color: #4f8ef7 !important; border-bottom-color: #4f8ef7 !important; }
  .fp-tab-btn:hover:not(.active) { color: #e4eaf8 !important; }
  .fp-tab-count {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: #f75b5b !important;
    color: white !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    min-width: 15px !important;
    height: 15px !important;
    border-radius: 8px !important;
    padding: 0 3px !important;
    margin-left: 4px !important;
    vertical-align: middle !important;
    opacity: 0 !important;
    transform: scale(0.5) !important;
    transition: opacity 0.2s, transform 0.2s !important;
  }
  .fp-tab-count.visible { opacity: 1 !important; transform: scale(1) !important; }

  /* ── BODY + PANES ── */
  #fp-body {
    flex: 1 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    scrollbar-width: thin !important;
    scrollbar-color: #1a2540 transparent !important;
    background: #080d1a !important;
    display: block !important;
  }
  #fp-body::-webkit-scrollbar { width: 4px; }
  #fp-body::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 2px; }

  /* KEY FIX: panes hidden by default, shown when active */
  .fp-pane {
    display: none !important;
  }
  .fp-pane.active {
    display: block !important;
  }

  /* ── SECTION LABEL ── */
  .fp-section-label {
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: 0.1em !important;
    text-transform: uppercase !important;
    color: #4a5878 !important;
    padding: 12px 14px 4px !important;
    display: block !important;
    background: none !important;
    border: none !important;
    margin: 0 !important;
  }

  /* ── FRIEND ROW ── */
  .fp-friend {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 9px 14px !important;
    transition: background 0.15s !important;
    background: transparent !important;
    border: none !important;
    margin: 0 !important;
  }
  .fp-friend:hover { background: #0e1525 !important; }

  .fp-avatar {
    width: 38px !important;
    height: 38px !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: 'Syne', sans-serif !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: white !important;
    flex-shrink: 0 !important;
    position: relative !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .fp-dot {
    position: absolute !important;
    bottom: -2px !important;
    right: -2px !important;
    width: 11px !important;
    height: 11px !important;
    border-radius: 50% !important;
    border: 2px solid #080d1a !important;
  }
  .fp-dot.online  { background: #22d47a !important; }
  .fp-dot.offline { background: #4a5878 !important; }

  .fp-friend-info {
    flex: 1 !important;
    min-width: 0 !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .fp-friend-name {
    font-size: 13px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    color: #e4eaf8 !important;
    display: block !important;
    background: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .fp-friend-sub {
    font-size: 11px !important;
    color: #4a5878 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    margin-top: 1px !important;
    display: block !important;
    background: none !important;
    padding: 0 !important;
  }
  .fp-friend-sub.online { color: #22d47a !important; }

  .fp-actions {
    display: flex !important;
    gap: 5px !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* ── ACTION BUTTONS (inside panel) ── */
  .fp-btn {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    background: #0e1525 !important;
    border: 1px solid #1a2540 !important;
    color: #e4eaf8 !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.15s, border-color 0.15s !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  .fp-btn:hover { background: #1a2540 !important; }
  .fp-btn.ok  { border-color: #22d47a !important; color: #22d47a !important; }
  .fp-btn.ok:hover  { background: rgba(34,212,122,0.12) !important; }
  .fp-btn.del { border-color: #f75b5b !important; color: #f75b5b !important; }
  .fp-btn.del:hover { background: rgba(247,91,91,0.12) !important; }

  /* ── NOTIF ROW ── */
  .fp-notif {
    display: flex !important;
    align-items: flex-start !important;
    gap: 10px !important;
    padding: 10px 14px !important;
    cursor: pointer !important;
    transition: background 0.15s !important;
    background: transparent !important;
    border: none !important;
    margin: 0 !important;
  }
  .fp-notif:hover  { background: #0e1525 !important; }
  .fp-notif.unread { background: rgba(79,142,247,0.07) !important; }
  .fp-notif-icon   { font-size: 18px !important; flex-shrink: 0 !important; padding-top: 1px !important; }
  .fp-notif-body   { flex: 1 !important; min-width: 0 !important; }
  .fp-notif-title  { font-size: 13px !important; font-weight: 500 !important; line-height: 1.35 !important; color: #e4eaf8 !important; display: block !important; margin: 0 !important; }
  .fp-notif-title b { color: #e4eaf8 !important; font-weight: 700 !important; }
  .fp-notif-time   { font-size: 11px !important; color: #4a5878 !important; margin-top: 2px !important; display: block !important; }

  /* ── EMPTY STATE ── */
  .fp-empty {
    text-align: center !important;
    color: #4a5878 !important;
    font-size: 13px !important;
    padding: 36px 20px !important;
    display: block !important;
    background: none !important;
    border: none !important;
    margin: 0 !important;
  }
  .fp-empty-icon { font-size: 32px !important; margin-bottom: 10px !important; display: block !important; }

  /* ── ADD FRIEND BAR ── */
  #fp-add-bar {
    display: flex !important;
    gap: 8px !important;
    padding: 12px 14px !important;
    border-top: 1px solid #1a2540 !important;
    flex-shrink: 0 !important;
    background: #0e1525 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  #fp-add-input {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    flex: 1 !important;
    background: #080d1a !important;
    border: 1px solid #1a2540 !important;
    color: #e4eaf8 !important;
    padding: 8px 11px !important;
    border-radius: 9px !important;
    font-size: 13px !important;
    outline: none !important;
    transition: border-color 0.15s !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    display: block !important;
  }
  #fp-add-input:focus { border-color: #4f8ef7 !important; }
  #fp-add-input::placeholder { color: #4a5878 !important; }
  #fp-add-btn {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    background: linear-gradient(135deg, #4f8ef7, #7c6af6) !important;
    border: none !important;
    color: white !important;
    padding: 8px 13px !important;
    border-radius: 9px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    white-space: nowrap !important;
    transition: opacity 0.15s !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  #fp-add-btn:hover { opacity: 0.85 !important; }

  /* ── QUICK DM BAR ── */
  #fp-dm-bar {
    display: none !important;
    flex-wrap: wrap !important;
    gap: 7px !important;
    padding: 8px 14px !important;
    border-top: 1px solid #1a2540 !important;
    flex-shrink: 0 !important;
    background: #080d1a !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  #fp-dm-bar.visible { display: flex !important; }
  #fp-dm-label {
    font-size: 11px !important;
    color: #4a5878 !important;
    flex-basis: 100% !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    background: none !important;
    border: none !important;
  }
  #fp-dm-input {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    flex: 1 !important;
    background: #0e1525 !important;
    border: 1px solid #1a2540 !important;
    color: #e4eaf8 !important;
    padding: 7px 10px !important;
    border-radius: 9px !important;
    font-size: 13px !important;
    outline: none !important;
    transition: border-color 0.15s !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    display: block !important;
  }
  #fp-dm-input:focus { border-color: #4f8ef7 !important; }
  #fp-dm-input::placeholder { color: #4a5878 !important; }
  #fp-dm-send {
    all: initial !important;
    font-family: 'DM Sans', sans-serif !important;
    background: #4f8ef7 !important;
    border: none !important;
    color: white !important;
    padding: 7px 12px !important;
    border-radius: 9px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: opacity 0.15s !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  #fp-dm-send:hover { opacity: 0.85 !important; }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────
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
        <button class="fp-tab-btn active" data-tab="friends">Friends</button>
        <button class="fp-tab-btn" data-tab="requests">Requests<span class="fp-tab-count" id="fp-req-count"></span></button>
        <button class="fp-tab-btn" data-tab="notifs">Notifs<span class="fp-tab-count" id="fp-notif-count"></span></button>
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

  // ── State ─────────────────────────────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Badges ────────────────────────────────────────────────────────────────
  function updateBadges() {
    const total = unreadNotifs + unreadReqs;
    tabBadge.textContent = total > 9 ? "9+" : total;
    tabBadge.classList.toggle("visible", total > 0);
    reqCount.textContent = unreadReqs;
    reqCount.classList.toggle("visible", unreadReqs > 0);
    notifCount.textContent = unreadNotifs;
    notifCount.classList.toggle("visible", unreadNotifs > 0);
  }

  // ── Panel open / close ────────────────────────────────────────────────────
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

  // ── Tabs ──────────────────────────────────────────────────────────────────
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

  // ── Load all ──────────────────────────────────────────────────────────────
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

  // ── Render: Friends ───────────────────────────────────────────────────────
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

  // ── Render: Requests ──────────────────────────────────────────────────────
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

  // ── Render: Notifs ────────────────────────────────────────────────────────
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

  // ── Friend actions ────────────────────────────────────────────────────────
  document.getElementById("fp-add-btn").addEventListener("click", sendRequest);
  document.getElementById("fp-add-input").addEventListener("keydown", e => { if (e.key === "Enter") sendRequest(); });

  async function sendRequest() {
    const val = document.getElementById("fp-add-input").value.trim();
    if (!val) return;

    const { data: target, error } = await supabase
      .from("users")
      .select("user_id, Name")
      .ilike("Name", val)
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ icon: "⚠️", title: "Error", body: "Could not connect to database.", color: "#f7c94f" });
      return;
    }
    if (!target) {
      toast({ icon: "❌", title: "User not found", body: `No user named "${esc(val)}"`, color: "#f75b5b" });
      return;
    }
    if (target.user_id === myID) {
      toast({ icon: "🤔", title: "That's you!", body: "You can't add yourself.", color: "#f7c94f" });
      return;
    }
    if (friends.find(f => f.id === target.user_id)) {
      toast({ icon: "✅", title: "Already friends", color: "#22d47a" });
      return;
    }

    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(requester_id.eq.${myID},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${myID})`)
      .maybeSingle();
    if (existing) {
      toast({ icon: "⏳", title: "Already pending", color: "#f7c94f" });
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
    toast({ icon: "📨", title: "Request sent!", body: `Sent to ${esc(target.Name)}.`, color: "#4f8ef7" });
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

  // ── Quick DM ──────────────────────────────────────────────────────────────
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
    toast({ icon: "💬", title: "Sent!", body: `Message sent to ${esc(dmTargetName)}.`, color: "#4f8ef7" });
    closeDm();
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast({ icon = "🔔", title, body = "", onClick, color = "#4f8ef7" }) {
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

  // ── Ably ───────────────────────────────────────────────────────────────────
  function initAbly() {
    if (typeof Ably === "undefined") return;
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
    loadNotifs().then(() => {
      renderNotifs();
      updateBadges();
    });
    if (data.type === "friend_request" || data.type === "friend_accepted" || data.type === "quick_message") {
      toast(nMeta({ type: data.type, data: data }));
      if (data.type === "friend_request")  loadRequests().then(renderRequests);
      if (data.type === "friend_accepted") loadFriends().then(renderFriends);
    } else if (data.type === "friend_online") {
      presence[data.from_id] = { user_id: data.from_id, current_game: data.current_game, last_seen: new Date().toISOString() };
      if (panelOpen) renderFriends();
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  initAbly();
  updateBadges();
}

// Boot
init();