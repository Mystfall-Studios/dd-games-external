import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIUM_PAGE_URL = "/dd-games/assets/premium-info.html";
const GUEST_ID = "00000000-0000-0000-0000-000000000000";
// ── Version check (hard refresh on update) ──────────────────
async function checkVersion() {
  try {
    const res = await fetch("/dd-games/version.json?_=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return;
    const { version } = await res.json();
    const stored = localStorage.getItem("dd_version");

    if (stored && stored !== version) {
      // Version changed, wipe caches and hard reload
      localStorage.setItem("dd_version", version);
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      location.reload(true);
      return;
    }

    // First visit or same version — just store it
    localStorage.setItem("dd_version", version);
  } catch (e) {
    console.warn("Version check failed:", e);
  }
}

// Run before anything else
await checkVersion();
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

// Always returns a clean UTC ISO string for Supabase timestamptz columns
function nowISO() {
  return new Date().toISOString();
}

async function init() {
  const deviceID = getOrCreateDeviceID();
  const info = getDeviceInfo();

  // ── Guest mode ─────────────────────────────────────────
  if (deviceID === GUEST_ID) {
    if (pageIsPremium()) {
      window.location.href = PREMIUM_PAGE_URL;
    }
    return; // guests skip everything below, no throw
  }

  // ── IP ─────────────────────────────────────────────────
  let ip = "";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    ip = (await ipRes.json()).ip;
  } catch (e) {
    console.warn("IP fetch failed:", e);
  }

  // ── Lookup user ────────────────────────────────────────
  const { data: existingUser, error: lookupError } = await supabase
    .from("users").select("*")
    .eq("user_id", deviceID).maybeSingle();

  if (lookupError) console.error("Lookup error:", lookupError);

  // ── New user ───────────────────────────────────────────
  if (!existingUser) {
    await supabase.from("users").insert({
      user_id: deviceID,
      ip,
      browser: info.browser,
      os: info.os,
      device: info.device,
      page: info.page,
      last_seen: nowISO(),
      visit_count: 1,
      blocked: false,
      Name: "",
      Playtime: 0,
      Access: true,
      premium: true
    });

  } else {

    // ── Blocked check ────────────────────────────────────
    if (existingUser.blocked) {
      document.body.innerHTML = "<h1>You have been blocked for breaking DD Games' TOS.</h1>";
      return;
    }

    // ── Premium page check ───────────────────────────────
    if (pageIsPremium() && existingUser.premium !== true) {
      window.location.href = PREMIUM_PAGE_URL;
      return;
    }

    // ── Name check — redirect to setup if missing ────────
    if (!existingUser.Name || existingUser.Name.trim() === "") {
      if (!location.pathname.endsWith("main.html")) {
        window.location.href = "/dd-games/main.html";
        return;
      }
    }

    // ── Update visit info ────────────────────────────────
    await supabase.from("users").update({
      ip,
      browser: info.browser,
      os: info.os,
      device: info.device,
      page: info.page,
      last_seen: nowISO(),
      visit_count: (existingUser.visit_count || 0) + 1
    }).eq("user_id", deviceID);
  }

  // ── Playtime timer (every minute) ──────────────────────
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
      last_seen: nowISO()
    }).eq("user_id", deviceID);

  }, 60000);

  // ── Friends panel (inject on every page) ───────────────
  function loadFriendsPanel() {
    import("/dd-games/assets/friends-panel.js").catch(e => {
      console.warn("Friends panel failed to load:", e);
    });
  }

  if (typeof Ably !== "undefined") {
    loadFriendsPanel();
  } else {
    const ablyScript = document.createElement("script");
    ablyScript.src = "https://cdn.ably.io/lib/ably.min-1.js";
    ablyScript.onload = loadFriendsPanel;
    ablyScript.onerror = () => console.warn("Ably failed to load, friends panel skipped.");
    document.head.appendChild(ablyScript);
  }
}

// ── Entry point ─────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}