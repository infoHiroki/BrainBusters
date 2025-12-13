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
}

// カードを使用
export const playCardEffects = (
  card: Card,
  battleState: BattleState,
  targetEnemyIndex: number = 0,
  relics: Relic[] = []
): CardPlayResult => {
  let enemies = [...battleState.enemies];
  let playerBlock = battleState.playerBlock;
  let playerStatuses = [...battleState.playerStatuses];
  let cardsDrawn = 0;
  let energyGained = 0;
  let healAmount = 0;
  const damageDealt: number[] = [];
  const enemiesKilled: number[] = [];

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
    switch (effect.type) {
      case 'damage':
        if (effect.target === 'all_enemies') {
          // 全体攻撃
          enemies = enemies.map((enemy, index) => {
            if (enemy.hp <= 0) return enemy;
            const result = damageEnemy(enemy, effect.value, playerStatuses);
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
              effect.value,
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
        playerBlock += calculateBlock(effect.value, playerStatuses);
        break;

      case 'draw':
        cardsDrawn += effect.value;
        break;

      case 'energy':
        energyGained += effect.value;
        break;

      case 'heal':
        healAmount += effect.value;
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
  };
};

// カードが使用可能かチェック
export const canPlayCard = (
  card: Card,
  currentEnergy: number,
  enemies: Enemy[]
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

  return true;
};

// カードの説明を生成（効果値込み）
export const getCardDescription = (
  card: Card,
  playerStatuses: StatusEffect[] = []
): string => {
  const descriptions: string[] = [];

  for (const effect of card.effects) {
    switch (effect.type) {
      case 'damage':
        const damage = calculateDamage(effect.value, playerStatuses, []);
        if (effect.target === 'all_enemies') {
          descriptions.push(`全ての敵に${damage}ダメージ`);
        } else {
          descriptions.push(`${damage}ダメージ`);
        }
        break;
      case 'block':
        const block = calculateBlock(effect.value, playerStatuses);
        descriptions.push(`${block}ブロック`);
        break;
      case 'draw':
        descriptions.push(`${effect.value}枚ドロー`);
        break;
      case 'energy':
        descriptions.push(`${effect.value}エネルギー獲得`);
        break;
      case 'heal':
        descriptions.push(`${effect.value}回復`);
        break;
      case 'buff':
        const buffName = getStatusName(effect.statusType!);
        descriptions.push(`${buffName}を${effect.value}獲得`);
        break;
      case 'debuff':
        const debuffName = getStatusName(effect.statusType!);
        const target = effect.target === 'all_enemies' ? '全ての敵に' : '敵に';
        descriptions.push(`${target}${debuffName}を${effect.value}付与`);
        break;
    }
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
