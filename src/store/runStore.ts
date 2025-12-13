// ラン状態管理
// 1回の冒険（ラン）中のデータを管理

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RunState,
  BattleState,
  Card,
  CardInstance,
  Relic,
  MapNode,
  Enemy,
  StatusEffect,
  GAME_CONFIG,
} from '../types/game';
import { generateStarterDeck, getCardById, cards, upgradeCard } from '../data/cards';
import { generateEnemyGroup, selectNextIntent } from '../data/enemies';

const RUN_STORAGE_KEY = 'BRAIN_BUSTERS_CURRENT_RUN';

// ユニークIDを生成
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// カードをインスタンス化
const createCardInstance = (card: Card): CardInstance => ({
  instanceId: generateId(),
  card: card,
});

// マップを生成（シンプルな一本道）
// 休憩所は削除、ボス撃破時に回復
const generateMap = (): MapNode[] => {
  const nodes: MapNode[] = [];

  // エリート階: 2, 4, 7, 9, 12, 14, 17, 19, 22, 24
  const eliteFloors = [2, 4, 7, 9, 12, 14, 17, 19, 22, 24];
  // ショップ階（休憩所は廃止）: 3, 6, 8, 11, 13, 16, 18, 21, 23
  const shopFloors = [3, 6, 8, 11, 13, 16, 18, 21, 23];

  for (let floor = 1; floor <= GAME_CONFIG.MAX_FLOOR; floor++) {
    let type: MapNode['type'];

    if ((GAME_CONFIG.BOSS_FLOORS as readonly number[]).includes(floor)) {
      type = 'boss';
    } else if (shopFloors.includes(floor)) {
      type = 'shop';
    } else if (eliteFloors.includes(floor)) {
      type = 'elite';
    } else {
      type = 'battle';
    }

    nodes.push({
      id: `floor_${floor}`,
      floor: floor,
      type: type,
      x: 0,
      connections: floor < GAME_CONFIG.MAX_FLOOR ? [`floor_${floor + 1}`] : [],
      completed: false,
    });
  }

  return nodes;
};

// 新しいランを開始
export const startNewRun = async (): Promise<RunState> => {
  const starterDeck = generateStarterDeck();

  const runState: RunState = {
    id: generateId(),
    floor: 1,
    hp: GAME_CONFIG.STARTING_HP,
    maxHp: GAME_CONFIG.STARTING_HP,
    deck: starterDeck.map(createCardInstance),
    energy: GAME_CONFIG.STARTING_ENERGY,
    maxEnergy: GAME_CONFIG.STARTING_ENERGY,
    relics: [],
    gold: GAME_CONFIG.STARTING_GOLD,
    map: generateMap(),
    currentNodeId: 'floor_1',
    seed: Math.floor(Math.random() * 1000000),
    startedAt: Date.now(),
    stockCard: null,  // ストックカードは最初は空
  };

  await saveRunState(runState);
  return runState;
};

// ランを保存
export const saveRunState = async (state: RunState): Promise<void> => {
  try {
    await AsyncStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save run state:', error);
  }
};

// ランを読み込み
export const loadRunState = async (): Promise<RunState | null> => {
  try {
    const data = await AsyncStorage.getItem(RUN_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as RunState;
    }
    return null;
  } catch (error) {
    console.error('Failed to load run state:', error);
    return null;
  }
};

// ランを削除（終了時）
export const clearRunState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RUN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear run state:', error);
  }
};

// バトル状態を初期化
export const initBattleState = (runState: RunState): BattleState => {
  const currentNode = runState.map.find(n => n.id === runState.currentNodeId);
  const nodeType = currentNode?.type || 'battle';

  return {
    enemies: generateEnemyGroup(runState.floor, nodeType as 'battle' | 'elite' | 'boss'),
    turn: 1,
    playerBlock: 0,
    playerStatuses: [],
    isPlayerTurn: true,
  };
};

