// コンボ判定ロジック
// 同じターン内で使用されたカードを追跡し、コンボを検出

import { Card, CardInstance } from '../types/game';
import { ComboDefinition, ComboResult, ComboCardInfo } from '../types/tags';
import { combos } from '../data/combos';
import { getRelationBetween, hasRelation } from '../data/relations';
import { getAuthorById, getAuthorSchools } from '../data/authors';

// ターン内で使用されたカードを追跡
export interface TurnCardTracker {
  usedCards: ComboCardInfo[];
  triggeredCombos: Set<string>;  // 発動済みコンボID（同じコンボの重複発動を防ぐ）
}

// 新しいターントラッカーを作成
export const createTurnTracker = (): TurnCardTracker => ({
  usedCards: [],
  triggeredCombos: new Set(),
});

// カードをトラッカーに追加
export const trackCard = (
  tracker: TurnCardTracker,
  card: Card,
  instanceId: string
): TurnCardTracker => {
  const cardInfo: ComboCardInfo = {
    instanceId,
    authorId: card.tags?.authorId,
    category: card.tags?.category || 'concept',
    workTitle: card.tags?.workTitle,
    schools: card.tags?.authorId ? getAuthorSchools(card.tags.authorId) : [],
  };

  return {
    ...tracker,
    usedCards: [...tracker.usedCards, cardInfo],
  };
};

// コンボを検出
export const detectCombos = (tracker: TurnCardTracker): ComboResult[] => {
  const results: ComboResult[] = [];
  const usedCards = tracker.usedCards;

  // カードが2枚未満ならコンボなし
  if (usedCards.length < 2) return results;

  // 各コンボ定義をチェック
  for (const combo of combos) {
    // 既に発動済みならスキップ
    if (tracker.triggeredCombos.has(combo.id)) continue;

    const matchResult = checkComboCondition(combo, usedCards);
    if (matchResult.matched) {
      results.push({
        combo,
        triggeredBy: matchResult.triggeringCards,
        appliedEffects: combo.effects.map(effect => ({
          effect,
          actualValue: effect.value,  // 後で実際の値を計算
        })),
      });
    }
  }

  return results;
};

// コンボ条件をチェック
interface ConditionMatchResult {
  matched: boolean;
  triggeringCards: string[];
}

const checkComboCondition = (
  combo: ComboDefinition,
  usedCards: ComboCardInfo[]
): ConditionMatchResult => {
  const condition = combo.condition;
  const minCards = condition.minCards;

  // 著者コンボ（同一著者）
  if (condition.authorId && !condition.relationType) {
    const matchingCards = usedCards.filter(c => c.authorId === condition.authorId);
    if (matchingCards.length >= minCards) {
      return {
        matched: true,
        triggeringCards: matchingCards.slice(0, minCards).map(c => c.instanceId),
      };
    }
  }

  // 著者リストからのコンボ（複数著者のいずれか）
  if (condition.authorIds && !condition.relationType) {
    const matchingCards = usedCards.filter(c =>
      c.authorId && condition.authorIds!.includes(c.authorId)
    );
    if (matchingCards.length >= minCards) {
      // 異なる著者のカードが含まれているかチェック
      const uniqueAuthors = new Set(matchingCards.map(c => c.authorId));
      if (uniqueAuthors.size >= Math.min(2, condition.authorIds.length)) {
        return {
          matched: true,
          triggeringCards: matchingCards.slice(0, minCards).map(c => c.instanceId),
        };
      }
    }
  }

  // 師弟コンボ
  if (condition.relationType === 'master_student') {
    const cardsWithAuthors = usedCards.filter(c => c.authorId);
    for (let i = 0; i < cardsWithAuthors.length; i++) {
      for (let j = i + 1; j < cardsWithAuthors.length; j++) {
        const card1 = cardsWithAuthors[i];
        const card2 = cardsWithAuthors[j];

        // 特定の著者リストが指定されている場合
        if (condition.authorIds) {
          if (!condition.authorIds.includes(card1.authorId!) ||
              !condition.authorIds.includes(card2.authorId!)) {
            continue;
          }
        }

        const relation = getRelationBetween(card1.authorId!, card2.authorId!);
        if (relation?.type === 'master_student') {
          return {
            matched: true,
            triggeringCards: [card1.instanceId, card2.instanceId],
          };
        }
      }
    }
  }

  // 対立コンボ
  if (condition.relationType === 'opposition') {
    const cardsWithAuthors = usedCards.filter(c => c.authorId);
    for (let i = 0; i < cardsWithAuthors.length; i++) {
      for (let j = i + 1; j < cardsWithAuthors.length; j++) {
        const card1 = cardsWithAuthors[i];
        const card2 = cardsWithAuthors[j];

        // 特定の著者リストが指定されている場合
        if (condition.authorIds) {
          if (!condition.authorIds.includes(card1.authorId!) ||
              !condition.authorIds.includes(card2.authorId!)) {
            continue;
          }
        }

        const relation = getRelationBetween(card1.authorId!, card2.authorId!);
        if (relation?.type === 'opposition') {
          return {
            matched: true,
            triggeringCards: [card1.instanceId, card2.instanceId],
          };
        }
      }
    }
  }

  // 流派コンボ
  if (condition.school) {
    const matchingCards = usedCards.filter(c =>
      c.schools?.includes(condition.school!)
    );

    // 特定の著者リストが指定されている場合
    if (condition.authorIds) {
      const authorMatchingCards = matchingCards.filter(c =>
        c.authorId && condition.authorIds!.includes(c.authorId)
      );
      if (authorMatchingCards.length >= minCards) {
        const uniqueAuthors = new Set(authorMatchingCards.map(c => c.authorId));
        if (uniqueAuthors.size >= 2) {
          return {
            matched: true,
            triggeringCards: authorMatchingCards.slice(0, minCards).map(c => c.instanceId),
          };
        }
      }
    } else {
      if (matchingCards.length >= minCards) {
        const uniqueAuthors = new Set(matchingCards.map(c => c.authorId));
        if (uniqueAuthors.size >= 2) {
          return {
            matched: true,
            triggeringCards: matchingCards.slice(0, minCards).map(c => c.instanceId),
          };
        }
      }
    }
  }

  return { matched: false, triggeringCards: [] };
};

