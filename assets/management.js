import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIUM_PAGE_URL = "/dd-games/assets/premium-info.html";
const GUEST_ID = "00000000-0000-0000-0000-000000000000";

function getOrCreateDeviceID() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

function getDeviceInfo() {
  return {
    browser: navigator.userAgent,
    os: navigator.platform,
    device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    page: location.pathname
  };
}

function pageIsPremium() {
  return document.body.dataset.premium === "true";
}

// ── Friends panel loader ──────────────────────────────────────────────────────
// Only attempt to load the friends panel when we are the top-level browsing
// context. Game pages run management.js inside iframes; importing friends-panel
// from there throws "Stopped execution in sub-frame" intentionally, but it
// polluted the console with a red error. We now skip the import entirely when
// we are not the top frame, so the error never occurs.
function loadFriendsPanel() {
  // Guard 1: must be top-level window
  if (window !== window.top) return;

  // Guard 2: already loaded in this window — don't import twice
  if (window.__FP_LOADED) return;

  import("/dd-games/assets/friends-panel.js").catch(e => {
    // "Already loaded" and "Stopped execution in sub-frame" are expected
    // control-flow throws from friends-panel.js, not real errors.
    // Swallow them silently; surface anything else as a warning.
    const msg = e?.message || "";
    if (
      msg.includes("Already loaded") ||
      msg.includes("sub-frame")
    ) return;
    console.warn("Friends panel failed to load:", e);
  });
}

async function init() {
  const deviceID = getOrCreateDeviceID();
  const info = getDeviceInfo();

  // ── Guest mode ──────────────────────────────────────────────────────────
  if (deviceID === GUEST_ID) {
    if (pageIsPremium()) {
      window.location.href = PREMIUM_PAGE_URL;
    }
    return; // guests skip everything below
  }

  // ── IP ──────────────────────────────────────────────────────────────────
  let ip = "";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    ip = (await ipRes.json()).ip;
  } catch (e) {
    console.warn("IP fetch failed:", e);
  }

  // ── Lookup user ─────────────────────────────────────────────────────────
  const { data: existingUser, error: lookupError } = await supabase
    .from("users").select("*")
    .eq("user_id", deviceID).maybeSingle();

  if (lookupError) console.error("Lookup error:", lookupError);

  // ── New user ─────────────────────────────────────────────────────────────
  if (!existingUser) {
    await supabase.from("users").insert({
      user_id: deviceID,
      ip,
      browser: info.browser,
      os: info.os,
      device: info.device,
      page: info.page,
      last_seen: new Date(),
      visit_count: 1,
      blocked: false,
      Name: "",
      Playtime: 0,
      Access: true,
      premium: true
    });

  } else {

    // ── Blocked check ───────────────────────────────────────────────────
    if (existingUser.blocked) {
      document.body.innerHTML = "<h1>You have been blocked for breaking DD Games' TOS.</h1>";
      return;
    }

    // ── Premium page check ──────────────────────────────────────────────
    if (pageIsPremium() && existingUser.premium !== true) {
      window.location.href = PREMIUM_PAGE_URL;
      return;
    }

    // ── Name check — redirect to setup if missing ───────────────────────
    if (!existingUser.Name || existingUser.Name.trim() === "") {
      if (!location.pathname.endsWith("main.html")) {
        window.location.href = "/dd-games/main.html";
        return;
      }
    }

    // ── Update visit info ───────────────────────────────────────────────
    await supabase.from("users").update({
      ip,
      browser: info.browser,
      os: info.os,
      device: info.device,
      page: info.page,
      last_seen: new Date(),
      visit_count: (existingUser.visit_count || 0) + 1
    }).eq("user_id", deviceID);
  }

  // ── Playtime timer (every minute) ────────────────────────────────────────
  setInterval(async () => {
    const { data, error } = await supabase
      .from("users")
      .select('"Playtime", blocked, premium')
      .eq("user_id", deviceID).maybeSingle();

    if (error) { console.error("Playtime fetch error:", error); return; }
    if (!data)  return;

    if (data.blocked) {
      document.body.innerHTML = "<h1>You have been blocked for breaking DD Games' TOS.</h1>";
      return;
    }

    if (pageIsPremium() && data.premium !== true) {
      window.location.href = PREMIUM_PAGE_URL;
      return;
    }

    await supabase.from("users").update({
      Playtime: (data["Playtime"] || 0) + 1,
      last_seen: new Date()
    }).eq("user_id", deviceID);

  }, 60000);

  // ── Friends panel ─────────────────────────────────────────────────────────
  // Ably must be present on the page for the friends panel to work.
  // If the current page already loaded Ably (via its own <script> tag),
  // we import immediately. Otherwise we inject Ably first, then import.
  if (window !== window.top) {
    // We are inside an iframe (e.g. a game iframe) — skip entirely.
    return;
  }

  if (typeof Ably !== "undefined") {
    loadFriendsPanel();
  } else {
    const ablyScript = document.createElement("script");
    ablyScript.src = "https://cdn.ably.io/lib/ably.min-1.js";
    ablyScript.onload  = loadFriendsPanel;
    ablyScript.onerror = () => console.warn("Ably failed to load, friends panel skipped.");
    document.head.appendChild(ablyScript);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}