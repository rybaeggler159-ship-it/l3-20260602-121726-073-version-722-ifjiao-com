(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !mobileNav) {
      return;
    }
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var lists = Array.prototype.slice.call(document.querySelectorAll("[data-filter-list]"));
    if (!lists.length) {
      return;
    }
    var input = document.querySelector("[data-search-input]");
    var typeSelect = document.querySelector("[data-filter-type]");
    var regionSelect = document.querySelector("[data-filter-region]");
    var yearSelect = document.querySelector("[data-filter-year]");
    var empty = document.querySelector("[data-empty-state]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q");

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function textOf(card) {
      return [
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-type"),
        card.getAttribute("data-year"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-tags"),
        card.textContent
      ].join(" ").toLowerCase();
    }

    function apply() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var typeValue = typeSelect ? typeSelect.value : "";
      var regionValue = regionSelect ? regionSelect.value : "";
      var yearValue = yearSelect ? yearSelect.value : "";
      var visible = 0;

      lists.forEach(function (list) {
        Array.prototype.slice.call(list.querySelectorAll("[data-card]")).forEach(function (card) {
          var matchesQuery = !query || textOf(card).indexOf(query) !== -1;
          var matchesType = !typeValue || card.getAttribute("data-type") === typeValue;
          var matchesRegion = !regionValue || card.getAttribute("data-region") === regionValue;
          var matchesYear = !yearValue || card.getAttribute("data-year") === yearValue;
          var isVisible = matchesQuery && matchesType && matchesRegion && matchesYear;
          card.style.display = isVisible ? "" : "none";
          if (isVisible) {
            visible += 1;
          }
        });
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    [input, typeSelect, regionSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  }

  function setStatus(player, message) {
    var status = player.querySelector(".player-status");
    if (status) {
      status.textContent = message;
    }
  }

  function loadLibrary(done, fail) {
    if (window.Hls) {
      done();
      return;
    }
    var existing = document.querySelector("script[data-hls-loader]");
    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
    script.async = true;
    script.setAttribute("data-hls-loader", "true");
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  }

  function playVideo(player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".player-overlay");
    var url = player.getAttribute("data-video-url");
    if (!video || !url) {
      setStatus(player, "播放服务暂不可用，请稍后再试。");
      return;
    }

    function begin() {
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          setStatus(player, "点击视频画面继续播放。");
        });
      }
    }

    if (overlay) {
      overlay.classList.add("is-hidden");
    }
    setStatus(player, "正在载入高清播放源…");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      if (video.src !== url) {
        video.src = url;
      }
      begin();
      setStatus(player, "");
      return;
    }

    loadLibrary(function () {
      if (!window.Hls || !window.Hls.isSupported()) {
        setStatus(player, "播放服务暂不可用，请稍后再试。");
        return;
      }
      if (player._hlsInstance) {
        player._hlsInstance.destroy();
      }
      var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      player._hlsInstance = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        begin();
        setStatus(player, "");
      });
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (data && data.fatal) {
          setStatus(player, "播放服务暂不可用，请稍后再试。");
        }
      });
    }, function () {
      setStatus(player, "播放服务暂不可用，请稍后再试。");
    });
  }

  function initPlayers() {
    Array.prototype.slice.call(document.querySelectorAll(".watch-player")).forEach(function (player) {
      var overlay = player.querySelector(".player-overlay");
      var video = player.querySelector("video");
      if (overlay) {
        overlay.addEventListener("click", function () {
          playVideo(player);
        });
      }
      if (video) {
        video.addEventListener("play", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
        });
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayers();
  });
}());
