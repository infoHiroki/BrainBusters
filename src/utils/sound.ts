// 効果音ユーティリティ
// expo-avを使用したサウンドシステム

import { Audio } from 'expo-av';

// サウンド設定
let soundEnabled = true;
let soundVolume = 0.7;

// サウンドタイプの定義
export type SoundType =
  | 'attack'      // 攻撃
  | 'block'       // ブロック
  | 'heal'        // 回復
  | 'damage'      // ダメージを受けた
  | 'victory'     // 勝利
  | 'defeat'      // 敗北
  | 'cardPlay'    // カード使用
  | 'button'      // ボタン押下
  | 'levelUp'     // レベルアップ/ボス撃破
  | 'reward';     // 報酬獲得

// 周波数ベースの簡易効果音生成（Web Audio APIが使える環境用）
// React Nativeではexpo-avを使用するため、こちらはフォールバック
const soundFrequencies: Record<SoundType, { freq: number; duration: number; type: 'sine' | 'square' | 'sawtooth' }> = {
  attack: { freq: 200, duration: 100, type: 'square' },
  block: { freq: 300, duration: 80, type: 'sine' },
  heal: { freq: 600, duration: 200, type: 'sine' },
  damage: { freq: 150, duration: 150, type: 'sawtooth' },
  victory: { freq: 800, duration: 300, type: 'sine' },
  defeat: { freq: 100, duration: 400, type: 'sawtooth' },
  cardPlay: { freq: 400, duration: 50, type: 'sine' },
  button: { freq: 500, duration: 30, type: 'sine' },
  levelUp: { freq: 700, duration: 250, type: 'sine' },
  reward: { freq: 550, duration: 150, type: 'sine' },
};

// AudioContextのインスタンス（Web用）
let audioContext: AudioContext | null = null;

// Web Audio API を使用した効果音再生
const playWebAudioSound = (type: SoundType): void => {
  try {
    // AudioContextの初期化（遅延初期化）
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const { freq, duration, type: waveType } = soundFrequencies[type];

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

    gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch {
    // Web Audio APIが使えない環境では何もしない
    console.log('Web Audio API not available');
  }
};

// 効果音を再生
export const playSound = async (type: SoundType): Promise<void> => {
  if (!soundEnabled) return;

  // Web環境では Web Audio API を使用
  if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
    playWebAudioSound(type);
    return;
  }

  // React Native環境では将来的にexpo-avの音声ファイルを使用
  // 現時点ではログのみ
  console.log(`Sound: ${type}`);
};

// 勝利ファンファーレ（複数音を組み合わせ）
export const playVictoryFanfare = async (): Promise<void> => {
  if (!soundEnabled) return;

  if (typeof window !== 'undefined' && audioContext) {
    try {
      // 3つの音を順番に再生
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, index) => {
        setTimeout(() => {
          if (!audioContext) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

          gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 150);
      });
    } catch {
      console.log('Victory fanfare unavailable');
    }
  }
};

// サウンド設定
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

export const setSoundVolume = (volume: number): void => {
  soundVolume = Math.max(0, Math.min(1, volume));
};

export const getSoundEnabled = (): boolean => soundEnabled;
export const getSoundVolume = (): number => soundVolume;

// 初期化（AudioContextの準備）
export const initializeSound = async (): Promise<void> => {
  try {
    // expo-avのオーディオモード設定
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log('Sound system initialized');
  } catch {
    console.log('Sound system initialization failed');
  }
};
