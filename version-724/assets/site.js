(function () {
  var $ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  function initNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initImageFallback() {
    $('img').forEach(function (img) {
      img.addEventListener('error', function () {
        var parent = img.closest('.poster-frame, .detail-poster, .mini-cover, .rank-cover, .hero-poster');
        if (parent) {
          parent.classList.add('cover-missing');
        }
      });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = $('.hero-slide', hero);
    var dots = $('[data-hero-dot]', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      if (slides.length <= 1) {
        return;
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        if (timer) {
          window.clearInterval(timer);
        }
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function initCatalogFilter() {
    var panel = document.querySelector('[data-filter-panel]');
    var list = document.querySelector('[data-filter-list]');
    if (!panel || !list) {
      return;
    }
    var keyword = panel.querySelector('[data-filter-keyword]');
    var year = panel.querySelector('[data-filter-year]');
    var type = panel.querySelector('[data-filter-type]');
    var reset = panel.querySelector('[data-filter-reset]');
    var count = document.querySelector('[data-filter-count]');
    var cards = $('.movie-card', list);

    function apply() {
      var q = (keyword.value || '').trim().toLowerCase();
      var y = year.value || '';
      var t = type.value || '';
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        var ok = true;
        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }
        if (y && card.getAttribute('data-year') !== y) {
          ok = false;
        }
        if (t && card.getAttribute('data-type') !== t) {
          ok = false;
        }
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = String(visible);
      }
    }

    [keyword, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
    if (reset) {
      reset.addEventListener('click', function () {
        keyword.value = '';
        year.value = '';
        type.value = '';
        apply();
      });
    }
    apply();
  }

  function createSearchCard(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '  <a class="poster-frame" href="' + item.url + '" data-title="' + escapeHtml(item.title) + '">',
      '    <img src="' + item.image + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
      '    <span class="poster-badge">' + escapeHtml(item.type) + '</span>',
      '    <span class="poster-duration">' + escapeHtml(item.duration) + '</span>',
      '  </a>',
      '  <div class="card-body">',
      '    <div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + item.year + '</span><span>评分 ' + escapeHtml(item.rating) + '</span></div>',
      '    <h3><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h3>',
      '    <p>' + escapeHtml(item.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initSearchPage() {
    var results = document.getElementById('searchResults');
    var input = document.getElementById('searchInput');
    var type = document.getElementById('searchType');
    var clear = document.getElementById('searchClear');
    var count = document.getElementById('searchCount');
    var data = window.MOVIE_SEARCH_DATA || [];
    if (!results || !input || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || '';

    function render() {
      var q = input.value.trim().toLowerCase();
      var t = type.value || '';
      var filtered = data.filter(function (item) {
        var haystack = [item.title, item.region, item.type, item.year, item.genre, (item.tags || []).join(' '), item.oneLine].join(' ').toLowerCase();
        var ok = true;
        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }
        if (t && item.type !== t) {
          ok = false;
        }
        return ok;
      }).slice(0, 240);
      count.textContent = String(filtered.length);
      results.innerHTML = filtered.map(createSearchCard).join('');
      initImageFallback();
    }

    input.addEventListener('input', render);
    type.addEventListener('change', render);
    clear.addEventListener('click', function () {
      input.value = '';
      type.value = '';
      render();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initImageFallback();
    initHero();
    initCatalogFilter();
    initSearchPage();
  });
})();
