// カード効果処理
// カードの使用時に発動する効果を処理

import {
  Card,
  CardEffect,
  Enemy,
  StatusEffect,
  BattleState,
  Relic,
} from '../types/game';
import { calculateDamage, calculateBlock, damageEnemy } from '../store/runStore';

// カード使用結果
export interface CardPlayResult {
  enemies: Enemy[];
  playerBlock: number;
  playerStatuses: StatusEffect[];
  cardsDrawn: number;
  energyGained: number;
  healAmount: number;
  damageDealt: number[];
  enemiesKilled: number[];
  selfDamage: number;         // HPコストによる自傷ダメージ
  conditionMet: boolean;      // 条件達成フラグ
}

// 条件が満たされているかチェック
export const checkPlayCondition = (
  condition: string | undefined,
  playerHp: number,
  playerMaxHp: number,
  playerBlock: number,
  playerStatuses: StatusEffect[]
): boolean => {
  if (!condition) return false;

  const hpPercent = playerHp / playerMaxHp;

  switch (condition) {
    case 'hp_below_50':
      return hpPercent <= 0.5;
    case 'hp_above_50':
      return hpPercent > 0.5;
    case 'low_hp':
      return hpPercent <= 0.3;
    case 'no_block':
      return playerBlock === 0;
    case 'has_status':
      return playerStatuses.length > 0;
    default:
      return false;
  }
};

