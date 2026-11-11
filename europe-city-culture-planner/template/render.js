/* europe-city-culture-planner 城市行程页渲染器 v2 · city itinerary page renderer
 * 读取 <script type="application/json" id="trip-data"> 的 JSON，渲染成行程页：
 * 行程总图 + 总时间线、每天的路线图、展览、演出、影视书、free walking tour 等。
 * 双语：任何文本字段都可以写成 {"zh": "…", "en": "…"}，页面右上角可切换中文 / English。
 * 标了「html」的字段只保留 <b> <i> <a> <br> 等行内标签，其余按纯文本处理。
 */
(function () {
  "use strict";
  var app = document.getElementById("app") || document.body.appendChild(document.createElement("div"));

  var DICT = {
    zh: {
      version: function (n) { return "第 " + n + " 版"; },
      daysPlanned: function (n) { return "排了 " + n + " 天"; },
      heading: function (c) { return c + " 文艺行程"; },
      cityCountry: function (c, k) { return c + (k ? "，" + k : ""); },
      verdict: "这次最值得的", bookAhead: "需要提前预订",
      st_urgent: "马上订", st_soon: "尽快订", st_ok: "到时再订", st_done: "已订",
      overview: "行程总图和时间线",
      overviewNote: "编号是「第几天-第几站」，同一天的点用同色虚线按时间连起来。示意位置图，不是精确地理底图。",
      dayN: function (n) { return "第 " + n + " 天"; },
      days: "每天的安排", backup: "下雨 / 关门的备选：",
      exhibitions: "这几天在展", until: function (s) { return "展到 " + s; },
      events: "这几天的活动",
      shows: "这几天的大型演出和脱口秀",
      k_concert: "演唱会", k_comedy: "脱口秀", k_theatre: "剧场 / 歌剧", k_festival: "音乐节", k_other: "演出",
      s_onsale: "在售", s_few: "余票少", s_soldout: "已售罄", s_resale: "只有转售票", s_soon: "即将开售",
      media: "出发前可以看的电影、书和纪录片",
      m_film: "电影", m_doc: "纪录片", m_series: "剧集", m_book: "书", m_podcast: "播客", m_other: "其他",
      tours: "高分 free walking tour", thTour: "导览", thRating: "评分（人数）", thWhen: "时间", thWhy: "为什么选",
      pool: "没排进去，但也合你口味",
      beyond: "1 小时圈外，但太有名不能漏",
      skipped: "有意没排的热门景点",
      queried: function (s) { return "查询时间：" + s + "。开放时间、票价和展期以官网为准，出发前再核对一次。"; },
      mapFail: "地图渲染失败：",
      c_market: "菜市场", c_arch: "建筑", c_art: "现当代艺术", c_artclassic: "古典艺术", c_alt: "另类街区",
      c_view: "登高望远", c_ride: "交通体验", c_tour: "城市导览", c_history: "沉重历史", c_nature: "自然 / 海岛",
      c_event: "活动", c_food: "吃", c_other: "其他",
      print: "导出 / 打印 PDF",
      noData: function (id) { return "页面里没有找到 id=\"" + id + "\" 的 JSON。"; },
      renderFail: "行程页渲染失败："
    },
    en: {
      version: function (n) { return "v" + n; },
      daysPlanned: function (n) { return n + (n === 1 ? " day planned" : " days planned"); },
      heading: function (c) { return c + ": a culture-first itinerary"; },
      cityCountry: function (c, k) { return c + (k ? ", " + k : ""); },
      verdict: "Highlights of this trip", bookAhead: "Book ahead",
      st_urgent: "Book now", st_soon: "Book soon", st_ok: "Book later", st_done: "Booked",
      overview: "Trip map and timeline",
      overviewNote: "Numbers are day-stop. Each day's stops are joined in time order by a dashed line in that day's colour. Schematic map, not to geographic detail.",
      dayN: function (n) { return "Day " + n; },
      days: "Day by day", backup: "If it rains or something is closed: ",
      exhibitions: "On show while you're there", until: function (s) { return "until " + s; },
      events: "Events while you're there",
      shows: "Big concerts and stand-up comedy",
      k_concert: "Concert", k_comedy: "Stand-up", k_theatre: "Theatre / opera", k_festival: "Festival", k_other: "Show",
      s_onsale: "On sale", s_few: "Few left", s_soldout: "Sold out", s_resale: "Resale only", s_soon: "On sale soon",
      media: "Films, books and documentaries before you go",
      m_film: "Films", m_doc: "Documentaries", m_series: "Series", m_book: "Books", m_podcast: "Podcasts", m_other: "Other",
      tours: "Top-rated free walking tours", thTour: "Tour", thRating: "Rating (reviews)", thWhen: "When", thWhy: "Why this one",
      pool: "Didn't fit, but your kind of thing",
      beyond: "Beyond the 1-hour radius, but too famous to skip",
      skipped: "Popular sights deliberately left out",
      queried: function (s) { return "Checked " + s + ". Opening hours, prices and exhibition dates can change; check the official sites again before you go."; },
      mapFail: "Could not draw the map: ",
      c_market: "Market", c_arch: "Architecture", c_art: "Modern & contemporary art", c_artclassic: "Classical art", c_alt: "Alternative scene",
      c_view: "Viewpoint", c_ride: "Ride", c_tour: "Walking tour", c_history: "Difficult history", c_nature: "Nature / islands",
      c_event: "Event", c_food: "Food", c_other: "Other",
      print: "Print / save as PDF",
      noData: function (id) { return "No JSON with id=\"" + id + "\" found on the page."; },
      renderFail: "Could not render the itinerary page: "
    }
  };

  /* ---- 共用：双语、HTML 白名单、链接校验 · shared: i18n, HTML allowlist, URL check ---- */
  var LANG_KEY = "travel-skill-lang";
  var CUR = /^zh/i.test((navigator.language || "")) ? "zh" : "en";
  function t(k) {
    var s = DICT[CUR][k];
    if (s == null) s = DICT.zh[k];
    return typeof s === "function" ? s.apply(null, Array.prototype.slice.call(arguments, 1)) : s;
  }
  // 本地化字段：任何字符串（或数组）都可以写成 {"zh": "…", "en": "…"}；缺一种语言时退回另一种
  function isLoc(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    var k = Object.keys(v);
    return k.length > 0 && k.every(function (x) { return x === "zh" || x === "en"; });
  }
  function localize(v, lang) {
    if (isLoc(v)) {
      var pick = v[lang];
      if (pick == null || pick === "") pick = v[lang === "zh" ? "en" : "zh"];
      return localize(pick, lang);
    }
    if (Array.isArray(v)) return v.map(function (x) { return localize(x, lang); });
    if (v && typeof v === "object") {
      var o = {};
      Object.keys(v).forEach(function (k) { o[k] = localize(v[k], lang); });
      return o;
    }
    return v;
  }
  function scanLangs(v, acc) {
    if (isLoc(v)) Object.keys(v).forEach(function (k) { if (v[k] != null && v[k] !== "") acc[k] = 1; });
    if (v && typeof v === "object") Object.keys(v).forEach(function (k) { scanLangs(v[k], acc); });
    return acc;
  }
  function availableLangs(raw) {
    var langs = (Array.isArray(raw.languages) ? raw.languages : []).filter(function (l) { return l === "zh" || l === "en"; });
    if (!langs.length) langs = Object.keys(scanLangs(raw, {})).sort().reverse(); // zh 在前
    if (!langs.length) langs = [raw.lang === "en" ? "en" : "zh"];
    return langs;
  }
  function initialLang(raw, langs) {
    var q = (location.search.match(/[?&]lang=(zh|en)\b/) || [])[1];
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* 隐私模式等 */ }
    var order = [q, saved, raw.lang, CUR, langs[0]];
    for (var i = 0; i < order.length; i++) if (order[i] && langs.indexOf(order[i]) >= 0) return order[i];
    return langs[0];
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    u = String(u == null ? "" : u).trim();
    return /^(https?:|mailto:|#)/i.test(u) ? u : "";
  }
  function a(url, text) {
    var u = safeUrl(url);
    return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(text) + "</a>" : esc(text);
  }
  // 标「html」的字段只保留少量行内标签，链接只允许 http(s) / mailto，其余标签去壳、属性全部去掉
  var KEEP = { B: 1, STRONG: 1, I: 1, EM: 1, A: 1, BR: 1, SMALL: 1, CODE: 1, SPAN: 1 };
  var DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1, NOSCRIPT: 1, SVG: 1, MATH: 1, LINK: 1, META: 1 };
  function clean(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) return;
      if (n.nodeType !== 1 || DROP[n.tagName.toUpperCase()]) { node.removeChild(n); return; }
      clean(n);
      var tag = n.tagName.toUpperCase();
      if (!KEEP[tag]) {
        while (n.firstChild) node.insertBefore(n.firstChild, n);
        node.removeChild(n);
        return;
      }
      var href = tag === "A" ? safeUrl(n.getAttribute("href")) : "";
      Array.prototype.slice.call(n.attributes).forEach(function (at) { n.removeAttribute(at.name); });
      if (href) { n.setAttribute("href", href); n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
    });
  }
  function html(s) {
    if (s == null || s === "") return "";
    s = String(s);
    if (!/[<&]/.test(s)) return s;
    var tpl = document.createElement("template");
    tpl.innerHTML = s;
    clean(tpl.content);
    var box = document.createElement("div");
    box.appendChild(tpl.content);
    return box.innerHTML;
  }
  function toolbar(langs) {
    var s = '<div class="toolbar no-print">';
    if (langs.length > 1) {
      s += '<div class="lang-switch" role="group" aria-label="Language / 语言">' + langs.map(function (l) {
        return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === CUR) + '">' + (l === "zh" ? "中文" : "EN") + "</button>";
      }).join("") + "</div>";
    }
    return s + '<button type="button" class="print-btn" data-print>' + esc(t("print")) + "</button></div>";
  }
  // 启动：读 JSON → 选语言 → 渲染；切换语言时保持滚动位置
  function boot(dataId) {
    var raw, langs;
    function draw() {
      document.documentElement.lang = CUR === "zh" ? "zh-CN" : "en";
      var d = localize(raw, CUR);
      render(d, toolbar(langs));
      if (d.title) document.title = d.title;
    }
    try {
      var el = document.getElementById(dataId);
      if (!el) throw new Error(t("noData", dataId));
      raw = JSON.parse(el.textContent);
      langs = availableLangs(raw);
      CUR = initialLang(raw, langs);
      draw();
    } catch (e) {
      app.className = "wrap";
      app.innerHTML = '<div class="render-error">' + esc(t("renderFail")) + esc(e.message) + "</div>";
      return;
    }
    app.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-lang],[data-print]") : null;
      if (!b) return;
      if (b.hasAttribute("data-print")) { window.print(); return; }
      var l = b.getAttribute("data-lang");
      if (!l || l === CUR) return;
      CUR = l;
      try { localStorage.setItem(LANG_KEY, l); } catch (x) { /* ignore */ }
      var y = window.scrollY;
      draw();
      window.scrollTo(0, y);
    });
  }
  /* ---- 共用部分结束 · end of shared part ---- */


  var CAT_KEYS = ["market", "arch", "art", "artclassic", "alt", "view", "ride", "tour", "history", "nature", "event", "food", "other"];
  function isNum(v) { return typeof v === "number" && !isNaN(v); }
  function catKey(c) { return CAT_KEYS.indexOf(c) >= 0 ? c : "other"; }
  function cat(c) {
    var k = catKey(c);
    return '<span class="cat" style="--cat:var(--c-' + k + ')"><i></i>' + esc(t("c_" + k)) + "</span>";
  }
  function list(items) {
    return items && items.length ? "<ul>" + items.map(function (x) { return "<li>" + html(x) + "</li>"; }).join("") + "</ul>" : "";
  }
  function meta(parts) {
    var p = parts.filter(Boolean).map(esc);
    return p.length ? '<span class="meta">' + p.join(" · ") + "</span>" : "";
  }
  var DAY_COLORS = ["var(--d1)", "var(--d2)", "var(--d3)", "var(--d4)", "var(--d5)", "var(--d6)", "var(--d7)"];
  function dayColor(i) { return DAY_COLORS[i % DAY_COLORS.length]; }

  function render(d, bar) {
    var out = [bar];
    var maps = [];
    var days = d.days || [];

    // 页头
    var eyebrow = d.eyebrow || [t("cityCountry", d.city, d.country), d.dateLabel, days.length ? t("daysPlanned", days.length) : "", t("version", d.version || 1)].filter(Boolean).join(" · ");
    out.push('<header><div class="eyebrow">' + esc(eyebrow) + "</div><h1>" + esc(d.heading || t("heading", d.city)) + '</h1><div class="gilt"></div>');
    if (d.intro) out.push('<p class="intro">' + html(d.intro) + "</p>");
    out.push("</header>");

    // 结论
    if (d.verdict) {
      out.push('<div class="panel"><h2>' + esc(t("verdict")) + "</h2>" + list(d.verdict.items));
      (d.verdict.alerts || []).forEach(function (x) { out.push('<p class="alert">' + html(x) + "</p>"); });
      out.push("</div>");
    }

    // 需提前预订（按紧急程度排序）
    if (d.bookAhead && d.bookAhead.length) {
      var order = { urgent: 0, soon: 1, ok: 2, done: 3 };
      var rank = function (s) { return order[s] == null ? 2 : order[s]; };
      var bks = d.bookAhead.slice().sort(function (x, y) { return rank(x.status) - rank(y.status); });
      out.push('<section class="panel book"><h2>' + esc(t("bookAhead")) + "</h2>");
      bks.forEach(function (b) {
        var st = order[b.status] != null ? b.status : "ok";
        out.push('<div class="bk"><span class="st ' + st + '">' + esc(t("st_" + st)) + '</span><div class="body"><b>' + a(b.url, b.name) + "</b>" +
          (b.deadline ? '<span class="dl">' + esc(b.deadline) + "</span>" : "") + (b.why ? '<span class="small">' + html(b.why) + "</span>" : "") + "</div></div>");
      });
      out.push("</section>");
    }

    // 行程总图 + 总时间线
    if (days.length) {
      var all = [];
      days.forEach(function (day, i) {
        (day.stops || []).forEach(function (s, j) {
          if (isNum(s.lat) && isNum(s.lng)) all.push({ lat: s.lat, lng: s.lng, day: i, n: (i + 1) + "-" + (j + 1), label: s.name });
        });
      });
      out.push('<section class="panel"><h2>' + esc(t("overview")) + "</h2>");
      if (all.length) {
        out.push('<div id="map-all" class="mapbox"></div><div class="legend">' + days.map(function (day, i) {
          return '<span class="cat" style="--cat:' + dayColor(i) + '"><i></i>' + esc(t("dayN", i + 1)) + (day.theme ? " · " + esc(day.theme) : "") + "</span>";
        }).join("") + '</div><p class="small muted">' + esc(t("overviewNote")) + "</p>");
        maps.push(["map-all", all, "days"]);
      }
      out.push('<div class="tl">');
      days.forEach(function (day, i) {
        out.push('<div class="tl-day" style="--day:' + dayColor(i) + '"><div class="tl-head"><b>' + esc(t("dayN", i + 1)) + "</b>" + (day.date ? '<span class="small muted">' + esc(day.date) + "</span>" : "") +
          '</div><div class="tl-row">' + (day.stops || []).map(function (s, j) {
            return '<a class="tl-chip" href="#day-' + (i + 1) + '" style="--cat:var(--c-' + catKey(s.cat) + ')"><span class="t">' + esc(s.time || (i + 1) + "-" + (j + 1)) + "</span>" + esc(s.name) + "</a>";
          }).join('<span class="tl-arrow" aria-hidden="true">→</span>') + "</div></div>");
      });
      out.push("</div></section>");
    }

    // 每天
    if (days.length) {
      out.push('<section class="days-wrap"><h2>' + esc(t("days")) + "</h2>");
      if (d.skipNote) out.push('<p class="small muted">' + html(d.skipNote) + "</p>");
      if (days.length > 1) {
        out.push('<nav class="daynav">' + days.map(function (day, i) {
          return '<a href="#day-' + (i + 1) + '">' + esc(t("dayN", i + 1)) + (day.theme ? " · " + esc(day.theme) : "") + "</a>";
        }).join("") + "</nav>");
      }
      days.forEach(function (day, i) {
        out.push('<div class="day" id="day-' + (i + 1) + '" style="--day:' + dayColor(i) + '"><div class="day-head"><span class="d">' + esc([t("dayN", i + 1), day.date].filter(Boolean).join(" · ")) +
          "</span><h3>" + esc(day.theme || "") + "</h3>" + (day.note ? '<p class="small muted">' + html(day.note) + "</p>" : "") + "</div>");
        var pts = [];
        out.push('<div class="stops">');
        (day.stops || []).forEach(function (s, j) {
          var k = catKey(s.cat);
          out.push('<div class="stop' + (k === "ride" ? " ride" : "") + '" style="--cat:var(--c-' + k + ')"><div class="top">' +
            (s.time ? '<span class="t">' + esc(s.time) + "</span>" : "") + '<span class="name">' + a(s.url, s.name) + "</span>" + cat(s.cat) + "</div>" +
            meta([s.area, s.duration, s.hours, s.price]) +
            (s.why ? '<span class="why">' + html(s.why) + "</span>" : "") +
            (s.booking ? '<span class="bk-note">' + html(s.booking) + "</span>" : "") + "</div>");
          if (isNum(s.lat) && isNum(s.lng)) pts.push({ lat: s.lat, lng: s.lng, n: j + 1, cat: k, label: s.name });
        });
        out.push("</div>");
        if (pts.length) { out.push('<div id="map-day-' + (i + 1) + '" class="mapbox"></div>'); maps.push(["map-day-" + (i + 1), pts, true]); }
        if (day.backup) out.push('<p class="backup"><b>' + esc(t("backup")) + "</b>" + html(day.backup) + "</p>");
        out.push("</div>");
      });
      out.push("</section>");
    }

    // 这几天的展览
    if (d.exhibitions && d.exhibitions.length) {
      out.push('<section class="panel"><h2>' + esc(t("exhibitions")) + '</h2><div class="items">');
      d.exhibitions.forEach(function (x) {
        out.push('<div class="it"><span class="name">' + a(x.url, x.title) + (x.match ? '<span class="match">' + esc(x.match) + "</span>" : "") + "</span>" +
          meta([x.venue, x.until ? t("until", x.until) : "", x.price]) + (x.why ? "<span>" + html(x.why) + "</span>" : "") + "</div>");
      });
      out.push("</div></section>");
    }

    // 这几天的活动
    if (d.events && d.events.length) {
      out.push('<section class="panel"><h2>' + esc(t("events")) + '</h2><div class="items">');
      d.events.forEach(function (x) {
        out.push('<div class="it"><span class="name">' + a(x.url, x.name) + " " + cat(x.cat || "event") + "</span>" +
          meta([x.date, x.place, x.price]) + (x.why ? "<span>" + html(x.why) + "</span>" : "") + "</div>");
      });
      out.push("</div></section>");
    }

    // 大型演出、脱口秀（shows 为空但有 showsNote 时也显示，用来说明「这几天没有」）
    if ((d.shows && d.shows.length) || d.showsNote) {
      var SS = { onsale: 1, few: 1, soldout: 1, resale: 1, soon: 1 };
      out.push('<section class="panel"><h2>' + esc(t("shows")) + "</h2>");
      if (d.shows && d.shows.length) {
        out.push('<div class="items">');
        d.shows.forEach(function (x) {
          var kind = { concert: 1, comedy: 1, theatre: 1, festival: 1 }[x.kind] ? x.kind : "other";
          out.push('<div class="it"><span class="name">' + a(x.url, x.name) + '<span class="match">' + esc(t("k_" + kind)) + "</span>" +
            (SS[x.status] ? '<span class="show-st ' + x.status + '">' + esc(t("s_" + x.status)) + "</span>" : "") + "</span>" +
            meta([x.date, x.venue, x.lang, x.price]) + (x.why ? "<span>" + html(x.why) + "</span>" : "") + "</div>");
        });
        out.push("</div>");
      }
      if (d.showsNote) out.push('<p class="small muted">' + html(d.showsNote) + "</p>");
      out.push("</section>");
    }

    // 电影、书、纪录片（按类型分组；原名和译名一样时不重复显示）
    if (d.media && d.media.length) {
      var MK = ["film", "doc", "series", "book", "podcast", "other"];
      out.push('<section class="panel"><h2>' + esc(t("media")) + "</h2>" + (d.mediaNote ? '<p class="small muted">' + html(d.mediaNote) + "</p>" : ""));
      MK.forEach(function (k) {
        var group = d.media.filter(function (x) { return (MK.indexOf(x.kind) >= 0 ? x.kind : "other") === k; });
        if (!group.length) return;
        out.push('<div class="group"><h3>' + esc(t("m_" + k)) + '</h3><div class="items">');
        group.forEach(function (x) {
          var orig = x.original && x.original !== x.title ? '<span class="muted" style="font-weight:400"> · ' + esc(x.original) + "</span>" : "";
          out.push('<div class="it"><span class="name">' + a(x.url, x.title) + orig + (x.tag ? '<span class="match">' + esc(x.tag) + "</span>" : "") + "</span>" +
            meta([x.year, x.creator, x.lang, x.where]) + (x.why ? "<span>" + html(x.why) + "</span>" : "") + "</div>");
        });
        out.push("</div></div>");
      });
      out.push("</section>");
    }

    // free walking tour
    if (d.tours && d.tours.length) {
      out.push('<section><h2 class="sec">' + esc(t("tours")) + '</h2><div class="scroll"><table><thead><tr><th>' + esc(t("thTour")) + "</th><th>" + esc(t("thRating")) +
        "</th><th>" + esc(t("thWhen")) + "</th><th>" + esc(t("thWhy")) + "</th></tr></thead><tbody>");
      d.tours.forEach(function (x) {
        out.push("<tr><td>" + a(x.url, x.name) + (x.platform ? '<br><span class="small muted">' + esc(x.platform) + "</span>" : "") + "</td>" +
          '<td class="rating">' + esc(x.rating || "—") + (x.count ? ' <span class="muted">(' + esc(x.count) + ")</span>" : "") + "</td>" +
          "<td>" + esc([x.schedule, x.duration, x.lang].filter(Boolean).join(" · ") || "—") + "</td><td>" + html(x.why || "") + "</td></tr>");
      });
      out.push("</tbody></table></div>");
      if (d.toursNote) out.push('<p class="small muted" style="margin-top:8px">' + html(d.toursNote) + "</p>");
      out.push("</section>");
    }

    // 备选池
    if (d.pool && d.pool.length) {
      var pp = [];
      out.push('<section class="panel"><h2>' + esc(t("pool")) + '</h2><div class="items">');
      d.pool.forEach(function (x, i) {
        out.push('<div class="it"><span class="name">' + a(x.url, x.name) + " " + cat(x.cat) + "</span>" + meta([x.area, x.hours, x.price]) + (x.why ? "<span>" + html(x.why) + "</span>" : "") + "</div>");
        if (isNum(x.lat) && isNum(x.lng)) pp.push({ lat: x.lat, lng: x.lng, n: i + 1, cat: catKey(x.cat), label: x.name });
      });
      out.push("</div>");
      if (pp.length) { out.push('<div id="map-pool" class="mapbox"></div>'); maps.push(["map-pool", pp, false]); }
      out.push("</section>");
    }

    // 1 小时圈外
    if (d.beyond && d.beyond.length) {
      out.push('<section class="panel"><h2>' + esc(t("beyond")) + '</h2><div class="items">');
      d.beyond.forEach(function (x) {
        out.push('<div class="it"><span class="name">' + a(x.url, x.name) + " " + cat(x.cat) + "</span>" + meta([x.distance]) +
          (x.why ? "<span>" + html(x.why) + "</span>" : "") + (x.booking ? '<span class="small bk-note">' + html(x.booking) + "</span>" : "") + "</div>");
      });
      out.push("</div></section>");
    }

    // 有意跳过
    if (d.skipped && d.skipped.length) {
      out.push('<section class="excluded"><h2>' + esc(t("skipped")) + "</h2>" + d.skipped.map(function (e) {
        return '<div class="ex"><b>' + esc(e.name) + "</b><span>" + html(e.why) + "</span></div>";
      }).join("") + "</section>");
    }

    // 图例
    out.push('<div class="legend">' + CAT_KEYS.filter(function (k) { return k !== "other"; }).map(cat).join("") + "</div>");

    // 页脚
    var f = d.footer || {};
    out.push("<footer><p>" + esc(t("queried", d.queriedAt || "")) + "</p>");
    (f.paragraphs || []).forEach(function (p) { out.push("<p>" + html(p) + "</p>"); });
    if (f.links && f.links.length) {
      out.push("<ul>" + f.links.map(function (row) {
        return "<li>" + (Array.isArray(row) ? row : [row]).map(function (l) { return a(l.url, l.text); }).join(" · ") + "</li>";
      }).join("") + "</ul>");
    }
    out.push("</footer>");

    app.className = "wrap";
    app.innerHTML = out.join("");
    maps.forEach(function (m) { buildMap(m[0], m[1], m[2]); });
  }

  // 自绘示意地图：等距投影、按纬度修正比例，带编号、路线虚线、比例尺、指北针。不联网、不用地图库。
  // path: true = 按顺序连一条线（每天的图）；"days" = 每天一条同色线、点按天着色（总图）；false = 不连线
  function buildMap(id, pts, path) {
    var el = document.getElementById(id);
    if (!el) return;
    try {
      var W = 640, H = 300, PAD = 34;
      var lats = pts.map(function (p) { return p.lat; }), lngs = pts.map(function (p) { return p.lng; });
      var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
      var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
      if (maxLat - minLat < 0.004) { var cl = (minLat + maxLat) / 2; minLat = cl - 0.006; maxLat = cl + 0.006; }
      if (maxLng - minLng < 0.004) { var cg = (minLng + maxLng) / 2; minLng = cg - 0.008; maxLng = cg + 0.008; }
      var cosLat = Math.max(0.15, Math.cos((minLat + maxLat) / 2 * Math.PI / 180));
      var spanX = (maxLng - minLng) * cosLat, spanY = maxLat - minLat;
      var scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
      var offX = PAD + ((W - PAD * 2) - spanX * scale) / 2, offY = PAD + ((H - PAD * 2) - spanY * scale) / 2;
      function P(p) { return [offX + (p.lng - minLng) * cosLat * scale, offY + (maxLat - p.lat) * scale]; }
      var pxPerKm = scale / 111.32;
      var km = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].reduce(function (b, k) { var px = k * pxPerKm; return px >= 40 && px <= 120 ? k : b; }, null) || 1;
      var bar = km * pxPerKm;
      var many = path === "days";
      var s = ['<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" role="img">'];
      for (var gx = 1; gx < 4; gx++) s.push('<line x1="' + W / 4 * gx + '" y1="0" x2="' + W / 4 * gx + '" y2="' + H + '" class="map-grid"/>');
      for (var gy = 1; gy < 3; gy++) s.push('<line x1="0" y1="' + H / 3 * gy + '" x2="' + W + '" y2="' + H / 3 * gy + '" class="map-grid"/>');
      function line(ps, color) {
        if (ps.length < 2) return;
        s.push('<polyline class="map-path"' + (color ? ' style="stroke:' + color + ';opacity:.9"' : "") + ' points="' +
          ps.map(function (p) { return P(p).map(function (v) { return v.toFixed(1); }).join(","); }).join(" ") + '"/>');
      }
      if (many) {
        var byDay = {};
        pts.forEach(function (p) { (byDay[p.day] = byDay[p.day] || []).push(p); });
        Object.keys(byDay).forEach(function (k) { line(byDay[k], dayColor(+k)); });
      } else if (path) line(pts);
      s.push('<g class="map-compass" transform="translate(' + (W - 26) + ',24)"><line x1="0" y1="11" x2="0" y2="-9"/><polygon points="0,-13 -5,-3 5,-3"/><text y="23" text-anchor="middle">N</text></g>');
      s.push('<g class="map-scale"><line x1="' + PAD + '" y1="' + (H - 14) + '" x2="' + (PAD + bar) + '" y2="' + (H - 14) + '"/><text x="' + (PAD + bar / 2) + '" y="' + (H - 20) + '" text-anchor="middle">' + km + " km</text></g>");
      pts.forEach(function (p, i) {
        var xy = P(p), x = xy[0], y = xy[1];
        var anchor = x > W - 100 ? "end" : (x < 100 ? "start" : "middle");
        var fill = many ? dayColor(p.day) : "var(--c-" + p.cat + ")";
        s.push('<g><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (many ? 11 : 9) + '" class="map-dot" style="fill:' + fill + '"><title>' + esc(p.label) + "</title></circle>" +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="middle" class="map-num"' + (many ? ' style="font-size:8.5px"' : "") + ">" + p.n + "</text>" +
          // 总图点多时只在点少的情况下写名字，其余靠悬停和下面的时间线
          (!many || pts.length <= 12 ? '<text x="' + x.toFixed(1) + '" y="' + (y + (i % 2 ? 24 : -15)).toFixed(1) + '" text-anchor="' + anchor + '" class="map-label">' + esc(p.label) + "</text>" : "") + "</g>");
      });
      s.push("</svg>");
      el.innerHTML = s.join("");
    } catch (e) {
      el.outerHTML = '<p class="small muted">' + esc(t("mapFail")) + esc(e.message) + "</p>";
    }
  }

  boot("trip-data");
})();
