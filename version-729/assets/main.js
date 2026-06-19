(() => {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    const start = () => {
      timer = window.setInterval(() => show(index + 1), 5200);
    };

    const restart = () => {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const nextIndex = Number(dot.dataset.heroDot || 0);
        show(nextIndex);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', () => {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        show(index + 1);
        restart();
      });
    }

    show(0);
    start();
  }

  const scopes = Array.from(document.querySelectorAll('[data-filter-scope]'));

  scopes.forEach((scope) => {
    const page = scope.closest('main') || document;
    const textInput = scope.querySelector('[data-filter-text]');
    const yearSelect = scope.querySelector('[data-filter-year]');
    const regionSelect = scope.querySelector('[data-filter-region]');
    const resetButton = scope.querySelector('[data-filter-reset]');
    const cards = Array.from(page.querySelectorAll('.movie-card'));

    const normalize = (value) => String(value || '').toLowerCase().trim();

    const apply = () => {
      const text = normalize(textInput ? textInput.value : '');
      const year = normalize(yearSelect ? yearSelect.value : '');
      const region = normalize(regionSelect ? regionSelect.value : '');

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.region,
          card.dataset.year,
          card.dataset.type,
          card.dataset.genre,
          card.dataset.tags
        ].join(' '));
        const matchesText = !text || haystack.includes(text);
        const matchesYear = !year || normalize(card.dataset.year) === year;
        const matchesRegion = !region || normalize(card.dataset.region) === region;
        card.hidden = !(matchesText && matchesYear && matchesRegion);
      });
    };

    if (textInput) {
      textInput.addEventListener('input', apply);
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', apply);
    }

    if (regionSelect) {
      regionSelect.addEventListener('change', apply);
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (textInput) {
          textInput.value = '';
        }
        if (yearSelect) {
          yearSelect.value = '';
        }
        if (regionSelect) {
          regionSelect.value = '';
        }
        apply();
      });
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (query && textInput) {
      textInput.value = query;
      apply();
    }
  });

  const videoShells = Array.from(document.querySelectorAll('[data-video-shell]'));

  videoShells.forEach((shell) => {
    const video = shell.querySelector('video[data-m3u8]');
    const button = shell.querySelector('[data-video-play]');

    if (!video) {
      return;
    }

    const src = video.dataset.m3u8;
    let prepared = false;

    const prepare = () => {
      if (prepared || !src) {
        return;
      }
      prepared = true;

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    };

    const play = () => {
      prepare();
      const promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
    };

    if (button) {
      button.addEventListener('click', play);
    }

    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener('play', () => {
      shell.classList.add('playing');
    });

    video.addEventListener('pause', () => {
      shell.classList.remove('playing');
    });

    video.addEventListener('loadedmetadata', () => {
      shell.classList.add('ready');
    });
  });
})();