// コンボをマーク済みにする
export const markComboTriggered = (
  tracker: TurnCardTracker,
  comboId: string
): TurnCardTracker => ({
  ...tracker,
  triggeredCombos: new Set([...tracker.triggeredCombos, comboId]),
});

// ターン終了時にトラッカーをリセット
export const resetTurnTracker = (): TurnCardTracker => createTurnTracker();

// 新しくカードを追加した後、発動可能なコンボをチェック
export const checkForNewCombos = (
  tracker: TurnCardTracker,
  newCard: Card,
  instanceId: string
): { tracker: TurnCardTracker; newCombos: ComboResult[] } => {
  // カードを追加
  const updatedTracker = trackCard(tracker, newCard, instanceId);

  // コンボをチェック
  const detectedCombos = detectCombos(updatedTracker);

  // 新しく発動したコンボのIDをマーク
  let finalTracker = updatedTracker;
  for (const combo of detectedCombos) {
    finalTracker = markComboTriggered(finalTracker, combo.combo.id);
  }

  return {
    tracker: finalTracker,
    newCombos: detectedCombos,
  };
};

// ストックカードも含めてコンボをチェック
export const checkCombosWithStock = (
  tracker: TurnCardTracker,
  stockCards: Card[],
  newCard: Card,
  instanceId: string
): { tracker: TurnCardTracker; newCombos: ComboResult[] } => {
  // まず新しいカードを追加
  let updatedTracker = trackCard(tracker, newCard, instanceId);

  // ストックカードも一時的に追加してコンボチェック
  // ストックカードはinstanceIdがないので一時的なIDを付与
  const stockCardInfos: ComboCardInfo[] = stockCards.map((card, index) => ({
    instanceId: `stock_${index}_${card.id}`,
    authorId: card.tags?.authorId,
    category: card.tags?.category || 'concept',
    workTitle: card.tags?.workTitle,
    schools: card.tags?.authorId ? getAuthorSchools(card.tags.authorId) : [],
  }));

  // ストックカードを含めた全カードでコンボ検出
  const allCards = [...updatedTracker.usedCards, ...stockCardInfos];
  const tempTracker: TurnCardTracker = {
    usedCards: allCards,
    triggeredCombos: updatedTracker.triggeredCombos,
  };

  const detectedCombos = detectCombos(tempTracker);

  // 新しく発動したコンボのIDをマーク
  for (const combo of detectedCombos) {
    updatedTracker = markComboTriggered(updatedTracker, combo.combo.id);
  }

  return {
    tracker: updatedTracker,
    newCombos: detectedCombos,
  };
};
