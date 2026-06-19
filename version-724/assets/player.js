(function () {
  function setupPlayer(root) {
    var video = root.querySelector('video');
    var overlay = root.querySelector('.player-overlay');
    var status = root.querySelector('.player-status');
    var src = root.getAttribute('data-src');
    var hls = null;
    var initialized = false;

    function setStatus(text) {
      if (status) {
        status.textContent = text || '';
      }
    }

    function initialize() {
      if (!video || !src || initialized) {
        return;
      }
      initialized = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
              setStatus('正在重新连接播放源');
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              setStatus('正在恢复播放器');
            } else {
              setStatus('当前浏览器暂时无法加载播放源');
              hls.destroy();
            }
          }
        });
      } else {
        video.src = src;
      }
    }

    function playVideo() {
      initialize();
      root.classList.add('is-playing');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          root.classList.remove('is-playing');
          setStatus('请再次点击播放按钮开始播放');
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', function (event) {
        event.preventDefault();
        playVideo();
      });
    }
    if (video) {
      video.addEventListener('play', function () {
        root.classList.add('is-playing');
        setStatus('');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          root.classList.remove('is-playing');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.js-player')).forEach(setupPlayer);
  });
})();
