import AsyncStorage from '@react-native-async-storage/async-storage';
import { Concept, concepts } from '../data/concepts';

// プレイヤーが所持する概念
export interface OwnedConcept {
  conceptId: number;
  level: number; // 1-10
  exp: number; // 次のレベルまでの経験値
}

// プレイヤーデータ
export interface PlayerData {
  points: number; // ガチャに使うポイント
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  maxStreak: number;
  ownedConcepts: OwnedConcept[];
  selectedConceptId: number | null; // バトルで使用する概念
  createdAt: number;
  lastPlayedAt: number;
}

const STORAGE_KEY = 'BRAIN_BUSTERS_PLAYER_DATA';

// 初期概念のID（ランダムに5つ選ぶ）
const getInitialConcepts = (): OwnedConcept[] => {
  const shuffled = [...concepts].sort(() => Math.random() - 0.5);
  const initial = shuffled.slice(0, 5);
  return initial.map(concept => ({
    conceptId: concept.id,
    level: 1,
    exp: 0,
  }));
};

// 初期プレイヤーデータ
const createInitialPlayerData = (): PlayerData => {
  const now = Date.now();
  return {
    points: 100, // 初期ポイント
    totalBattles: 0,
    totalWins: 0,
    totalLosses: 0,
    maxStreak: 0,
    ownedConcepts: getInitialConcepts(),
    selectedConceptId: null,
    createdAt: now,
    lastPlayedAt: now,
  };
};

// レベルアップに必要な経験値
export const getRequiredExp = (level: number): number => {
  return level * 10; // レベル1→2: 10exp, レベル2→3: 20exp, etc.
};

// 概念のパワーボーナス（レベルに応じて）
export const getLevelBonus = (level: number): number => {
  return (level - 1) * 3; // レベル1: 0, レベル2: 3, レベル10: 27
};

// プレイヤーデータを読み込む
export const loadPlayerData = async (): Promise<PlayerData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as PlayerData;
    }
    // 新規プレイヤー
    const initialData = createInitialPlayerData();
    await savePlayerData(initialData);
    return initialData;
  } catch (error) {
    console.error('Failed to load player data:', error);
    return createInitialPlayerData();
  }
};

// プレイヤーデータを保存
export const savePlayerData = async (data: PlayerData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save player data:', error);
  }
};

// バトル結果を反映
export const updateAfterBattle = async (
  playerData: PlayerData,
  won: boolean,
  currentStreak: number,
  selectedConceptId: number
): Promise<PlayerData> => {
  const pointsEarned = won ? 10 + currentStreak * 2 : 3;

  const updatedData: PlayerData = {
    ...playerData,
    points: playerData.points + pointsEarned,
    totalBattles: playerData.totalBattles + 1,
    totalWins: won ? playerData.totalWins + 1 : playerData.totalWins,
    totalLosses: won ? playerData.totalLosses : playerData.totalLosses + 1,
    maxStreak: Math.max(playerData.maxStreak, currentStreak),
    lastPlayedAt: Date.now(),
  };

  // 使用した概念に経験値を付与
  if (won) {
    updatedData.ownedConcepts = playerData.ownedConcepts.map(oc => {
      if (oc.conceptId === selectedConceptId) {
        const newExp = oc.exp + 5;
        const requiredExp = getRequiredExp(oc.level);

        if (newExp >= requiredExp && oc.level < 10) {
          // レベルアップ
          return {
            ...oc,
            level: oc.level + 1,
            exp: newExp - requiredExp,
          };
        }
        return {
          ...oc,
          exp: oc.level >= 10 ? 0 : newExp,
        };
      }
      return oc;
    });
  }

  await savePlayerData(updatedData);
  return updatedData;
};

