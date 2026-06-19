(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var navMenu = document.querySelector('[data-nav-menu]');

  if (navButton && navMenu) {
    navButton.addEventListener('click', function () {
      navMenu.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    var showSlide = function (index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-root]')).forEach(function (root) {
    var search = root.querySelector('[data-filter-search]');
    var region = root.querySelector('[data-filter-region]');
    var type = root.querySelector('[data-filter-type]');
    var result = root.querySelector('[data-filter-result]');
    var scope = root.parentElement || document;
    var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));

    var apply = function () {
      var query = search ? search.value.trim().toLowerCase() : '';
      var selectedRegion = region ? region.value : '';
      var selectedType = type ? type.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = card.getAttribute('data-search') || '';
        var cardRegion = card.getAttribute('data-region') || '';
        var cardType = card.getAttribute('data-type') || '';
        var matched = true;

        if (query && text.indexOf(query) === -1) {
          matched = false;
        }

        if (selectedRegion && cardRegion.indexOf(selectedRegion) === -1) {
          matched = false;
        }

        if (selectedType && cardType.indexOf(selectedType) === -1) {
          matched = false;
        }

        card.classList.toggle('hidden', !matched);

        if (matched) {
          visible += 1;
        }
      });

      if (result) {
        result.textContent = query || selectedRegion || selectedType ? '匹配影片：' + visible + ' 部' : '';
      }
    };

    [search, region, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  });

  var player = document.querySelector('[data-player]');

  if (player) {
    var video = player.querySelector('video');
    var startButton = player.querySelector('[data-player-start]');
    var playButton = player.querySelector('[data-player-play]');
    var muteButton = player.querySelector('[data-player-mute]');
    var fullscreenButton = player.querySelector('[data-player-fullscreen]');
    var bar = player.querySelector('[data-player-bar]');
    var progress = player.querySelector('[data-player-progress]');
    var time = player.querySelector('[data-player-time]');
    var data = document.getElementById('player-data');
    var source = '';
    var hls = null;
    var ready = false;

    try {
      source = JSON.parse(data.textContent).src;
    } catch (error) {
      source = '';
    }

    var formatTime = function (seconds) {
      if (!Number.isFinite(seconds)) {
        return '0:00';
      }

      var minutes = Math.floor(seconds / 60);
      var left = Math.floor(seconds % 60).toString().padStart(2, '0');
      return minutes + ':' + left;
    };

    var bindSource = function () {
      if (ready || !source || !video) {
        return;
      }

      ready = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    };

    var play = function () {
      bindSource();
      player.classList.add('playing');

      if (startButton) {
        startButton.classList.add('hidden');
      }

      var promise = video.play();

      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    };

    var togglePlay = function () {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    };

    if (startButton) {
      startButton.addEventListener('click', play);
    }

    if (playButton) {
      playButton.addEventListener('click', togglePlay);
    }

    video.addEventListener('click', togglePlay);

    video.addEventListener('play', function () {
      player.classList.add('playing');

      if (startButton) {
        startButton.classList.add('hidden');
      }

      if (playButton) {
        playButton.textContent = '暂停';
      }
    });

    video.addEventListener('pause', function () {
      if (playButton) {
        playButton.textContent = '播放';
      }
    });

    video.addEventListener('timeupdate', function () {
      var percent = video.duration ? (video.currentTime / video.duration) * 100 : 0;

      if (progress) {
        progress.style.width = percent + '%';
      }

      if (time) {
        time.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
      }
    });

    if (bar) {
      bar.addEventListener('click', function (event) {
        if (!video.duration) {
          return;
        }

        var rect = bar.getBoundingClientRect();
        var rate = (event.clientX - rect.left) / rect.width;
        video.currentTime = Math.max(0, Math.min(video.duration * rate, video.duration));
      });
    }

    if (muteButton) {
      muteButton.addEventListener('click', function () {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? '静音' : '音量';
      });
    }

    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      });
    }

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }
})();
