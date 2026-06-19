const video = document.getElementById('movieVideo');
const playButton = document.querySelector('.play-cover');
let hlsInstance = null;

function loadAndPlay(source) {
  if (!video || !source) return;

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
    video.addEventListener('loadedmetadata', () => video.play(), { once: true });
  } else if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    hlsInstance = new Hls({ enableWorker: true });
    hlsInstance.loadSource(source);
    hlsInstance.attachMedia(video);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else {
    video.src = source;
    video.play();
  }
}

if (playButton && video) {
  playButton.addEventListener('click', () => {
    playButton.classList.add('hidden');
    loadAndPlay(pageVideoSource);
  });

  video.addEventListener('click', () => {
    if (video.paused) {
      video.play();
    }
  });
}
