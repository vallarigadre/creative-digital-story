/* Creative Digital Story: private reader stats. Counts page views, read-throughs and clicks to the shop,
   plus which platform the visit came from. No cookies, nothing that identifies a reader.
   Results show on /admin/. */
(function () {
  try { if (localStorage.getItem("cds_notrack") === "1") return; } catch (e) {}
  if (navigator.webdriver) return;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;

  var path = location.pathname;
  var title = (document.title || "").replace(/\s*\|\s*Creative Digital Story\s*$/, "");

  function host(u) { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch (e) { return ""; } }

  // Where did this visit come from? A utm_source tag wins, then the referring site.
  function platform() {
    var q = new URLSearchParams(location.search);
    var u = (q.get("utm_source") || q.get("ref") || "").toLowerCase();
    var name = function (s) {
      if (/pinterest|^pin\.it|^pin$/.test(s)) return "Pinterest";
      if (/instagram|^ig$|^insta/.test(s)) return "Instagram";
      if (/threads/.test(s)) return "Threads";
      if (/facebook|^fb$|^m\.me|messenger/.test(s)) return "Facebook";
      if (/beacons/.test(s)) return "Beacons";
      if (/newsletter|email|mail/.test(s)) return "Newsletter";
      if (/google/.test(s)) return "Google";
      if (/bing|duckduckgo|yahoo|ecosia|brave|search/.test(s)) return "Other search";
      if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(s)) return "AI search";
      if (/tiktok/.test(s)) return "TikTok";
      if (/youtube|youtu\.be/.test(s)) return "YouTube";
      if (/reddit/.test(s)) return "Reddit";
      if (/^t\.co$|twitter|^x\.com/.test(s)) return "X";
      return "";
    };
    if (u) return name(u) || u.slice(0, 30);
    var h = host(document.referrer);
    if (!h || h === location.hostname) return null;
    return name(h) || h.slice(0, 40);
  }

  var src = null;
  try { src = sessionStorage.getItem("cds_src"); } catch (e) {}
  var found = platform();
  if (found || !src) {
    src = found || "Direct";
    try { sessionStorage.setItem("cds_src", src); } catch (e) {}
  }

  function send(data) {
    data.p = path; data.ti = title; data.s = src;
    var body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/t", body)) return;
    } catch (e) {}
    try { fetch("/api/t", { method: "POST", body: body, keepalive: true }); } catch (e) {}
  }

  function once(key) {
    try {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
    } catch (e) {}
    return true;
  }

  // 1. A view, once per page per visit.
  if (once("cds_v:" + path)) send({ t: "view" });

  // 2. A read: the reader scrolled at least 60% of the way through the story.
  var prose = document.querySelector("article .prose");
  if (prose) {
    var check = function () {
      var r = prose.getBoundingClientRect();
      if (window.innerHeight - r.top >= r.height * 0.6) {
        window.removeEventListener("scroll", check);
        if (once("cds_r:" + path)) send({ t: "read" });
      }
    };
    window.addEventListener("scroll", check, { passive: true });
  }

  // 3. Shop clicks: links to the guides (Beacons) and any Amazon links, and where on the page they were.
  var SHOP = /beacons\.ai|amzn\.to|amazon\.|netlify\.app/i;
  var isShop = function (a) { return a && a.href && SHOP.test(a.hostname) && a.hostname !== location.hostname; };
  var onClick = function (e) {
    if (e.type === "auxclick" && e.button !== 1) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!isShop(a)) return;
    var inStory = !!a.closest(".prose");
    send({ t: "click", h: a.href.slice(0, 300), x: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 120), w: inStory ? "story" : "list" });
  };
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
})();
