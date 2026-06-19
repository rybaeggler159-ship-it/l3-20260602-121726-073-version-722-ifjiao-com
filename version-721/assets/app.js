const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const loadedScripts = new Map();

function loadScript(src) {
  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }
  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if (existing.dataset.loaded === "true") {
        resolve();
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  loadedScripts.set(src, promise);
  return promise;
}

function setupMenu() {
  const button = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-panel]");
  if (!button || !panel) {
    return;
  }
  button.addEventListener("click", () => {
    panel.classList.toggle("is-open");
    button.textContent = panel.classList.contains("is-open") ? "×" : "☰";
  });
}

function setupHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }
  const slides = selectAll("[data-hero-slide]", hero);
  const dots = selectAll("[data-hero-dot]", hero);
  const prev = hero.querySelector("[data-hero-prev]");
  const next = hero.querySelector("[data-hero-next]");
  let active = 0;
  let timer = null;

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === active);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === active);
    });
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const play = () => {
    stop();
    timer = window.setInterval(() => show(active + 1), 5200);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      show(index);
      play();
    });
  });

  if (prev) {
    prev.addEventListener("click", () => {
      show(active - 1);
      play();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      show(active + 1);
      play();
    });
  }

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", play);
  show(0);
  play();
}

function setupCardFilters() {
  const scopes = selectAll("[data-filter-scope]");
  scopes.forEach((scope) => {
    const wrapper = scope.closest("section") || document;
    const list = wrapper.querySelector("[data-card-list]");
    const cards = selectAll("[data-card]", list || wrapper);
    const searchInput = scope.querySelector("[data-card-search]");
    const typeSelect = scope.querySelector("[data-card-type]");
    const yearSelect = scope.querySelector("[data-card-year]");

    const apply = () => {
      const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();
      const type = typeSelect ? typeSelect.value : "";
      const year = yearSelect ? yearSelect.value : "";
      cards.forEach((card) => {
        const haystack = (card.dataset.search || "").toLowerCase();
        const cardType = card.dataset.type || "";
        const cardYear = parseInt(card.dataset.year || "0", 10);
        const typeMatch = !type || cardType.includes(type);
        const yearMatch = !year || cardYear >= parseInt(year, 10);
        const textMatch = !keyword || haystack.includes(keyword);
        card.classList.toggle("is-hidden", !(typeMatch && yearMatch && textMatch));
      });
    };

    if (searchInput) {
      searchInput.addEventListener("input", apply);
    }
    if (typeSelect) {
      typeSelect.addEventListener("change", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
  });
}

async function setupPlayer() {
  const video = document.getElementById("movie-player");
  const startButton = document.getElementById("player-start");
  if (!video || !startButton) {
    return;
  }
  const stream = startButton.dataset.stream;
  let hlsInstance = null;
  let started = false;

  const begin = async () => {
    if (!stream) {
      return;
    }
    startButton.classList.add("is-hidden");
    if (started) {
      video.play().catch(() => {});
      return;
    }
    started = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      video.play().catch(() => {});
      return;
    }
    await loadScript("./assets/hls-runtime.js");
    const Hls = window.Hls;
    if (Hls && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(stream);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data && data.fatal && hlsInstance) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
          }
        }
      });
      return;
    }
    video.src = stream;
    video.play().catch(() => {});
  };

  startButton.addEventListener("click", begin);
  video.addEventListener("click", () => {
    if (!started || video.paused) {
      begin();
    }
  });
  window.addEventListener("pagehide", () => {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

function cardHtml(item) {
  const tags = item.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `
          <article class="movie-card">
            <a class="poster-link" href="./${item.file}" aria-label="观看${escapeHtml(item.title)}">
              <img src="${item.cover}" alt="${escapeHtml(item.title)}" loading="lazy">
              <span class="poster-shade"></span>
              <span class="play-mark">▶</span>
            </a>
            <div class="movie-card-body">
              <div class="movie-meta-line">
                <span>${escapeHtml(item.year)}</span>
                <span>${escapeHtml(item.region)}</span>
                <span>${escapeHtml(item.type)}</span>
              </div>
              <h3><a href="./${item.file}">${escapeHtml(item.title)}</a></h3>
              <p>${escapeHtml(item.oneLine)}</p>
              <div class="card-tags">${tags}</div>
            </div>
          </article>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function setupSearchPage() {
  const results = document.getElementById("search-results");
  if (!results) {
    return;
  }
  const input = document.querySelector("[data-search-input]");
  const title = document.querySelector("[data-search-title]");
  const summary = document.querySelector("[data-search-summary]");
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  if (input) {
    input.value = query;
  }
  if (!query) {
    results.innerHTML = `<div class="search-empty">输入关键词后可查看匹配影片。</div>`;
    return;
  }
  await loadScript("./assets/search-data.js");
  const keyword = query.toLowerCase();
  const source = window.SEARCH_INDEX || [];
  const matches = source
    .filter((item) => item.search.includes(keyword))
    .slice(0, 120);
  if (title) {
    title.textContent = `“${query}” 的搜索结果`;
  }
  if (summary) {
    summary.textContent = matches.length > 0 ? `为你匹配到 ${matches.length} 条相关内容。` : "没有找到匹配的影片。";
  }
  results.innerHTML = matches.length > 0
    ? matches.map(cardHtml).join("")
    : `<div class="search-empty">没有找到匹配的影片，可以尝试更换片名、年份或题材。</div>`;
}

setupMenu();
setupHero();
setupCardFilters();
setupPlayer();
setupSearchPage();