// ランダム値を計算
const getRandomValue = (effect: CardEffect): number => {
  if (effect.randomRange) {
    const [min, max] = effect.randomRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return effect.value;
};

// カードを使用
export const playCardEffects = (
  card: Card,
  battleState: BattleState,
  targetEnemyIndex: number = 0,
  relics: Relic[] = [],
  playerHp: number = 100,
  playerMaxHp: number = 100
): CardPlayResult => {
  let enemies = [...battleState.enemies];
  let playerBlock = battleState.playerBlock;
  let playerStatuses = [...battleState.playerStatuses];
  let cardsDrawn = 0;
  let energyGained = 0;
  let healAmount = 0;
  let selfDamage = 0;
  const damageDealt: number[] = [];
  const enemiesKilled: number[] = [];

  // 条件チェック
  const conditionMet = checkPlayCondition(
    card.playCondition,
    playerHp,
    playerMaxHp,
    playerBlock,
    playerStatuses
  );

  // 条件達成時のボーナス倍率
  const bonusMultiplier = conditionMet && card.conditionBonus ? card.conditionBonus : 1;

  // レリック効果を適用（カード使用時）
  for (const relic of relics) {
    for (const effect of relic.effects) {
      if (effect.trigger === 'on_card_play') {
        if (effect.condition === 'attack_card' && card.type === 'attack') {
          // 攻撃カード使用時の追加ダメージ
          const bonusDamage = effect.value;
          if (enemies[targetEnemyIndex] && enemies[targetEnemyIndex].hp > 0) {
            const result = damageEnemy(
              enemies[targetEnemyIndex],
              bonusDamage,
              playerStatuses
            );
            enemies[targetEnemyIndex] = result.enemy;
            damageDealt.push(result.actualDamage);
            if (result.killed) {
              enemiesKilled.push(targetEnemyIndex);
            }
          }
        }
        if (effect.condition === 'defense_card' && card.type === 'defense') {
          // 防御カード使用時の追加ブロック
          playerBlock += calculateBlock(effect.value, playerStatuses);
        }
        if (effect.condition === 'skill_card' && card.type === 'skill') {
          // スキルカード使用時のドロー
          cardsDrawn += effect.value;
        }
        if (effect.condition === 'cost_0' && card.cost === 0) {
          // コスト0カード使用時
          if (effect.effectType === 'damage' && enemies[targetEnemyIndex]) {
            const result = damageEnemy(
              enemies[targetEnemyIndex],
              effect.value,
              playerStatuses
            );
            enemies[targetEnemyIndex] = result.enemy;
            damageDealt.push(result.actualDamage);
          }
        }
      }
    }
  }

  // カード効果を処理
  for (const effect of card.effects) {
    // ランダム値またはボーナス適用後の値を計算
    const baseValue = getRandomValue(effect);
    const effectValue = Math.floor(baseValue * bonusMultiplier);

    switch (effect.type) {
      case 'damage':
        if (effect.target === 'all_enemies') {
          // 全体攻撃
          enemies = enemies.map((enemy, index) => {
            if (enemy.hp <= 0) return enemy;
            const result = damageEnemy(enemy, effectValue, playerStatuses);
            damageDealt.push(result.actualDamage);
            if (result.killed) {
              enemiesKilled.push(index);
            }
            return result.enemy;
          });
        } else {
          // 単体攻撃
          if (enemies[targetEnemyIndex] && enemies[targetEnemyIndex].hp > 0) {
            const result = damageEnemy(
              enemies[targetEnemyIndex],
              effectValue,
              playerStatuses
            );
            enemies[targetEnemyIndex] = result.enemy;
            damageDealt.push(result.actualDamage);
            if (result.killed) {
              enemiesKilled.push(targetEnemyIndex);
            }
          }
        }
        break;

      case 'block':
        playerBlock += calculateBlock(effectValue, playerStatuses);
        break;

      case 'draw':
        cardsDrawn += effectValue;
        break;

      case 'energy':
        energyGained += effectValue;
        break;

      case 'heal':
        healAmount += effectValue;
        break;

      case 'self_damage':
        // HPコスト（自傷ダメージ）
        selfDamage += effectValue;
        break;

      case 'buff':
        if (effect.statusType) {
          const existingIndex = playerStatuses.findIndex(
            s => s.type === effect.statusType
          );
          if (existingIndex >= 0) {
            // スタック追加
            playerStatuses[existingIndex] = {
              ...playerStatuses[existingIndex],
              stacks: playerStatuses[existingIndex].stacks + effect.value,
            };
          } else {
            // 新規バフ
            playerStatuses.push({
              type: effect.statusType,
              stacks: effect.value,
              duration: effect.statusDuration,
            });
          }
        }
        break;

      case 'debuff':
        if (effect.statusType) {
          if (effect.target === 'self') {
            // 自己デバフ（ハイリスク系カード）
            const existingIndex = playerStatuses.findIndex(
              s => s.type === effect.statusType
            );
            if (existingIndex >= 0) {
              playerStatuses[existingIndex] = {
                ...playerStatuses[existingIndex],
                stacks: playerStatuses[existingIndex].stacks + effect.value,
              };
            } else {
              playerStatuses.push({
                type: effect.statusType,
                stacks: effect.value,
                duration: effect.statusDuration,
              });
            }
          } else if (effect.target === 'all_enemies') {
            // 全体デバフ
            enemies = enemies.map(enemy => {
              if (enemy.hp <= 0) return enemy;
              const existingIndex = enemy.statuses.findIndex(
                s => s.type === effect.statusType
              );
              if (existingIndex >= 0) {
                const newStatuses = [...enemy.statuses];
                newStatuses[existingIndex] = {
                  ...newStatuses[existingIndex],
                  stacks: newStatuses[existingIndex].stacks + effect.value,
                };
                return { ...enemy, statuses: newStatuses };
              } else {
                return {
                  ...enemy,
                  statuses: [
                    ...enemy.statuses,
                    {
                      type: effect.statusType!,
                      stacks: effect.value,
                      duration: effect.statusDuration,
                    },
                  ],
                };
              }
            });
          } else {
            // 単体デバフ
            if (enemies[targetEnemyIndex] && enemies[targetEnemyIndex].hp > 0) {
              const enemy = enemies[targetEnemyIndex];
              const existingIndex = enemy.statuses.findIndex(
                s => s.type === effect.statusType
              );
              if (existingIndex >= 0) {
                const newStatuses = [...enemy.statuses];
                newStatuses[existingIndex] = {
                  ...newStatuses[existingIndex],
                  stacks: newStatuses[existingIndex].stacks + effect.value,
                };
                enemies[targetEnemyIndex] = { ...enemy, statuses: newStatuses };
              } else {
                enemies[targetEnemyIndex] = {
                  ...enemy,
                  statuses: [
                    ...enemy.statuses,
                    {
                      type: effect.statusType,
                      stacks: effect.value,
                      duration: effect.statusDuration,
                    },
                  ],
                };
              }
            }
          }
        }
        break;
    }
  }

  return {
    enemies,
    playerBlock,
    playerStatuses,
    cardsDrawn,
    energyGained,
    healAmount,
    damageDealt,
    enemiesKilled,
    selfDamage,
    conditionMet,
  };
};

// カードが使用可能かチェック
export const canPlayCard = (
  card: Card,
  currentEnergy: number,
  enemies: Enemy[],
  playerHp: number = 100
): boolean => {
  // エネルギー不足
  if (card.cost > currentEnergy) {
    return false;
  }

  // 攻撃カードは生存敵が必要
  if (card.type === 'attack') {
    const hasAliveEnemy = enemies.some(e => e.hp > 0);
    if (!hasAliveEnemy) {
      return false;
    }
  }

  // HPコストカードはHP消費で死なないかチェック
  const selfDamageEffect = card.effects.find(e => e.type === 'self_damage');
  if (selfDamageEffect) {
    // ランダム範囲がある場合は最大値でチェック
    const maxSelfDamage = selfDamageEffect.randomRange
      ? selfDamageEffect.randomRange[1]
      : selfDamageEffect.value;
    if (playerHp <= maxSelfDamage) {
      return false;
    }
  }

  return true;
};

// カードの説明を生成（効果値込み）
export const getCardDescription = (
  card: Card,
  playerStatuses: StatusEffect[] = []
): string => {
  const descriptions: string[] = [];

  // ギャンブルカードはランダム範囲を表示
  const isGamble = (card as any).isGamble;

  // 同じタイプの効果をカウント（連撃対応）
  const effectCounts: Record<string, { count: number; value: number; target?: string }> = {};

  for (const effect of card.effects) {
    // ランダム範囲がある場合（ギャンブルカード）
    const randomRange = (effect as any).randomRange;

    switch (effect.type) {
      case 'damage':
        if (randomRange) {
          // ギャンブル: ランダム範囲を表示
          const prefix = effect.target === 'all_enemies' ? '全体' : '';
          descriptions.push(`🎲${prefix}${randomRange[0]}〜${randomRange[1]}ダメージ`);
        } else {
          const damage = calculateDamage(effect.value, playerStatuses, []);
          const key = `damage_${effect.target}`;
          if (effectCounts[key] && effectCounts[key].value === damage) {
            effectCounts[key].count++;
          } else if (!effectCounts[key]) {
            effectCounts[key] = { count: 1, value: damage, target: effect.target };
          } else {
            // 異なる値のダメージは別々に表示
            if (effect.target === 'all_enemies') {
              descriptions.push(`全体${damage}ダメージ`);
            } else {
              descriptions.push(`${damage}ダメージ`);
            }
          }
        }
        break;
      case 'block':
        if (randomRange) {
          descriptions.push(`🎲${randomRange[0]}〜${randomRange[1]}ブロック`);
        } else {
          const block = calculateBlock(effect.value, playerStatuses);
          descriptions.push(`${block}ブロック`);
        }
        break;
      case 'draw':
        if (randomRange) {
          descriptions.push(`🎲${randomRange[0]}〜${randomRange[1]}枚ドロー`);
        } else {
          descriptions.push(`${effect.value}枚ドロー`);
        }
        break;
      case 'energy':
        if (randomRange) {
          descriptions.push(`🎲${randomRange[0]}〜${randomRange[1]}エネルギー`);
        } else {
          descriptions.push(`${effect.value}エネルギー獲得`);
        }
        break;
      case 'heal':
        if (randomRange) {
          descriptions.push(`🎲${randomRange[0]}〜${randomRange[1]}回復`);
        } else {
          descriptions.push(`${effect.value}回復`);
        }
        break;
      case 'self_damage':
        // HPコスト
        if (randomRange) {
          descriptions.push(`⚠️HP${randomRange[0]}〜${randomRange[1]}消費`);
        } else {
          descriptions.push(`⚠️HP${effect.value}消費`);
        }
        break;
      case 'buff':
        const buffName = getStatusName(effect.statusType!);
        descriptions.push(`${buffName}+${effect.value}`);
        break;
      case 'debuff':
        const debuffName = getStatusName(effect.statusType!);
        const target = effect.target === 'all_enemies' ? '全体' : '敵';
        descriptions.push(`${target}${debuffName}+${effect.value}`);
        break;
    }
  }

  // 連撃などの同一ダメージをまとめて表示
  for (const [key, data] of Object.entries(effectCounts)) {
    if (key.startsWith('damage_')) {
      const prefix = data.target === 'all_enemies' ? '全体' : '';
      if (data.count > 1) {
        descriptions.unshift(`${prefix}${data.value}x${data.count}ダメージ`);
      } else {
        descriptions.unshift(`${prefix}${data.value}ダメージ`);
      }
    }
  }

  // 条件付きカードの条件表示
  const playCondition = (card as any).playCondition;
  const conditionBonus = (card as any).conditionBonus;
  if (playCondition && conditionBonus) {
    let conditionText = '';
    switch (playCondition) {
      case 'hp_below_50':
        conditionText = 'HP50%以下で効果2倍';
        break;
      case 'hp_above_50':
        conditionText = 'HP50%以上で効果2倍';
        break;
      case 'low_hp':
        conditionText = 'HP30%以下で効果UP';
        break;
      default:
        conditionText = '条件達成で効果UP';
    }
    descriptions.push(`💡${conditionText}`);
  }

  return descriptions.join('。');
};

// ステータス名を取得
export const getStatusName = (statusType: string): string => {
  switch (statusType) {
    case 'strength':
      return '闘志';
    case 'dexterity':
      return '克己';
    case 'vulnerable':
      return '不安';
    case 'weak':
      return '躊躇';
    case 'frail':
      return '倦怠';
    case 'poison':
      return '苦悩';
    case 'regeneration':
      return '調和';
    default:
      return statusType;
  }
};

// ステータスの説明を取得
export const getStatusDescription = (statusType: string): string => {
  switch (statusType) {
    case 'strength':
      return '攻撃ダメージ+N';
    case 'dexterity':
      return 'ブロック+N';
    case 'vulnerable':
      return '被ダメージ50%増加';
    case 'weak':
      return '与ダメージ25%減少';
    case 'frail':
      return 'ブロック25%減少';
    case 'poison':
      return '毎ターン終了時ダメージ';
    case 'regeneration':
      return '毎ターン開始時回復';
    default:
      return '';
  }
};

// 敵の行動を説明
export const getIntentDescription = (intent: { type: string; value?: number }): string => {
  switch (intent.type) {
    case 'attack':
      return `${intent.value || 0}ダメージ`;
    case 'defend':
      return `${intent.value || 0}ブロック`;
    case 'buff':
      return '強化';
    case 'debuff':
      return 'デバフ付与';
    case 'unknown':
      return '???';
    default:
      return '???';
  }
};

// カードタイプの色を取得
export const getCardTypeColor = (type: string): string => {
  switch (type) {
    case 'attack':
      return '#E74C3C';
    case 'defense':
      return '#3498DB';
    case 'skill':
      return '#2ECC71';
    default:
      return '#95A5A6';
  }
};

// カードタイプの名前を取得
export const getCardTypeName = (type: string): string => {
  switch (type) {
    case 'attack':
      return '攻撃';
    case 'defense':
      return '防御';
    case 'skill':
      return 'スキル';
    default:
      return '不明';
  }
};
