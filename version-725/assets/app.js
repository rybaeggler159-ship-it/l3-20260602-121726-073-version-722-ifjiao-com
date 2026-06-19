(function () {
  var body = document.body;
  var menuButton = document.querySelector('.menu-toggle');

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
  }

  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dots button'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var searchForms = document.querySelectorAll('[data-site-search-form]');
  searchForms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      if (value) {
        window.location.href = form.getAttribute('action') + '?q=' + encodeURIComponent(value);
      }
    });
  });

  var searchGrid = document.querySelector('[data-search-grid]');
  if (searchGrid) {
    var queryInput = document.querySelector('[data-search-input]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var typeSelect = document.querySelector('[data-type-filter]');
    var cards = Array.prototype.slice.call(searchGrid.querySelectorAll('.movie-card'));
    var empty = document.querySelector('[data-empty-state]');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';

    if (queryInput) {
      queryInput.value = initial;
    }

    function normalize(value) {
      return String(value || '').toLowerCase();
    }

    function applyFilter() {
      var keyword = normalize(queryInput ? queryInput.value : '');
      var year = yearSelect ? yearSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' '));
        var yearMatched = !year || card.getAttribute('data-year') === year;
        var typeMatched = !type || card.getAttribute('data-type') === type;
        var keywordMatched = !keyword || text.indexOf(keyword) !== -1;
        var matched = yearMatched && typeMatched && keywordMatched;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.style.display = visible ? 'none' : 'block';
      }
    }

    [queryInput, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  var streamTag = document.getElementById('movie-stream');
  var video = document.getElementById('videoPlayer');
  var overlay = document.getElementById('playerOverlay');
  var playButton = document.getElementById('playButton');
  var status = document.getElementById('playerStatus');

  if (streamTag && video) {
    var stream = null;

    try {
      stream = JSON.parse(streamTag.textContent || '{}');
    } catch (error) {
      stream = {};
    }

    var streamUrl = stream.src || '';
    var started = false;
    var hlsInstance = null;

    function setStatus(text) {
      if (status) {
        status.textContent = text || '';
      }
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }

    function requestPlayback() {
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          setStatus('点击播放按钮继续观看。');
        });
      }
    }

    function attachStream() {
      if (!streamUrl) {
        setStatus('播放加载遇到问题，请稍后重试。');
        return;
      }

      if (started) {
        requestPlayback();
        return;
      }

      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', requestPlayback, { once: true });
        video.load();
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, requestPlayback);
        hlsInstance.on(window.Hls.Events.ERROR, function () {
          setStatus('播放加载遇到问题，请稍后重试。');
        });
      } else {
        setStatus('播放加载遇到问题，请稍后重试。');
      }
    }

    function playVideo() {
      hideOverlay();
      attachStream();
    }

    if (overlay) {
      overlay.addEventListener('click', playVideo);
    }

    if (playButton) {
      playButton.addEventListener('click', function (event) {
        event.stopPropagation();
        playVideo();
      });
    }

    video.addEventListener('play', hideOverlay);
    video.addEventListener('error', function () {
      setStatus('播放加载遇到问题，请稍后重试。');
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }
})();
