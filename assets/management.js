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

// ── Friends panel loader ──────────────────────────────────────────────────
// Called once after we confirm the user is a valid, non-guest, non-blocked user.
// Ensures Ably is present first, then imports friends-panel.js exactly once.
function loadFriendsPanel() {
  // If we're in a sub-frame, delegate up to the top window
  const target = (window !== window.top) ? window.top : window;

  // Already loaded guard on the TARGET window
  if (target.__FP_LOADED) return;

  function doImport() {
    target.__FP_LOADED = true;
    // Import into the top window's context
    const script = target.document.createElement("script");
    script.type = "module";
    const sep = "/dd-games/assets/friends-panel.js".includes('?') ? '&' : '?';
    script.src = `/dd-games/assets/friends-panel.js${sep}v=${Date.now()}`;
    (target.document.head || target.document.documentElement || target.document.body).appendChild(script);
  }

  if (typeof target.Ably !== "undefined") {
    doImport();
  } else {
    const script = target.document.createElement("script");
    script.src = "https://cdn.ably.io/lib/ably.min-1.js";
    script.onload  = doImport;
    script.onerror = () => console.warn("Ably failed to load — friends panel skipped.");
    (target.document.head || target.document.documentElement || target.document.body).appendChild(script);
  }
}

async function init() {
  const deviceID = getOrCreateDeviceID();
  const info = getDeviceInfo();

  // ── Guest mode ──────────────────────────────────────────────────────────
  if (deviceID === GUEST_ID) {
    if (pageIsPremium()) window.location.href = PREMIUM_PAGE_URL;
    // Guests don't get the friends panel
    return;
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
    // New users have no Name yet — redirect to setup, no panel needed
    if (!location.pathname.endsWith("main.html")) {
      window.location.href = "/dd-games/main.html";
    }
    return;
  }

  // ── Blocked check ────────────────────────────────────────────────────────
  if (existingUser.blocked) {
    document.body.innerHTML = "<h1>You have been blocked for breaking DD Games' TOS.</h1>";
    return;
  }

  // ── Premium page check ───────────────────────────────────────────────────
  if (pageIsPremium() && existingUser.premium !== true) {
    window.location.href = PREMIUM_PAGE_URL;
    return;
  }

  // ── Name check ───────────────────────────────────────────────────────────
  if (!existingUser.Name || existingUser.Name.trim() === "") {
    if (!location.pathname.endsWith("main.html")) {
      window.location.href = "/dd-games/main.html";
      return;
    }
  }

  // ── Update visit info ────────────────────────────────────────────────────
  await supabase.from("users").update({
    ip,
    browser: info.browser,
    os: info.os,
    device: info.device,
    page: info.page,
    last_seen: new Date(),
    visit_count: (existingUser.visit_count || 0) + 1
  }).eq("user_id", deviceID);

  // ── Playtime timer (every minute) ────────────────────────────────────────
  setInterval(async () => {
    const { data, error } = await supabase
      .from("users")
      .select('"Playtime", blocked, premium')
      .eq("user_id", deviceID).maybeSingle();

    if (error) { console.error("Playtime fetch error:", error); return; }
    if (!data) return;

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

  // ── Load friends panel ───────────────────────────────────────────────────
  // Only load for users with a set username (fully registered users).
  // main.html handles its own panel load after the user logs in/creates
  // an account, so we skip it here to avoid a race condition where
  // management.js fires before the user has authenticated in main.html.
  if (!location.pathname.endsWith("main.html")) {
    loadFriendsPanel();
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}