// 山札をシャッフル
export const shuffleDeck = (deck: CardInstance[]): CardInstance[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 手札を引く
export const drawCards = (
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  hand: CardInstance[],
  count: number
): {
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
} => {
  let newDrawPile = [...drawPile];
  let newDiscardPile = [...discardPile];
  const newHand = [...hand];

  for (let i = 0; i < count; i++) {
    // 山札が空なら捨て札をシャッフルして山札に
    if (newDrawPile.length === 0) {
      if (newDiscardPile.length === 0) break;
      newDrawPile = shuffleDeck(newDiscardPile);
      newDiscardPile = [];
    }

    const card = newDrawPile.shift();
    if (card) {
      newHand.push(card);
    }
  }

  return {
    hand: newHand,
    drawPile: newDrawPile,
    discardPile: newDiscardPile,
  };
};

// カードを使用（手札から捨て札へ）
export const playCard = (
  hand: CardInstance[],
  discardPile: CardInstance[],
  cardInstanceId: string
): {
  hand: CardInstance[];
  discardPile: CardInstance[];
  playedCard: CardInstance | null;
} => {
  const cardIndex = hand.findIndex(c => c.instanceId === cardInstanceId);
  if (cardIndex === -1) {
    return { hand, discardPile, playedCard: null };
  }

  const playedCard = hand[cardIndex];
  const newHand = [...hand];
  newHand.splice(cardIndex, 1);

  return {
    hand: newHand,
    discardPile: [...discardPile, playedCard],
    playedCard,
  };
};

// ダメージ計算
export const calculateDamage = (
  baseDamage: number,
  attackerStatuses: StatusEffect[],
  defenderStatuses: StatusEffect[]
): number => {
  let damage = baseDamage;

  // 筋力ボーナス
  const strength = attackerStatuses.find(s => s.type === 'strength');
  if (strength) {
    damage += strength.stacks;
  }

  // 弱体化デバフ
  const weak = attackerStatuses.find(s => s.type === 'weak');
  if (weak) {
    damage = Math.floor(damage * 0.75);
  }

  // 脆弱デバフ（被ダメージ増加）
  const vulnerable = defenderStatuses.find(s => s.type === 'vulnerable');
  if (vulnerable) {
    damage = Math.floor(damage * 1.5);
  }

  return Math.max(0, damage);
};

// ブロック計算
export const calculateBlock = (
  baseBlock: number,
  statuses: StatusEffect[]
): number => {
  let block = baseBlock;

  // 敏捷ボーナス
  const dexterity = statuses.find(s => s.type === 'dexterity');
  if (dexterity) {
    block += dexterity.stacks;
  }

  // 衰弱デバフ
  const frail = statuses.find(s => s.type === 'frail');
  if (frail) {
    block = Math.floor(block * 0.75);
  }

  return Math.max(0, block);
};

// 敵にダメージを与える
export const damageEnemy = (
  enemy: Enemy,
  damage: number,
  playerStatuses: StatusEffect[]
): { enemy: Enemy; actualDamage: number; killed: boolean } => {
  const actualDamage = calculateDamage(damage, playerStatuses, enemy.statuses);

  let remainingDamage = actualDamage;
  let newBlock = enemy.block;

  // ブロックで軽減
  if (newBlock > 0) {
    if (remainingDamage >= newBlock) {
      remainingDamage -= newBlock;
      newBlock = 0;
    } else {
      newBlock -= remainingDamage;
      remainingDamage = 0;
    }
  }

  const newHp = Math.max(0, enemy.hp - remainingDamage);
  const killed = newHp === 0;

  return {
    enemy: {
      ...enemy,
      hp: newHp,
      block: newBlock,
    },
    actualDamage: remainingDamage,
    killed,
  };
};

// プレイヤーにダメージを与える
export const damagePlayer = (
  currentHp: number,
  currentBlock: number,
  damage: number,
  playerStatuses: StatusEffect[],
  enemyStatuses: StatusEffect[]
): { hp: number; block: number; actualDamage: number } => {
  const actualDamage = calculateDamage(damage, enemyStatuses, playerStatuses);

  let remainingDamage = actualDamage;
  let newBlock = currentBlock;

  // ブロックで軽減
  if (newBlock > 0) {
    if (remainingDamage >= newBlock) {
      remainingDamage -= newBlock;
      newBlock = 0;
    } else {
      newBlock -= remainingDamage;
      remainingDamage = 0;
    }
  }

  return {
    hp: Math.max(0, currentHp - remainingDamage),
    block: newBlock,
    actualDamage: remainingDamage,
  };
};

// ターン終了処理
export const endTurn = (battleState: BattleState): BattleState => {
  // ステータス効果の持続時間を減らす
  const updateStatuses = (statuses: StatusEffect[]): StatusEffect[] => {
    return statuses
      .map(s => {
        if (s.duration !== undefined) {
          return { ...s, duration: s.duration - 1 };
        }
        return s;
      })
      .filter(s => s.duration === undefined || s.duration > 0);
  };

  // 毒ダメージなどの処理
  // TODO: 実装

  return {
    ...battleState,
    playerStatuses: updateStatuses(battleState.playerStatuses),
    enemies: battleState.enemies.map(e => ({
      ...e,
      statuses: updateStatuses(e.statuses),
    })),
    isPlayerTurn: false,
  };
};

// 敵のターン処理
export const processEnemyTurn = (
  battleState: BattleState,
  currentHp: number,
  currentBlock: number
): {
  battleState: BattleState;
  hp: number;
  block: number;
  damages: number[];
} => {
  let newHp = currentHp;
  let newBlock = currentBlock; // ブロックを引き継ぐ（敵の攻撃を防ぐ）
  const damages: number[] = [];

  const newEnemies = battleState.enemies.map(enemy => {
    if (enemy.hp <= 0) return enemy;

    // 敵の行動を実行
    switch (enemy.intent.type) {
      case 'attack':
        const damageResult = damagePlayer(
          newHp,
          newBlock,
          enemy.intent.value || 0,
          battleState.playerStatuses,
          enemy.statuses
        );
        newHp = damageResult.hp;
        newBlock = damageResult.block;
        damages.push(damageResult.actualDamage);
        break;

      case 'defend':
        return {
          ...enemy,
          block: enemy.block + (enemy.intent.value || 0),
        };

      case 'buff':
        // TODO: バフ実装
        break;

      case 'debuff':
        // TODO: デバフ実装
        break;
    }

    return enemy;
  });

  // 次の行動を決定
  const enemiesWithNewIntent = newEnemies.map(enemy => ({
    ...enemy,
    intent: selectNextIntent(enemy),
  }));

  return {
    battleState: {
      ...battleState,
      enemies: enemiesWithNewIntent,
      turn: battleState.turn + 1,
      playerBlock: 0, // ブロックリセット
      isPlayerTurn: true,
    },
    hp: newHp,
    block: newBlock,
    damages,
  };
};

// 戦闘勝利判定
export const isBattleWon = (battleState: BattleState): boolean => {
  return battleState.enemies.every(e => e.hp <= 0);
};

// 戦闘敗北判定
export const isBattleLost = (hp: number): boolean => {
  return hp <= 0;
};

// 次の階へ進む
export const advanceFloor = async (_runState: RunState): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const currentNode = latestState.map.find(n => n.id === latestState.currentNodeId);
  if (!currentNode) return latestState;

  // 現在のノードを完了にする
  const updatedMap = latestState.map.map(n =>
    n.id === currentNode.id ? { ...n, completed: true } : n
  );

  // 次のノードへ
  const nextNodeId = currentNode.connections[0];

  const newState: RunState = {
    ...latestState,
    floor: latestState.floor + 1,
    map: updatedMap,
    currentNodeId: nextNodeId || null,
  };

  await saveRunState(newState);
  return newState;
};

