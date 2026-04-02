const TIMER_SRC = '/timer-sound.mp3';
const HIT_SRC = '/hit-sound.mp3';

let timerAudio: HTMLAudioElement | null = null;
let hitAudio: HTMLAudioElement | null = null;

function getTimerAudio(): HTMLAudioElement {
  if (!timerAudio) {
    timerAudio = new Audio(TIMER_SRC);
    timerAudio.preload = 'auto';
    timerAudio.volume = 0.45;
  }
  return timerAudio;
}

function getHitAudio(): HTMLAudioElement {
  if (!hitAudio) {
    hitAudio = new Audio(HIT_SRC);
    hitAudio.preload = 'auto';
    hitAudio.volume = 0.55;
  }
  return hitAudio;
}

export function playTimerTickSound(): void {
  const a = getTimerAudio();
  a.currentTime = 0;
  void a.play().catch(() => {});
}

export function playHitSound(): void {
  const a = getHitAudio();
  a.currentTime = 0;
  void a.play().catch(() => {});
}
