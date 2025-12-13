// 統計データ管理
// ゲームの統計情報を永続化

import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_STORAGE_KEY = 'BRAIN_BUSTERS_STATS';

export interface GameStats {
  totalRuns: number;      // 総プレイ回数
  victories: number;      // クリア回数（15F到達）
  bestFloor: number;      // 最高到達階
  totalEnemiesDefeated: number;  // 総撃破敵数
  lastPlayedAt: number;   // 最終プレイ日時
}

// 初期統計データ
const initialStats: GameStats = {
  totalRuns: 0,
  victories: 0,
  bestFloor: 0,
  totalEnemiesDefeated: 0,
  lastPlayedAt: Date.now(),
};

// 統計を読み込み
export const loadStats = async (): Promise<GameStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as GameStats;
    }
    return initialStats;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return initialStats;
  }
};

// 統計を保存
export const saveStats = async (stats: GameStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
};

// ラン終了時に統計を更新
export const updateStatsAfterRun = async (
  currentStats: GameStats,
  floor: number,
  victory: boolean,
  enemiesDefeated: number
): Promise<GameStats> => {
  const newStats: GameStats = {
    totalRuns: currentStats.totalRuns + 1,
    victories: victory ? currentStats.victories + 1 : currentStats.victories,
    bestFloor: Math.max(currentStats.bestFloor, floor),
    totalEnemiesDefeated: currentStats.totalEnemiesDefeated + enemiesDefeated,
    lastPlayedAt: Date.now(),
  };

  await saveStats(newStats);
  return newStats;
};

// 統計をリセット（デバッグ用）
export const resetStats = async (): Promise<GameStats> => {
  await saveStats(initialStats);
  return initialStats;
};
