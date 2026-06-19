(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');
  var navSearch = document.querySelector('.nav-search');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
      if (navSearch) {
        navSearch.classList.toggle('is-open');
      }
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle('is-active', itemIndex === current);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle('is-active', itemIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var searchInput = document.querySelector('[data-search-input]');
  var searchScope = document.querySelector('[data-search-scope]');
  var clearButton = document.querySelector('[data-search-clear]');
  var emptyState = document.querySelector('[data-empty-state]');

  if (searchInput && searchScope) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var cards = Array.prototype.slice.call(searchScope.querySelectorAll('.movie-card'));

    function applyFilter(value) {
      var normalized = value.trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        var matched = !normalized || haystack.indexOf(normalized) !== -1;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle('is-visible', visible === 0);
      }
    }

    searchInput.value = query;
    applyFilter(query);
    searchInput.addEventListener('input', function () {
      applyFilter(searchInput.value);
    });

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        searchInput.value = '';
        applyFilter('');
        searchInput.focus();
      });
    }
  }
})();