// ガチャを引く（10ポイント消費）
export const pullGacha = async (playerData: PlayerData): Promise<{
  newData: PlayerData;
  pulledConcept: Concept;
  isNew: boolean;
  leveledUp: boolean;
}> => {
  const GACHA_COST = 10;

  if (playerData.points < GACHA_COST) {
    throw new Error('Not enough points');
  }

  // レアリティに基づいた抽選
  const rarityWeights = {
    1: 40,  // 40%
    2: 30,  // 30%
    3: 20,  // 20%
    4: 8,   // 8%
    5: 2,   // 2%
  };

  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedRarity = 1;

  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = parseInt(rarity);
      break;
    }
  }

  // 該当レアリティの概念からランダムに選ぶ
  const conceptsOfRarity = concepts.filter(c => c.rarity === selectedRarity);
  const pulledConcept = conceptsOfRarity[Math.floor(Math.random() * conceptsOfRarity.length)];

  // 既に持っているか確認
  const existingIndex = playerData.ownedConcepts.findIndex(
    oc => oc.conceptId === pulledConcept.id
  );

  let isNew = false;
  let leveledUp = false;
  let updatedOwnedConcepts = [...playerData.ownedConcepts];

  if (existingIndex === -1) {
    // 新規取得
    isNew = true;
    updatedOwnedConcepts.push({
      conceptId: pulledConcept.id,
      level: 1,
      exp: 0,
    });
  } else {
    // 重複 → 経験値として還元
    const existing = updatedOwnedConcepts[existingIndex];
    const expGain = pulledConcept.rarity * 5; // レアリティに応じた経験値
    const newExp = existing.exp + expGain;
    const requiredExp = getRequiredExp(existing.level);

    if (newExp >= requiredExp && existing.level < 10) {
      leveledUp = true;
      updatedOwnedConcepts[existingIndex] = {
        ...existing,
        level: existing.level + 1,
        exp: newExp - requiredExp,
      };
    } else {
      updatedOwnedConcepts[existingIndex] = {
        ...existing,
        exp: existing.level >= 10 ? 0 : newExp,
      };
    }
  }

  const newData: PlayerData = {
    ...playerData,
    points: playerData.points - GACHA_COST,
    ownedConcepts: updatedOwnedConcepts,
    lastPlayedAt: Date.now(),
  };

  await savePlayerData(newData);

  return {
    newData,
    pulledConcept,
    isNew,
    leveledUp,
  };
};

// 10連ガチャ（90ポイント消費、1回お得）
export const pullGacha10 = async (playerData: PlayerData): Promise<{
  newData: PlayerData;
  results: Array<{
    pulledConcept: Concept;
    isNew: boolean;
    leveledUp: boolean;
  }>;
}> => {
  const GACHA_10_COST = 90;

  if (playerData.points < GACHA_10_COST) {
    throw new Error('Not enough points');
  }

  const results: Array<{
    pulledConcept: Concept;
    isNew: boolean;
    leveledUp: boolean;
  }> = [];

  let currentData = { ...playerData, points: playerData.points - GACHA_10_COST + 100 };

  for (let i = 0; i < 10; i++) {
    const result = await pullGacha(currentData);
    currentData = result.newData;
    results.push({
      pulledConcept: result.pulledConcept,
      isNew: result.isNew,
      leveledUp: result.leveledUp,
    });
  }

  // 最終的なポイントを調整
  currentData.points = currentData.points - 10; // 10回引いたので100ポイント使った = 90ポイント

  await savePlayerData(currentData);

  return {
    newData: currentData,
    results,
  };
};

// 概念IDから概念データを取得
export const getConceptById = (id: number): Concept | undefined => {
  return concepts.find(c => c.id === id);
};

// 所持概念のリストを取得（概念データ付き）
export const getOwnedConceptsWithData = (playerData: PlayerData): Array<{
  concept: Concept;
  owned: OwnedConcept;
}> => {
  return playerData.ownedConcepts
    .map(oc => {
      const concept = getConceptById(oc.conceptId);
      if (!concept) return null;
      return { concept, owned: oc };
    })
    .filter((item): item is { concept: Concept; owned: OwnedConcept } => item !== null);
};

// ランダムに所持概念を選ぶ
export const getRandomOwnedConcept = (playerData: PlayerData): {
  concept: Concept;
  owned: OwnedConcept;
} | null => {
  const owned = getOwnedConceptsWithData(playerData);
  if (owned.length === 0) return null;
  return owned[Math.floor(Math.random() * owned.length)];
};

// プレイヤーデータをリセット
export const resetPlayerData = async (): Promise<PlayerData> => {
  const initialData = createInitialPlayerData();
  await savePlayerData(initialData);
  return initialData;
};

// 収集率を計算
export const getCollectionRate = (playerData: PlayerData): {
  owned: number;
  total: number;
  percentage: number;
} => {
  const owned = playerData.ownedConcepts.length;
  const total = concepts.length;
  return {
    owned,
    total,
    percentage: Math.round((owned / total) * 100),
  };
};
