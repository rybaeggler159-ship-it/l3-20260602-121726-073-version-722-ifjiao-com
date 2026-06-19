const navButton = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.main-nav');

if (navButton && navMenu) {
  navButton.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
}

const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.hero-dot'));
const prev = document.querySelector('.hero-control.prev');
const next = document.querySelector('.hero-control.next');
let heroIndex = 0;
let heroTimer = null;

function showHero(index) {
  if (!slides.length) return;
  heroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, idx) => slide.classList.toggle('active', idx === heroIndex));
  dots.forEach((dot, idx) => dot.classList.toggle('active', idx === heroIndex));
}

function restartHero() {
  if (!slides.length) return;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHero(heroIndex + 1), 6500);
}

if (slides.length) {
  showHero(0);
  restartHero();
  if (prev) {
    prev.addEventListener('click', () => {
      showHero(heroIndex - 1);
      restartHero();
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      showHero(heroIndex + 1);
      restartHero();
    });
  }
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      showHero(idx);
      restartHero();
    });
  });
}

const searchInput = document.querySelector('#siteSearch');
const sortSelect = document.querySelector('#sortSelect');
const searchableList = document.querySelector('.searchable-list');

function applySearchAndSort() {
  if (!searchableList) return;
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const items = Array.from(searchableList.children);

  items.forEach(item => {
    const text = item.getAttribute('data-title') || item.textContent.toLowerCase();
    item.classList.toggle('hidden-by-filter', query !== '' && !text.includes(query));
  });

  if (sortSelect && sortSelect.value !== 'default') {
    const sorted = items.sort((a, b) => {
      const av = Number(a.getAttribute(`data-${sortSelect.value}`) || 0);
      const bv = Number(b.getAttribute(`data-${sortSelect.value}`) || 0);
      return bv - av;
    });
    sorted.forEach(item => searchableList.appendChild(item));
  }
}

if (searchInput) {
  searchInput.addEventListener('input', applySearchAndSort);
}

if (sortSelect) {
  sortSelect.addEventListener('change', applySearchAndSort);
}
