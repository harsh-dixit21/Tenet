// Keep the outgoing picture opaque while the next decoder fades in above it.
// Each rewind happens only after that decoder has become fully invisible.
export function startEndlessVideo(container) {
  const videos = [...container.querySelectorAll('video')];
  if (videos.length !== 2) return;
  let current = 0, incoming = -1, preparing = false, frame = 0, stopped = false;
  const overlap = 2;
  videos.forEach((video, i) => {
    video.muted = video.defaultMuted = true;
    video.loop = false;
    video.style.opacity = i === 0 ? '1' : '0';
    video.style.zIndex = i === 0 ? '0' : '1';
  });
  const schedule = () => {
    if (!frame && !document.hidden && !stopped) frame = requestAnimationFrame(tick);
  };
  async function prepare() {
    preparing = true;
    const index = 1 - current, next = videos[index];
    try {
      if (next.currentTime !== 0) next.currentTime = 0;
      next.style.zIndex = '1';
      next.style.opacity = '0';
      await next.play();
      if (!stopped) incoming = index;
      if (document.hidden) next.pause();
    } catch {
      // The current frame remains visible if a browser delays the other decoder.
    } finally { preparing = false; schedule(); }
  }
  function tick() {
    frame = 0;
    if (document.hidden || stopped) return;
    const active = videos[current];
    const duration = active.duration;
    const fade = Number.isFinite(duration) ? Math.min(overlap, duration / 3) : overlap;
    if (incoming >= 0) {
      const next = videos[incoming];
      if (next.readyState >= 2 && !next.seeking) {
        const t = Math.min(1, Math.max(0, next.currentTime / fade));
        next.style.opacity = String(t * t * (3 - 2 * t));
        if (t >= 1) {
          // Reorder only when the incoming video is completely opaque.
          active.style.opacity = '0';
          active.style.zIndex = '1';
          active.pause();
          next.style.zIndex = '0';
          current = incoming;
          incoming = -1;
          active.currentTime = 0;
        }
      }
    } else if (!preparing && Number.isFinite(duration) && duration > 0 && duration - active.currentTime <= fade) {
      prepare();
    }
    schedule();
  }
  function resume() {
    if (document.hidden) {
      videos.forEach(video => video.pause());
      cancelAnimationFrame(frame); frame = 0;
    } else {
      videos[current].play().then(schedule).catch(() => {});
      if (incoming >= 0) videos[incoming].play().catch(() => {});
      schedule();
    }
  }
  function fallback(event) {
    const failed = videos.indexOf(event.currentTarget), good = 1 - failed;
    stopped = true; cancelAnimationFrame(frame); frame = 0;
    videos[failed].style.opacity = '0';
    videos[good].style.opacity = '1';
    videos[good].loop = true;
    videos[good].play().catch(() => {});
  }
  videos.forEach(video => video.addEventListener('error', fallback));
  videos[0].addEventListener('loadeddata', resume, {once:true});
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  document.addEventListener('pointerdown', resume, {once:true});
  resume();
}
