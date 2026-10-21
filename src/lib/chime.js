// A short two-note chime for new work, made with the Web Audio API (no sound file).
// Browsers keep sound off until the person clicks or types on the page, so the
// player is made at that first click; a chime before it stays silent.
let audio = null;

function unlock() {
  audio ??= new AudioContext();
}
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

export function chime() {
  if (!audio) return;
  const now = audio.currentTime;
  [880, 1320].forEach((pitch, i) => {
    const start = now + i * 0.15;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = pitch;
    volume.gain.setValueAtTime(0.15, start);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.3); // fades out, no click
    tone.connect(volume).connect(audio.destination);
    tone.start(start);
    tone.stop(start + 0.3);
  });
}