// カードを追加
export const addCardToDeck = async (
  _runState: RunState,
  card: Card
): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const newState: RunState = {
    ...latestState,
    deck: [...latestState.deck, createCardInstance(card)],
  };
  await saveRunState(newState);
  return newState;
};

// カードを削除
export const removeCardFromDeck = async (
  runState: RunState,
  cardInstanceId: string
): Promise<RunState> => {
  const newState: RunState = {
    ...runState,
    deck: runState.deck.filter(c => c.instanceId !== cardInstanceId),
  };
  await saveRunState(newState);
  return newState;
};

// レリックを追加
export const addRelic = async (
  _runState: RunState,
  relic: Relic
): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  // レリックの即時効果を適用
  let newMaxHp = latestState.maxHp;
  let newMaxEnergy = latestState.maxEnergy;

  for (const effect of relic.effects) {
    if (effect.condition === 'max_hp_increase') {
      newMaxHp += effect.value;
    }
    if (effect.condition === 'max_energy_increase') {
      newMaxEnergy += effect.value;
    }
  }

  const newState: RunState = {
    ...latestState,
    relics: [...latestState.relics, relic],
    maxHp: newMaxHp,
    hp: Math.min(latestState.hp + (newMaxHp - latestState.maxHp), newMaxHp),
    maxEnergy: newMaxEnergy,
  };
  await saveRunState(newState);
  return newState;
};

