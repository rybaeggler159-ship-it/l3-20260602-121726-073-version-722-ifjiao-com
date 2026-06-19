(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        if (!slides.length) {
            return;
        }
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var prev = document.querySelector("[data-hero-prev]");
        var next = document.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function start() {
            stop();
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

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
        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                start();
            });
        });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });
        show(0);
        start();
    }

    function setupFilters() {
        var input = document.querySelector("[data-filter-input]");
        var select = document.querySelector("[data-filter-type]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        if (!cards.length || (!input && !select)) {
            return;
        }

        function apply() {
            var q = input ? input.value.trim().toLowerCase() : "";
            var t = select ? select.value.trim().toLowerCase() : "";
            cards.forEach(function (card) {
                var text = [
                    card.getAttribute("data-title") || "",
                    card.getAttribute("data-year") || "",
                    card.getAttribute("data-type") || "",
                    card.getAttribute("data-genre") || "",
                    card.getAttribute("data-tags") || ""
                ].join(" ").toLowerCase();
                var typeText = (card.getAttribute("data-type") || "").toLowerCase();
                var okQuery = !q || text.indexOf(q) !== -1;
                var okType = !t || typeText.indexOf(t) !== -1;
                card.classList.toggle("is-hidden", !(okQuery && okType));
            });
        }

        if (input) {
            input.addEventListener("input", apply);
        }
        if (select) {
            select.addEventListener("change", apply);
        }
        apply();
    }

    function setupSearchPage() {
        var input = document.getElementById("searchInput");
        var results = document.getElementById("searchResults");
        if (!input || !results || typeof movieIndex === "undefined") {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        input.value = initial;

        function render() {
            var q = input.value.trim().toLowerCase();
            var items = movieIndex.filter(function (movie) {
                if (!q) {
                    return true;
                }
                var text = [
                    movie.title,
                    movie.year,
                    movie.region,
                    movie.type,
                    movie.genre,
                    (movie.tags || []).join(" "),
                    movie.oneLine
                ].join(" ").toLowerCase();
                return text.indexOf(q) !== -1;
            }).slice(0, 120);
            results.innerHTML = items.map(function (movie) {
                return [
                    "<article class=\"search-result\">",
                    "<a href=\"" + movie.href + "\"><img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\"></a>",
                    "<div>",
                    "<h2><a href=\"" + movie.href + "\">" + escapeHtml(movie.title) + "</a></h2>",
                    "<p>" + escapeHtml(movie.oneLine) + "</p>",
                    "<div class=\"rank-meta\"><span>" + movie.year + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span><span>评分 " + movie.score.toFixed(1) + "</span></div>",
                    "</div>",
                    "</article>"
                ].join("");
            }).join("");
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        input.addEventListener("input", render);
        render();
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupSearchPage();
    });
})();

function initMoviePlayer(source) {
    var video = document.querySelector("[data-player]");
    var cover = document.querySelector("[data-player-cover]");
    var button = document.querySelector("[data-play]");
    var hls = null;
    var attached = false;

    if (!video || !source) {
        return;
    }

    function attach() {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
        } else if (window.Hls && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
        } else {
            video.src = source;
        }
    }

    function play() {
        attach();
        video.setAttribute("controls", "controls");
        if (cover) {
            cover.classList.add("is-hidden");
        }
        var action = video.play();
        if (action && action.catch) {
            action.catch(function () {});
        }
    }

    if (button) {
        button.addEventListener("click", play);
    }
    if (cover) {
        cover.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
        if (video.paused) {
            play();
        }
    });
    window.addEventListener("pagehide", function () {
        if (hls && hls.destroy) {
            hls.destroy();
        }
    });
}
