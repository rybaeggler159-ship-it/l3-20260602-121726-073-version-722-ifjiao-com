const ready = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
};

ready(() => {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.nav-toggle');

    if (nav && toggle) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
        });
    }

    document.querySelectorAll('[data-hero]').forEach((hero) => {
        const slides = Array.from(hero.querySelectorAll('.hero-slide'));
        const dots = Array.from(hero.querySelectorAll('.hero-dot'));
        const prev = hero.querySelector('.hero-prev');
        const next = hero.querySelector('.hero-next');
        let index = 0;
        let timer = null;

        const show = (nextIndex) => {
            if (!slides.length) return;
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        };

        const restart = () => {
            if (timer) window.clearInterval(timer);
            timer = window.setInterval(() => show(index + 1), 5600);
        };

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                show(i);
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

        restart();
    });

    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    const searchBox = document.querySelector('[data-search-box]');
    const filterInput = document.querySelector('[data-filter-input]');
    const list = document.querySelector('[data-filter-list]');
    const empty = document.querySelector('[data-empty-result]');

    if (searchBox && query) {
        searchBox.value = query;
    }

    if (filterInput && query) {
        filterInput.value = query;
    }

    const applyFilter = () => {
        if (!list || !filterInput) return;
        const value = filterInput.value.trim().toLowerCase();
        const cards = Array.from(list.querySelectorAll('.movie-card'));
        let visible = 0;

        cards.forEach((card) => {
            const haystack = `${card.dataset.title || ''} ${card.dataset.meta || ''}`.toLowerCase();
            const matched = !value || haystack.includes(value);
            card.hidden = !matched;
            if (matched) visible += 1;
        });

        if (empty) {
            empty.hidden = visible !== 0;
        }
    };

    if (filterInput && list) {
        filterInput.addEventListener('input', applyFilter);
        applyFilter();
    }

    document.querySelectorAll('.js-player').forEach((player) => {
        const video = player.querySelector('video');
        const button = player.querySelector('.video-start');
        const box = player.querySelector('.video-box');
        const source = video ? video.querySelector('source') : null;
        const src = source ? source.getAttribute('src') : '';
        let started = false;

        const play = async () => {
            if (!video || !src || started) return;
            started = true;
            video.controls = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
            } else {
                try {
                    const module = await import('./hls-vendor-dru42stk.js');
                    const Hls = module.H;

                    if (Hls && Hls.isSupported()) {
                        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                        hls.loadSource(src);
                        hls.attachMedia(video);
                    } else {
                        video.src = src;
                    }
                } catch (error) {
                    video.src = src;
                }
            }

            if (box) {
                box.classList.add('is-playing');
            }

            try {
                await video.play();
            } catch (error) {
                if (box) {
                    box.classList.remove('is-playing');
                }
                started = false;
            }
        };

        if (button) {
            button.addEventListener('click', play);
        }

        if (video) {
            video.addEventListener('click', () => {
                if (!started) play();
            });
        }
    });
});
