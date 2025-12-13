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
import { RunState, BattleState, CardInstance, Enemy, Card } from '../types/game';
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
  const [message, setMessage] = useState<string>('');
  const [enemiesKilledThisBattle, setEnemiesKilledThisBattle] = useState<number>(0);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);
  const [stockCardUsed, setStockCardUsed] = useState(false);
  const [currentRunState, setCurrentRunState] = useState<RunState>(runState);
  const [showRelicsPanel, setShowRelicsPanel] = useState(false);

  // アニメーション
  const shakeAnims = useRef<Animated.Value[]>([]).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

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

  // メッセージを表示
  const showMessage = (msg: string) => {
    setMessage(msg);
    messageOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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

    // 攻撃カードの場合
    const needsTarget = card.type === 'attack' ||
      card.effects.some(e => e.target === 'enemy');

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
      // 防御・スキルカードは即座に使用
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

  // ストックカードを使用
  const handleUseStockCard = async () => {
    if (!battleState || isProcessing || turnPhase !== 'player' || stockCardUsed) return;
    const stockCard = currentRunState.stockCard;
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
        await executeStockCard(stockCard, targetIndex);
      } else {
        const targetIndex = battleState.enemies.findIndex(e => e.hp > 0);
        await executeStockCard(stockCard, targetIndex);
      }
    } else {
      await executeStockCard(stockCard, 0);
    }
  };

  // ストックカードを実行
  const executeStockCard = async (card: Card, enemyIndex: number) => {
    if (!battleState) return;

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

    // ブロック獲得を表示
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      showMessage(`📦 ${card.name}: ${blockGained}ブロック獲得！`);
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
    const newRunState = await useStockCard(currentRunState);
    setCurrentRunState(newRunState);
    setStockCardUsed(true);

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      setTimeout(() => {
        handleBattleEnd(true);
      }, 500);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
  };

  // カードを使用
  const useSelectedCard = async (cardIndex: number, enemyIndex: number = targetEnemyIndex) => {
    if (!battleState || isProcessing) return;

    const cardInstance = hand[cardIndex];
    const card = cardInstance.card;

    // エネルギー消費
    if (card.cost > energy) {
      showMessage('エネルギー不足！');
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

    // ブロック獲得を表示（プレイヤー）
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      // 効果を含めたメッセージ
      if (dexterityBonus > 0) {
        showMessage(`${blockGained}ブロック獲得 (🏃+${dexterityBonus})`);
      } else {
        showMessage(`${blockGained}ブロック獲得！`);
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
    if (result.cardsDrawn > 0) {
      const drawResult = drawCards(drawPile, playResult.discardPile, playResult.hand, result.cardsDrawn);
      setHand(drawResult.hand);
      setDrawPile(drawResult.drawPile);
      setDiscardPile(drawResult.discardPile);
    }

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      setTimeout(() => {
        handleBattleEnd(true);
      }, 500);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);

    // 自動ターン終了チェック（カード使用後）
    const newEnergy = energy - card.cost + result.energyGained;
    const newHand = playResult.hand;
    checkAutoEndTurn(newEnergy, newHand, result.enemies);
  };

  // 自動ターン終了チェック
  const checkAutoEndTurn = (currentEnergy: number, currentHand: CardInstance[], enemies: Enemy[]) => {
    // 打てるカードがあるかチェック
    const canPlayAny = currentHand.some(cardInst =>
      cardInst.card.cost <= currentEnergy && canPlayCard(cardInst.card, currentEnergy, enemies)
    );

    if (!canPlayAny && currentHand.length > 0) {
      // 0.8秒後に自動でターン終了
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

    // 敵のターン処理 - 各敵の行動を順番に表示
    setTimeout(() => {
      const enemyResult = processEnemyTurn(battleState, hp, playerBlock);

      // 生存している敵の行動を集計
      const aliveEnemies = battleState.enemies.filter(e => e.hp > 0);
      const actions: string[] = [];

      aliveEnemies.forEach(enemy => {
        switch (enemy.intent.type) {
          case 'attack':
            actions.push(`${enemy.name}が${enemy.intent.value}攻撃！`);
            break;
          case 'defend':
            actions.push(`${enemy.name}が${enemy.intent.value}防御！`);
            break;
          case 'buff':
            actions.push(`${enemy.name}が強化！`);
            break;
          case 'debuff':
            actions.push(`${enemy.name}が弱体化！`);
            break;
        }
      });

      // 攻撃ダメージの計算
      const attackingEnemies = aliveEnemies.filter(e => e.intent.type === 'attack');
      const totalIntent = attackingEnemies.reduce((sum, e) => sum + (e.intent.value || 0), 0);
      const blockedAmount = Math.min(playerBlock, totalIntent);
      const actualDamage = hp - enemyResult.hp;

      // Step 1: 各敵の行動を表示
      if (actions.length > 0) {
        showMessage(`⚔️ ${actions[0]}`);
      }

      setTimeout(() => {
        if (totalIntent > 0) {
          // 攻撃があった場合
          if (playerBlock > 0 && blockedAmount > 0) {
            showMessage(`🛡️ ${blockedAmount}ブロック → ${actualDamage > 0 ? `${actualDamage}ダメージ！` : '完全防御！'}`);
            if (blockedAmount > 0) {
              addFloatingNumber(blockedAmount, 'block', SCREEN_WIDTH / 2 - 50, SCREEN_HEIGHT * 0.65);
            }
            if (actualDamage > 0) {
              addFloatingNumber(actualDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
            }
          } else if (actualDamage > 0) {
            showMessage(`💥 ${actualDamage}ダメージ！`);
            addFloatingNumber(actualDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
          }
        } else {
          // 攻撃がなかった場合（防御やバフのみ）
          const nonAttackActions = aliveEnemies
            .filter(e => e.intent.type !== 'attack')
            .map(e => {
              if (e.intent.type === 'defend') return `🛡️${e.name} +${e.intent.value}防御`;
              if (e.intent.type === 'buff') return `⬆️${e.name} 強化`;
              if (e.intent.type === 'debuff') return `⬇️${e.name} 弱体化`;
              return '';
            })
            .filter(s => s);
          if (nonAttackActions.length > 0) {
            showMessage(nonAttackActions.join(' / '));
          }
        }

        // 状態更新
        setHp(enemyResult.hp);
        setPlayerBlock(enemyResult.block);
        setBattleState(enemyResult.battleState);
        checkBattleEndAndContinue(enemyResult);
      }, 700);
    }, 500);
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
    // 再生バフの処理（ターン開始時にHP回復）
    if (battleState) {
      const regenStatus = battleState.playerStatuses.find(s => s.type === 'regeneration');
      if (regenStatus && regenStatus.stacks > 0) {
        const healAmount = regenStatus.stacks;
        setHp(prev => Math.min(runState.maxHp, prev + healAmount));
        addFloatingNumber(healAmount, 'heal', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
        showMessage(`再生で${healAmount}HP回復！`);

        // 再生のスタック/ターン減少
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

      {/* メッセージ */}
      <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
        <Text style={styles.messageText}>{message}</Text>
      </Animated.View>

      {/* フローティングダメージ */}
      {floatingNumbers.map(num => (
        <FloatingDamage
          key={num.id}
          number={num}
          onComplete={() => removeFloatingNumber(num.id)}
        />
      ))}

      {/* アクションバー */}
      <View style={styles.actionBar}>
        {/* ストックカードボタン */}
        {currentRunState.stockCard && !stockCardUsed && (
          <TouchableOpacity
            style={[
              styles.stockCardButton,
              (turnPhase !== 'player' || isProcessing || !canPlayCard(currentRunState.stockCard, energy, battleState.enemies)) && styles.buttonDisabled,
            ]}
            onPress={handleUseStockCard}
            disabled={turnPhase !== 'player' || isProcessing || !canPlayCard(currentRunState.stockCard, energy, battleState.enemies)}
          >
            <Text style={styles.stockCardLabel}>📦 ストック</Text>
            <Text style={styles.stockCardName}>{currentRunState.stockCard.name}</Text>
            <Text style={styles.stockCardCost}>⚡{currentRunState.stockCard.cost}</Text>
          </TouchableOpacity>
        )}
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

      {/* 手札エリア */}
      <View style={styles.handArea}>
        {isSelectingTarget && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelCardSelection}>
            <Text style={styles.cancelText}>✕ キャンセル</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          horizontal
          style={{ height: 220, overflow: 'visible' }}
          contentContainerStyle={styles.handContainer}
          showsHorizontalScrollIndicator={true}
        >
          {hand.map((cardInstance, index) => (
            <View key={cardInstance.instanceId} style={styles.cardWrapper}>
              <BattleCard
                card={cardInstance.card}
                onPress={() => handleCardSelect(index)}
                disabled={!canPlayCard(cardInstance.card, energy, battleState.enemies) || turnPhase !== 'player' || isProcessing}
                selected={selectedCardIndex === index}
                playerStatuses={battleState.playerStatuses}
              />
            </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  // メッセージ
  messageContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  stockCardButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6C5CE7',
    alignItems: 'center',
    minWidth: 100,
  },
  stockCardLabel: {
    color: '#9B89F5',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockCardName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stockCardCost: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 2,
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
  // 手札エリア
  handArea: {
    height: 260,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: 25,  // 選択時の拡大用スペース
    overflow: 'visible',
  },
  handContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    paddingBottom: 12,
    minWidth: '100%',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardWrapper: {
    marginHorizontal: 4,
    overflow: 'visible',
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
