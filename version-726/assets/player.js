(function () {
  var players = document.querySelectorAll('[data-player]');

  players.forEach(function (shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play-button]');
    var state = shell.querySelector('[data-player-state]');
    var source = shell.getAttribute('data-src');
    var initialized = false;
    var hlsInstance = null;

    function setState(text) {
      if (state) {
        state.textContent = text;
      }
    }

    function initialize() {
      if (initialized || !video || !source) {
        return;
      }

      initialized = true;
      setState('正在准备播放');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setState('播放源已就绪');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setState('播放源已就绪');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setState('播放加载异常，请稍后重试');
            try {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hlsInstance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hlsInstance.recoverMediaError();
              }
            } catch (error) {
              setState('当前浏览器无法恢复播放');
            }
          }
        });
        return;
      }

      video.src = source;
      setState('播放源已绑定');
    }

    function startPlayback() {
      initialize();
      var playPromise = video.play();
      shell.classList.add('is-playing');
      setState('正在播放');

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          shell.classList.remove('is-playing');
          setState('点击播放器继续播放');
        });
      }
    }

    if (button) {
      button.addEventListener('click', startPlayback);
    }

    if (video) {
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
        setState('正在播放');
      });
      video.addEventListener('pause', function () {
        shell.classList.remove('is-playing');
        setState('已暂停');
      });
      video.addEventListener('ended', function () {
        shell.classList.remove('is-playing');
        setState('播放结束');
      });
    }

    initialize();
  });
})();
