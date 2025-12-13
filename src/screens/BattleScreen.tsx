// バトル画面
// Slay the Spire風のターン制バトル

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, BattleState, CardInstance, Enemy, Card, StatusEffect } from '../types/game';
import { BattleCard } from '../components/BattleCard';
import { EnemyDisplay } from '../components/EnemyDisplay';
import {
  initBattleState,
  shuffleDeck,
  drawCards,
  playCard,
  processEnemyTurn,
  isBattleWon,
  isBattleLost,
  useStockCard,
} from '../store/runStore';
import { playCardEffects, canPlayCard } from '../utils/cardEffects';
import { GAME_CONFIG } from '../types/game';
import { playSound, playVictoryFanfare, initializeSound } from '../utils/sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// カードサイズ（通常サイズ：150x215）
const CARD_WIDTH = 150;
const CARD_HEIGHT = 215;

// フローティングダメージ表示用のコンポーネント
interface FloatingNumber {
  id: string;
  value: number;
  type: 'damage' | 'block' | 'heal';
  x: number;
  y: number;
}

const FloatingDamage: React.FC<{ number: FloatingNumber; onComplete: () => void }> = ({ number, onComplete }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 2500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -80, duration: 2500, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(onComplete);
  }, []);

  const color = number.type === 'damage' ? '#ff4444' : number.type === 'block' ? '#4a9eff' : '#44ff44';

  return (
    <Animated.View style={[
      styles.floatingNumber,
      { left: number.x, top: number.y, opacity, transform: [{ translateY }, { scale }] }
    ]}>
      <Text style={[styles.floatingNumberText, { color }]}>
        {number.type === 'damage' ? '-' : '+'}{number.value}
      </Text>
    </Animated.View>
  );
};