// ゴールドを追加/減少
export const updateGold = async (
  _runState: RunState,
  amount: number
): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const newState: RunState = {
    ...latestState,
    gold: Math.max(0, latestState.gold + amount),
  };
  await saveRunState(newState);
  return newState;
};

// HPを回復
export const healPlayer = async (
  _runState: RunState,
  amount: number
): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const newState: RunState = {
    ...latestState,
    hp: Math.min(latestState.maxHp, latestState.hp + amount),
  };
  await saveRunState(newState);
  return newState;
};

// カードを強化
export const upgradeCardInDeck = async (
  _runState: RunState,
  cardInstanceId: string
): Promise<RunState> => {
  // 最新のstateを読み込んで競合を防ぐ
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  // 対象カードを探す
  const targetIndex = latestState.deck.findIndex(c => c.instanceId === cardInstanceId);
  if (targetIndex === -1) return latestState;

  const targetCard = latestState.deck[targetIndex];

  // 既に強化済みならそのまま返す
  if (targetCard.card.upgraded) return latestState;

  // カードを強化
  const upgradedCard = upgradeCard(targetCard.card);

  // デッキを更新
  const newDeck = [...latestState.deck];
  newDeck[targetIndex] = {
    ...targetCard,
    card: upgradedCard,
  };

  const newState: RunState = {
    ...latestState,
    deck: newDeck,
  };
  await saveRunState(newState);
  return newState;
};

// ストックカードを設定
export const setStockCard = async (
  _runState: RunState,
  card: Card
): Promise<RunState> => {
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const newState: RunState = {
    ...latestState,
    stockCard: card,
  };
  await saveRunState(newState);
  return newState;
};

// ストックカードを使用（クリア）
export const useStockCard = async (
  _runState: RunState
): Promise<RunState> => {
  const latestState = await loadRunState();
  if (!latestState) return _runState;

  const newState: RunState = {
    ...latestState,
    stockCard: null,
  };
  await saveRunState(newState);
  return newState;
};

// ラン終了処理
export const endRun = async (
  runState: RunState,
  victory: boolean
): Promise<{
  floor: number;
  victory: boolean;
  goldEarned: number;
  cardsCollected: number;
  relicsCollected: number;
  duration: number;
}> => {
  const duration = Date.now() - runState.startedAt;

  await clearRunState();

  return {
    floor: runState.floor,
    victory,
    goldEarned: runState.gold,
    cardsCollected: runState.deck.length - GAME_CONFIG.STARTING_DECK_SIZE,
    relicsCollected: runState.relics.length,
    duration,
  };
};