interface BattleScreenProps {
  runState: RunState;
  onBattleEnd: (victory: boolean, updatedRunState: RunState) => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  runState,
  onBattleEnd,
}) => {
  // バトル状態
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [hand, setHand] = useState<CardInstance[]>([]);
  const [drawPile, setDrawPile] = useState<CardInstance[]>([]);
  const [discardPile, setDiscardPile] = useState<CardInstance[]>([]);
  const [energy, setEnergy] = useState(runState.maxEnergy);
  const [hp, setHp] = useState(runState.hp);
  const [playerBlock, setPlayerBlock] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [targetEnemyIndex, setTargetEnemyIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnPhase, setTurnPhase] = useState<'player' | 'enemy' | 'draw'>('draw');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; opacity: Animated.Value }>>([]);
  const [enemiesKilledThisBattle, setEnemiesKilledThisBattle] = useState<number>(0);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);
  const [usedStockIndices, setUsedStockIndices] = useState<number[]>([]);
  const [currentRunState, setCurrentRunState] = useState<RunState>(runState);
  const [showRelicsPanel, setShowRelicsPanel] = useState(false);

  // アニメーション
  const shakeAnims = useRef<Animated.Value[]>([]).current;

  // 処理中フラグ（同期的に更新）
  const isProcessingRef = useRef(false);

  // バトル初期化
  useEffect(() => {
    const initBattle = () => {
      // バトル状態を初期化
      const newBattleState = initBattleState(runState);
      setBattleState(newBattleState);

      // シェイクアニメーションを初期化
      newBattleState.enemies.forEach(() => {
        shakeAnims.push(new Animated.Value(0));
      });

      // デッキをシャッフル
      const shuffled = shuffleDeck([...runState.deck]);
      setDrawPile(shuffled);
      setDiscardPile([]);
      setHand([]);

      // 最初の手札を引く
      setTimeout(() => {
        drawInitialHand(shuffled);
      }, 500);
    };

    initBattle();
  }, []);

  // 初期手札を引く
  const drawInitialHand = (pile: CardInstance[]) => {
    const result = drawCards(pile, [], [], GAME_CONFIG.STARTING_HAND_SIZE);
    setHand(result.hand);
    setDrawPile(result.drawPile);
    setTurnPhase('player');
  };

  // メッセージを表示（スタック式：複数同時表示可能）
  const showMessage = (msg: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const opacity = new Animated.Value(1);

    setMessages(prev => [...prev, { id, text: msg, opacity }]);

    // 1.5秒後にフェードアウト開始（スタック表示なのでテンポ良く）
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // フェードアウト完了後にメッセージを削除
      setMessages(prev => prev.filter(m => m.id !== id));
    });
  };

  // フローティングダメージを追加（効果音付き）
  const addFloatingNumber = (value: number, type: 'damage' | 'block' | 'heal', x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFloatingNumbers(prev => [...prev, { id, value, type, x, y }]);

    // 効果音を再生
    if (type === 'damage') {
      playSound('attack');
    } else if (type === 'block') {
      playSound('block');
    } else if (type === 'heal') {
      playSound('heal');
    }
  };

  // フローティングダメージを削除
  const removeFloatingNumber = (id: string) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  };

  // カードを選択
  const handleCardSelect = (index: number) => {
    if (isProcessing || turnPhase !== 'player') return;

    const cardInstance = hand[index];
    const card = cardInstance.card;
    if (!battleState) return;

    // 使用可能かチェック
    if (!canPlayCard(card, energy, battleState.enemies)) {
      showMessage('エネルギー不足！');
      return;
    }

    // 同じカードを選択した場合は選択解除
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
      setIsSelectingTarget(false);
      return;
    }

    // 全体攻撃かどうかをチェック
    const isAllEnemiesAttack = card.effects.some(e => e.target === 'all_enemies');

    // 攻撃カードの場合
    const needsTarget = (card.type === 'attack' ||
      card.effects.some(e => e.target === 'enemy')) && !isAllEnemiesAttack;

    if (needsTarget) {
      // 生存している敵をカウント
      const aliveEnemies = battleState.enemies.filter(e => e.hp > 0);

      if (aliveEnemies.length === 1) {
        // 敵が1体のみ → 即攻撃（ターゲット選択不要）
        const targetIndex = battleState.enemies.findIndex(e => e.hp > 0);
        useSelectedCard(index, targetIndex);
      } else {
        // 敵が複数 → ターゲット選択モード
        setSelectedCardIndex(index);
        setIsSelectingTarget(true);
        showMessage('敵を選択してください');
      }
    } else {
      // 防御・スキルカード・全体攻撃は即座に使用
      useSelectedCard(index, 0);
    }
  };

  // 敵を選択（ターゲット）
  const handleEnemySelect = (index: number) => {
    if (!battleState || battleState.enemies[index].hp <= 0) return;

    // カードが選択されていてターゲット選択中の場合
    if (selectedCardIndex !== null && isSelectingTarget) {
      useSelectedCard(selectedCardIndex, index);
    }
  };

  // カード選択をキャンセル
  const cancelCardSelection = () => {
    setSelectedCardIndex(null);
    setIsSelectingTarget(false);
  };

  // ストックカードを使用（インデックス指定）
  const handleUseStockCard = async (stockIndex: number) => {
    if (!battleState || isProcessing || turnPhase !== 'player') return;
    if (usedStockIndices.includes(stockIndex)) return;

    const stockCard = currentRunState.stockCards[stockIndex];
    if (!stockCard) return;

    // 使用可能かチェック
    if (!canPlayCard(stockCard, energy, battleState.enemies)) {
      showMessage('エネルギー不足！');
      return;
    }

    // 攻撃カードでターゲット選択が必要な場合
    const needsTarget = stockCard.type === 'attack' ||
      stockCard.effects.some(e => e.target === 'enemy');

    if (needsTarget) {
      const aliveEnemies = battleState.enemies.filter(e => e.hp > 0);
      if (aliveEnemies.length > 1) {
        // 敵が複数の場合は最初の生存敵をターゲットに
        const targetIndex = battleState.enemies.findIndex(e => e.hp > 0);
        await executeStockCard(stockCard, targetIndex, stockIndex);
      } else {
        const targetIndex = battleState.enemies.findIndex(e => e.hp > 0);
        await executeStockCard(stockCard, targetIndex, stockIndex);
      }
    } else {
      await executeStockCard(stockCard, 0, stockIndex);
    }
  };

  // ストックカードを実行（インデックス指定）
  const executeStockCard = async (card: Card, enemyIndex: number, stockIndex: number) => {
    // 同期的にフラグをチェック（連打防止）
    if (!battleState || isProcessingRef.current) return;
    isProcessingRef.current = true;

    setIsProcessing(true);

    // カード効果を実行
    const result = playCardEffects(
      card,
      { ...battleState, playerBlock },
      enemyIndex,
      currentRunState.relics
    );

    // フローティングダメージを表示
    if (result.damageDealt.length > 0) {
      const totalDamage = result.damageDealt.reduce((a, b) => a + b, 0);
      result.damageDealt.forEach((damage, i) => {
        if (damage > 0) {
          const targetIndex = card.effects.some(e => e.target === 'all_enemies') ? i : enemyIndex;
          const xOffset = SCREEN_WIDTH / 2 + (targetIndex - (battleState.enemies.length - 1) / 2) * 160;
          addFloatingNumber(damage, 'damage', xOffset, SCREEN_HEIGHT * 0.3);
        }
      });
      showMessage(`📦 ${card.name}: ${totalDamage}ダメージ！`);
    }

    // 防御力強化を表示
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      showMessage(`📦 ${card.name}: 防御力+${blockGained}！`);
    }

    // 敵へのダメージアニメーション
    if (result.damageDealt.length > 0) {
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');
      result.enemies.forEach((enemy, i) => {
        const tookDamage = isAllTarget || i === enemyIndex;
        if (tookDamage && enemy.hp >= 0 && shakeAnims[i]) {
          Animated.sequence([
            Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        }
      });
    }

    // 状態を更新
    setEnergy(prev => prev - card.cost + result.energyGained);
    setPlayerBlock(result.playerBlock);
    setBattleState(prev => prev ? {
      ...prev,
      enemies: result.enemies,
      playerStatuses: result.playerStatuses,
    } : null);

    // HP回復
    if (result.healAmount > 0) {
      addFloatingNumber(result.healAmount, 'heal', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      setHp(prev => Math.min(currentRunState.maxHp, prev + result.healAmount));
    }

    // 倒した敵のカウント
    setEnemiesKilledThisBattle(prev => prev + result.enemiesKilled.length);

    // 追加ドロー
    if (result.cardsDrawn > 0) {
      const drawResult = drawCards(drawPile, discardPile, hand, result.cardsDrawn);
      setHand(drawResult.hand);
      setDrawPile(drawResult.drawPile);
      setDiscardPile(drawResult.discardPile);
    }

    // ストックカードを使用済みにする（永続保存）
    const newRunState = await useStockCard(currentRunState, stockIndex);
    setCurrentRunState(newRunState);
    const newUsedStockIndices = [...usedStockIndices, stockIndex];
    setUsedStockIndices(newUsedStockIndices);

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      setTimeout(() => {
        handleBattleEnd(true);
      }, 500);
      setIsProcessing(false);
      isProcessingRef.current = false;
      return;
    }

    setIsProcessing(false);
    isProcessingRef.current = false;

    // 自動ターン終了チェック（ストックカード使用後）
    const newEnergy = energy - card.cost + result.energyGained;
    checkAutoEndTurn(newEnergy, hand, result.enemies, newUsedStockIndices);
  };

  // カードを使用
  const useSelectedCard = async (cardIndex: number, enemyIndex: number = targetEnemyIndex) => {
    // 同期的にフラグをチェック（連打防止）
    if (!battleState || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const cardInstance = hand[cardIndex];
    const card = cardInstance.card;

    // エネルギー消費
    if (card.cost > energy) {
      showMessage('エネルギー不足！');
      isProcessingRef.current = false;
      return;
    }

    setIsProcessing(true);
    setSelectedCardIndex(null);
    setIsSelectingTarget(false);

    // カード使用効果音
    playSound('cardPlay');

    // カード効果を実行
    const result = playCardEffects(
      card,
      { ...battleState, playerBlock },
      enemyIndex,
      runState.relics
    );

    // ステータス効果のボーナスを取得
    const strengthBonus = battleState.playerStatuses.find(s => s.type === 'strength')?.stacks || 0;
    const dexterityBonus = battleState.playerStatuses.find(s => s.type === 'dexterity')?.stacks || 0;

    // フローティングダメージを表示（敵へのダメージ）
    if (result.damageDealt.length > 0) {
      const totalDamage = result.damageDealt.reduce((a, b) => a + b, 0);
      result.damageDealt.forEach((damage, i) => {
        if (damage > 0) {
          // 敵の位置に応じてX座標を調整
          const targetIndex = card.effects.some(e => e.target === 'all_enemies') ? i : enemyIndex;
          const xOffset = SCREEN_WIDTH / 2 + (targetIndex - (battleState.enemies.length - 1) / 2) * 160;
          addFloatingNumber(damage, 'damage', xOffset, SCREEN_HEIGHT * 0.3);
        }
      });

      // 効果を含めたメッセージ
      if (strengthBonus > 0) {
        showMessage(`${card.name}: ${totalDamage}ダメージ (💪+${strengthBonus})`);
      } else {
        showMessage(`${card.name}: ${totalDamage}ダメージ！`);
      }
    }

    // 防御力強化を表示（プレイヤー）
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      // 効果を含めたメッセージ
      if (dexterityBonus > 0) {
        showMessage(`防御力+${blockGained} (🏃+${dexterityBonus})`);
      } else {
        showMessage(`防御力+${blockGained}！`);
      }
    }

    // 敵にダメージを与えた場合のアニメーション（常に揺れる）
    if (result.damageDealt.length > 0) {
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');

      result.enemies.forEach((enemy, i) => {
        // ダメージを受けた敵は揺れる
        const tookDamage = isAllTarget || i === enemyIndex;
        if (tookDamage && enemy.hp >= 0 && shakeAnims[i]) {
          Animated.sequence([
            Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        }
      });
    }

    // 状態を更新
    setEnergy(prev => prev - card.cost + result.energyGained);
    setPlayerBlock(result.playerBlock);
    setBattleState(prev => prev ? {
      ...prev,
      enemies: result.enemies,
      playerStatuses: result.playerStatuses,
    } : null);

    // HP回復
    if (result.healAmount > 0) {
      addFloatingNumber(result.healAmount, 'heal', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      setHp(prev => Math.min(runState.maxHp, prev + result.healAmount));
    }

    // 倒した敵のカウント
    setEnemiesKilledThisBattle(prev => prev + result.enemiesKilled.length);

    // カードを手札から捨て札へ
    const playResult = playCard(hand, discardPile, cardInstance.instanceId);
    setHand(playResult.hand);
    setDiscardPile(playResult.discardPile);

    // 追加ドロー
    let finalHand = playResult.hand;
    if (result.cardsDrawn > 0) {
      const drawResult = drawCards(drawPile, playResult.discardPile, playResult.hand, result.cardsDrawn);
      setHand(drawResult.hand);
      setDrawPile(drawResult.drawPile);
      setDiscardPile(drawResult.discardPile);
      finalHand = drawResult.hand;
    }

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      setTimeout(() => {
        handleBattleEnd(true);
      }, 500);
      setIsProcessing(false);
      isProcessingRef.current = false;
      return;
    }

    setIsProcessing(false);
    isProcessingRef.current = false;

    // 自動ターン終了チェック（カード使用後）- 追加ドロー後の手札でチェック
    const newEnergy = energy - card.cost + result.energyGained;
    checkAutoEndTurn(newEnergy, finalHand, result.enemies);
  };

  // 自動ターン終了チェック
  const checkAutoEndTurn = (
    currentEnergy: number,
    currentHand: CardInstance[],
    enemies: Enemy[],
    currentUsedStockIndices: number[] = usedStockIndices
  ) => {
    // 手札から打てるカードがあるかチェック
    const canPlayHandCard = currentHand.some(cardInst => {
      const card = cardInst.card;
      return card.cost <= currentEnergy && canPlayCard(card, currentEnergy, enemies);
    });

    // ストックから打てるカードがあるかチェック
    const canPlayStockCard = currentRunState.stockCards.some((stockCard, index) => {
      if (currentUsedStockIndices.includes(index)) return false;
      return stockCard.cost <= currentEnergy && canPlayCard(stockCard, currentEnergy, enemies);
    });

    // 手札もストックも打てるカードがなければターン終了
    if (!canPlayHandCard && !canPlayStockCard) {
      setTimeout(() => {
        handleEndTurn();
      }, 800);
    }
  };

  // ターン終了
  const handleEndTurn = () => {
    if (isProcessing || turnPhase !== 'player' || !battleState) return;

    setIsProcessing(true);
    setTurnPhase('enemy');
    setSelectedCardIndex(null);

    showMessage('⚔️ 敵のターン！');

    // 敵を一体ずつ順番に処理
    const aliveEnemies = battleState.enemies.filter(e => e.hp > 0);
    let currentHp = hp;
    let currentBlock = playerBlock;
    let currentPlayerStatuses = [...battleState.playerStatuses];
    let updatedEnemies = [...battleState.enemies];
    let enemyIndex = 0;

    const processNextEnemy = () => {
      if (enemyIndex >= aliveEnemies.length) {
        // 全敵の処理完了 - 次のターンへ
        finishEnemyTurn(currentHp, currentBlock, updatedEnemies, currentPlayerStatuses);
        return;
      }

      const enemy = aliveEnemies[enemyIndex];
      const enemyArrayIndex = battleState.enemies.findIndex(e => e.id === enemy.id);

      setTimeout(() => {
        // この敵の行動を処理
        const actionResult = processOneEnemyAction(
          enemy,
          currentHp,
          currentBlock,
          currentPlayerStatuses
        );

        // 結果を反映
        const prevHp = currentHp;
        currentHp = actionResult.hp;
        currentBlock = actionResult.block;
        currentPlayerStatuses = actionResult.playerStatuses;

        // 敵のステータス更新（バフなど）
        if (actionResult.updatedEnemy) {
          updatedEnemies[enemyArrayIndex] = actionResult.updatedEnemy;
        }

        // ダメージ表示
        const damageTaken = prevHp - currentHp;
        const blocked = actionResult.blocked;

        if (damageTaken > 0 || blocked > 0) {
          if (blocked > 0 && damageTaken > 0) {
            showMessage(`${enemy.name}: 🛡️${blocked}防御 → ${damageTaken}ダメージ！`);
            addFloatingNumber(blocked, 'block', SCREEN_WIDTH / 2 - 30, SCREEN_HEIGHT * 0.65);
            addFloatingNumber(damageTaken, 'damage', SCREEN_WIDTH / 2 + 30, SCREEN_HEIGHT * 0.7);
            playSound('damage');
          } else if (blocked > 0) {
            showMessage(`${enemy.name}: 🛡️${blocked}防御 → 完全防御！`);
            addFloatingNumber(blocked, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
          } else if (damageTaken > 0) {
            showMessage(`${enemy.name}: 💥${damageTaken}ダメージ！`);
            addFloatingNumber(damageTaken, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
            playSound('damage');
          }
        } else if (actionResult.actionType === 'defend') {
          showMessage(`${enemy.name}が防御態勢！`);
        } else if (actionResult.actionType === 'buff') {
          showMessage(`${enemy.name}が自己強化！`);
        } else if (actionResult.actionType === 'debuff') {
          showMessage(`${enemy.name}が躊躇をかけてきた！`);
        } else {
          showMessage(`${enemy.name}は様子を見ている...`);
        }

        // HP更新（リアルタイム表示）
        setHp(currentHp);
        setPlayerBlock(currentBlock);

        // 敗北判定
        if (currentHp <= 0) {
          setTimeout(() => {
            handleBattleEnd(false);
          }, 500);
          return;
        }

        // 次の敵へ
        enemyIndex++;
        processNextEnemy();
      }, 800);
    };

    // 最初の敵の処理を開始
    setTimeout(() => {
      processNextEnemy();
    }, 500);
  };

  // 敵一体の行動を処理
  const processOneEnemyAction = (
    enemy: Enemy,
    currentHp: number,
    currentBlock: number,
    playerStatuses: StatusEffect[]
  ): {
    hp: number;
    block: number;
    blocked: number;
    playerStatuses: StatusEffect[];
    updatedEnemy: Enemy | null;
    actionType: string;
  } => {
    let newHp = currentHp;
    let newBlock = currentBlock;
    let blocked = 0;
    let newPlayerStatuses = [...playerStatuses];
    let updatedEnemy: Enemy | null = null;
    const actionType = enemy.intent.type;

    switch (enemy.intent.type) {
      case 'attack':
        const attackDamage = enemy.intent.value || 0;
        // 敵の筋力バフを適用
        const strengthBuff = enemy.statuses.find(s => s.type === 'strength')?.stacks || 0;
        const totalDamage = attackDamage + strengthBuff;

        // プレイヤーの脆弱を適用
        const isVulnerable = playerStatuses.some(s => s.type === 'vulnerable');
        const finalDamage = isVulnerable ? Math.floor(totalDamage * 1.5) : totalDamage;

        // ブロックで軽減
        blocked = Math.min(newBlock, finalDamage);
        const actualDamage = finalDamage - blocked;
        newBlock = Math.max(0, newBlock - finalDamage);
        newHp = Math.max(0, newHp - actualDamage);
        break;

      case 'defend':
        updatedEnemy = {
          ...enemy,
          block: enemy.block + (enemy.intent.value || 0),
        };
        break;

      case 'buff':
        const buffValue = enemy.intent.value || 2;
        const existingBuff = enemy.statuses.find(s => s.type === 'strength');
        if (existingBuff) {
          updatedEnemy = {
            ...enemy,
            statuses: enemy.statuses.map(s =>
              s.type === 'strength' ? { ...s, stacks: s.stacks + buffValue } : s
            ),
          };
        } else {
          updatedEnemy = {
            ...enemy,
            statuses: [...enemy.statuses, { type: 'strength' as const, stacks: buffValue }],
          };
        }
        break;

      case 'debuff':
        const debuffValue = enemy.intent.value || 2;
        const existingDebuff = newPlayerStatuses.find(s => s.type === 'weak');
        if (existingDebuff) {
          newPlayerStatuses = newPlayerStatuses.map(s =>
            s.type === 'weak' ? { ...s, stacks: s.stacks + debuffValue } : s
          );
        } else {
          newPlayerStatuses.push({
            type: 'weak',
            stacks: debuffValue,
            duration: 2,
          });
        }
        break;
    }

    return {
      hp: newHp,
      block: newBlock,
      blocked,
      playerStatuses: newPlayerStatuses,
      updatedEnemy,
      actionType,
    };
  };

  // 敵ターン終了処理
  const finishEnemyTurn = (
    finalHp: number,
    finalBlock: number,
    enemies: Enemy[],
    playerStatuses: StatusEffect[]
  ) => {
    // 敵の毒（苦悩）ダメージ処理とステータス減衰
    const processedEnemies = enemies.map(enemy => {
      if (enemy.hp <= 0) return enemy;

      let newHp = enemy.hp;
      let newStatuses = [...enemy.statuses];

      // 苦悩（poison）ダメージを与え、スタックを1減らす
      const poisonStatus = enemy.statuses.find(s => s.type === 'poison');
      if (poisonStatus && poisonStatus.stacks > 0) {
        // ダメージ適用
        newHp = Math.max(0, enemy.hp - poisonStatus.stacks);
        showMessage(`${enemy.name}に苦悩で${poisonStatus.stacks}ダメージ！`);

        // スタックを1減らす
        newStatuses = enemy.statuses.map(s => {
          if (s.type === 'poison') {
            return { ...s, stacks: s.stacks - 1 };
          }
          return s;
        }).filter(s => s.stacks > 0);
      }

      // 他のステータス効果の持続ターン減少
      newStatuses = newStatuses.map(s => {
        if (s.duration && s.duration > 1) {
          return { ...s, duration: s.duration - 1 };
        } else if (s.duration === 1) {
          // 持続ターン切れ - スタックを0にしてフィルタで除去
          return { ...s, stacks: 0 };
        }
        return s;
      }).filter(s => s.stacks > 0);

      return {
        ...enemy,
        hp: newHp,
        statuses: newStatuses,
      };
    });

    // 次の行動を決定
    const enemiesWithNewIntent = processedEnemies.map(enemy => ({
      ...enemy,
      intent: selectNextIntent(enemy),
    }));

    const newBattleState: BattleState = {
      ...battleState!,
      enemies: enemiesWithNewIntent,
      playerStatuses,
      turn: battleState!.turn + 1,
      playerBlock: 0,
      isPlayerTurn: true,
    };

    setHp(finalHp);
    setPlayerBlock(0);
    setBattleState(newBattleState);

    checkBattleEndAndContinue({ hp: finalHp, battleState: newBattleState });
  };

  // 次の敵行動を選択（runStoreからインポートできない場合はここで定義）
  const selectNextIntent = (_enemy: Enemy): Enemy['intent'] => {
    const patterns: Array<{ type: 'attack' | 'defend' | 'buff' | 'debuff'; value: number; weight: number }> = [
      { type: 'attack', value: 8, weight: 60 },
      { type: 'defend', value: 5, weight: 20 },
      { type: 'buff', value: 2, weight: 10 },
      { type: 'debuff', value: 2, weight: 10 },
    ];

    const totalWeight = patterns.reduce((sum: number, p) => sum + (p.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const pattern of patterns) {
      random -= pattern.weight || 1;
      if (random <= 0) {
        return { type: pattern.type, value: pattern.value };
      }
    }

    return patterns[0];
  };

  // 敵ターン終了後の処理
  const checkBattleEndAndContinue = (enemyResult: { hp: number; battleState: BattleState }) => {
    // 敗北判定
    if (isBattleLost(enemyResult.hp)) {
      setTimeout(() => {
        handleBattleEnd(false);
      }, 500);
      return;
    }

    // 新しいターンを開始
    setTimeout(() => {
      startNewTurn();
    }, 500);
  };

  // 新しいターンを開始
  const startNewTurn = () => {
    // 調和バフの処理（ターン開始時にHP回復）
    if (battleState) {
      const regenStatus = battleState.playerStatuses.find(s => s.type === 'regeneration');
      if (regenStatus && regenStatus.stacks > 0) {
        const healAmount = regenStatus.stacks;
        setHp(prev => Math.min(runState.maxHp, prev + healAmount));
        addFloatingNumber(healAmount, 'heal', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
        showMessage(`調和で${healAmount}HP回復！`);

        // 調和のスタック/ターン減少
        setBattleState(prev => {
          if (!prev) return prev;
          const newStatuses = prev.playerStatuses.map(s => {
            if (s.type === 'regeneration') {
              // ターン数がある場合は減少、なければスタック減少
              if (s.duration && s.duration > 1) {
                return { ...s, duration: s.duration - 1 };
              } else {
                return { ...s, stacks: s.stacks - 1 };
              }
            }
            return s;
          }).filter(s => s.stacks > 0);
          return { ...prev, playerStatuses: newStatuses };
        });
      }
    }

    // 手札を捨てる
    setDiscardPile(prev => [...prev, ...hand]);
    setHand([]);

    // エネルギー回復
    setEnergy(runState.maxEnergy);

    // ブロックリセット
    setPlayerBlock(0);

    // ターンカウント増加
    setBattleState(prev => prev ? { ...prev, turn: prev.turn + 1 } : prev);

    // カードを引く
    setTurnPhase('draw');
    setTimeout(() => {
      const result = drawCards(drawPile, [...discardPile, ...hand], [], GAME_CONFIG.STARTING_HAND_SIZE);
      setHand(result.hand);
      setDrawPile(result.drawPile);
      setDiscardPile(result.discardPile);
      setTurnPhase('player');
      setIsProcessing(false);
      isProcessingRef.current = false;
    }, 300);
  };

  // バトル終了処理
  const handleBattleEnd = (victory: boolean) => {
    // 勝利/敗北の効果音
    if (victory) {
      playVictoryFanfare();
    } else {
      playSound('defeat');
    }

    const updatedRunState: RunState = {
      ...currentRunState,
      hp: victory ? hp : 0,
    };
    onBattleEnd(victory, updatedRunState);
  };

  if (!battleState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>バトル準備中...</Text>
      </View>
    );
  }

  const hpPercentage = (hp / runState.maxHp) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* ヘッダー（コンパクト） */}
      <View style={styles.header}>
        <View style={styles.floorBadge}>
          <Text style={styles.floorText}>{runState.floor}F</Text>
        </View>
        <Text style={styles.turnText}>
          {turnPhase === 'enemy' ? '敵ターン' : `ターン${battleState.turn}`}
        </Text>
      </View>

      {/* レリックアイコン（タップで展開） */}
      {currentRunState.relics.length > 0 && (
        <TouchableOpacity
          style={styles.relicIconButton}
          onPress={() => setShowRelicsPanel(!showRelicsPanel)}
        >
          <Text style={styles.relicIconText}>🏆</Text>
          <Text style={styles.relicCountText}>{currentRunState.relics.length}</Text>
        </TouchableOpacity>
      )}

      {/* レリック詳細パネル（展開時） */}
      {showRelicsPanel && currentRunState.relics.length > 0 && (
        <TouchableOpacity
          style={styles.relicsPanelOverlay}
          activeOpacity={1}
          onPress={() => setShowRelicsPanel(false)}
        >
          <View style={styles.relicsPanel}>
            <Text style={styles.relicsPanelTitle}>🏆 所持レリック</Text>
            <ScrollView style={styles.relicsPanelScroll}>
              {currentRunState.relics.map((relic, index) => (
                <View key={index} style={styles.relicPanelItem}>
                  <Text style={styles.relicPanelName}>{relic.name}</Text>
                  <Text style={styles.relicPanelDesc}>{relic.description}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.relicsPanelHint}>タップして閉じる</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* バトルフィールド */}
      <View style={styles.battlefield}>
        {/* 敵エリア */}
        <View style={styles.enemySection}>
          {battleState.enemies.map((enemy, index) => (
            <EnemyDisplay
              key={index}
              enemy={enemy}
              index={index}
              isTargeted={isSelectingTarget && selectedCardIndex !== null}
              onPress={() => handleEnemySelect(index)}
              shakeAnim={shakeAnims[index]}
            />
          ))}
        </View>

        {/* VS表示 */}
        <View style={styles.vsSection}>
          <Text style={styles.vsText}>⚔️</Text>
        </View>

        {/* プレイヤーエリア */}
        <View style={styles.playerSection}>
          {/* HPバーをフル幅で表示 */}
          <View style={styles.hpBarFull}>
            <View style={styles.hpBarBackground}>
              <LinearGradient
                colors={hpPercentage > 30 ? ['#c0392b', '#e74c3c'] : ['#8B0000', '#c0392b']}
                style={[styles.hpFill, { width: `${hpPercentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {/* HPテキストをバーの中央に表示 */}
              <View style={styles.hpTextOverlay}>
                <Text style={styles.hpTextInBar}>❤️ {hp} / {runState.maxHp}</Text>
              </View>
            </View>
          </View>
          <View style={styles.playerStatsRow}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarEmoji}>🧙</Text>
            </View>
            <View style={[styles.blockDisplay, playerBlock === 0 && styles.blockDim]}>
              <Text style={styles.statEmoji}>🛡️</Text>
              <Text style={styles.blockText}>{playerBlock}</Text>
            </View>
            <View style={styles.energyDisplay}>
              <Text style={styles.energyText}>{energy}/{runState.maxEnergy}</Text>
              <Text style={styles.statEmoji}>⚡</Text>
            </View>
          </View>
          {/* プレイヤーのステータス効果表示 */}
          {battleState.playerStatuses.length > 0 && (
            <View style={styles.statusEffectsRow}>
              {battleState.playerStatuses.map((status, idx) => (
                <View key={idx} style={styles.statusBadge}>
                  <Text style={styles.statusIcon}>
                    {status.type === 'strength' ? '💪' :
                     status.type === 'dexterity' ? '🏃' :
                     status.type === 'regeneration' ? '💚' :
                     status.type === 'vulnerable' ? '💔' :
                     status.type === 'weak' ? '😵' :
                     status.type === 'frail' ? '🦴' :
                     status.type === 'poison' ? '☠️' : '✨'}
                  </Text>
                  <Text style={[
                    styles.statusValue,
                    { color: ['strength', 'dexterity', 'regeneration'].includes(status.type) ? '#2ECC71' : '#E74C3C' }
                  ]}>
                    {status.stacks}
                    {status.duration ? `(${status.duration})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* メッセージ（スタック表示） */}
      <View style={styles.messageContainer}>
        {messages.map((msg, index) => (
          <Animated.View
            key={msg.id}
            style={[
              styles.messageItem,
              { opacity: msg.opacity, transform: [{ translateY: index * -36 }] }
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </Animated.View>
        ))}
      </View>

      {/* フローティングダメージ */}
      {floatingNumbers.map(num => (
        <FloatingDamage
          key={num.id}
          number={num}
          onComplete={() => removeFloatingNumber(num.id)}
        />
      ))}

      {/* アクションバー（ターンエンドボタン） */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.endTurnButton,
            (turnPhase !== 'player' || isProcessing) && styles.buttonDisabled,
          ]}
          onPress={handleEndTurn}
          disabled={turnPhase !== 'player' || isProcessing}
        >
          <Text style={styles.endTurnText}>
            {turnPhase === 'enemy' ? '敵ターン...' : 'ターン終了'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ストックカードエリア（固定高さ） */}
      {currentRunState.stockCards.length > 0 && currentRunState.stockCards.length > usedStockIndices.length && (
        <View style={styles.stockArea}>
          <Text style={styles.stockAreaLabel}>📦 ストック ({currentRunState.stockCards.length - usedStockIndices.length}/5)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardScrollContent}
          >
            {currentRunState.stockCards.map((stockCard, index) => {
              if (usedStockIndices.includes(index)) return null;
              const canPlay = canPlayCard(stockCard, energy, battleState.enemies);
              return (
                <BattleCard
                  key={`stock-${index}`}
                  card={stockCard}
                  onPress={() => handleUseStockCard(index)}
                  disabled={!canPlay || turnPhase !== 'player' || isProcessing}
                  selected={false}
                  playerStatuses={battleState.playerStatuses}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 手札エリア（固定高さ） */}
      <View style={styles.handArea}>
        {isSelectingTarget && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelCardSelection}>
            <Text style={styles.cancelText}>✕ キャンセル</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScrollContent}
        >
          {hand.map((cardInstance, index) => (
            <BattleCard
              key={cardInstance.instanceId}
              card={cardInstance.card}
              onPress={() => handleCardSelect(index)}
              disabled={!canPlayCard(cardInstance.card, energy, battleState.enemies) || turnPhase !== 'player' || isProcessing}
              selected={selectedCardIndex === index}
              playerStatuses={battleState.playerStatuses}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 100,
  },
  // ヘッダー（コンパクト）
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 500,
  },
  floorBadge: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  floorText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnText: {
    color: '#aaa',
    fontSize: 14,
  },
  // レリックアイコン
  relicIconButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    zIndex: 50,
  },
  relicIconText: {
    fontSize: 18,
  },
  relicCountText: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    textAlign: 'center',
  },
  // レリック詳細パネル
  relicsPanelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  relicsPanel: {
    backgroundColor: '#1a1a3e',
    borderRadius: 16,
    padding: 20,
    maxWidth: 350,
    maxHeight: '60%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  relicsPanelTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  relicsPanelScroll: {
    maxHeight: 250,
  },
  relicPanelItem: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  relicPanelName: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  relicPanelDesc: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  relicsPanelHint: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  // バトルフィールド
  battlefield: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  // 敵セクション
  enemySection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  // VS表示
  vsSection: {
    paddingVertical: 8,
  },
  vsText: {
    fontSize: 24,
  },
  // プレイヤーセクション
  playerSection: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  // HPバー（フル幅）
  hpBarFull: {
    width: '100%',
  },
  hpBarBackground: {
    width: '100%',
    height: 32,
    backgroundColor: '#222',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#c0392b',
    position: 'relative',
  },
  hpFill: {
    height: '100%',
  },
  hpTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hpTextInBar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // ステータス行（アバター、ブロック、エネルギー）
  playerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(100, 100, 200, 0.3)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6464c8',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  statEmoji: {
    fontSize: 18,
  },
  blockDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  blockDim: {
    opacity: 0.3,
  },
  blockText: {
    color: '#3498db',
    fontSize: 18,
    fontWeight: 'bold',
  },
  energyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  energyText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // ステータス効果表示
  statusEffectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // メッセージ（スタック表示）
  messageContainer: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  messageItem: {
    marginBottom: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  // フローティングダメージ
  floatingNumber: {
    position: 'absolute',
    zIndex: 200,
  },
  floatingNumberText: {
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  // ストックカードエリア（固定高さでズレ防止）
  stockArea: {
    width: '100%',
    height: 253, // ラベル22 + カード高さ215 + padding 16
    paddingVertical: 8,
  },
  stockAreaLabel: {
    color: '#9B89F5',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  // アクションバー
  actionBar: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  endTurnButton: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a8',
  },
  endTurnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // 手札エリア（固定高さでズレ防止）
  handArea: {
    width: '100%',
    height: 231, // カード高さ215 + padding 16
    paddingVertical: 8,
  },
  // カードスクロールコンテナ（中央揃え + スクロール対応）
  cardScrollContent: {
    flexGrow: 1,          // 小さい時は拡張
    justifyContent: 'center', // 中央揃え
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  cancelButton: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    backgroundColor: 'rgba(192, 57, 43, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  cancelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
