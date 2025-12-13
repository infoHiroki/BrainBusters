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
import { RunState, BattleState, CardInstance, Enemy } from '../types/game';
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
} from '../store/runStore';
import { playCardEffects, canPlayCard } from '../utils/cardEffects';
import { GAME_CONFIG } from '../types/game';

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
      Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -60, duration: 1500, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
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
      Animated.delay(1000),
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // フローティングダメージを追加
  const addFloatingNumber = (value: number, type: 'damage' | 'block' | 'heal', x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFloatingNumbers(prev => [...prev, { id, value, type, x, y }]);
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

    // カード効果を実行
    const result = playCardEffects(
      card,
      { ...battleState, playerBlock },
      enemyIndex,
      runState.relics
    );

    // フローティングダメージを表示（敵へのダメージ）
    if (result.damageDealt.length > 0) {
      result.damageDealt.forEach((damage, i) => {
        if (damage > 0) {
          // 敵の位置に応じてX座標を調整
          const targetIndex = card.effects.some(e => e.target === 'all_enemies') ? i : enemyIndex;
          const xOffset = SCREEN_WIDTH / 2 + (targetIndex - (battleState.enemies.length - 1) / 2) * 160;
          addFloatingNumber(damage, 'damage', xOffset, SCREEN_HEIGHT * 0.3);
        }
      });
    }

    // ブロック獲得を表示（プレイヤー）
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      showMessage(`${blockGained}ブロック獲得！`);
    }

    // 敵にダメージを与えた場合のアニメーション
    if (result.damageDealt.length > 0) {
      shakeAnims.forEach((anim, i) => {
        if (result.enemiesKilled.includes(i) || (card.effects.some(e => e.target === 'all_enemies'))) {
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
        } else if (i === enemyIndex && card.type === 'attack') {
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
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

    // 敵のターン処理
    setTimeout(() => {
      const enemyResult = processEnemyTurn(battleState, hp, playerBlock);

      // ダメージアニメーション（プレイヤーへのダメージ）
      const totalDamage = enemyResult.damages.reduce((a, b) => a + b, 0);
      if (totalDamage > 0) {
        addFloatingNumber(totalDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
        showMessage(`${totalDamage}ダメージ！`);
      }

      // ブロックで軽減した場合
      if (playerBlock > 0 && enemyResult.block < playerBlock) {
        const blockedDamage = playerBlock - enemyResult.block;
        if (blockedDamage > 0) {
          showMessage(`${blockedDamage}ダメージをブロック！`);
        }
      }

      setHp(enemyResult.hp);
      setPlayerBlock(enemyResult.block);
      setBattleState(enemyResult.battleState);

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
    }, 1000);
  };

  // 新しいターンを開始
  const startNewTurn = () => {
    // 手札を捨てる
    setDiscardPile(prev => [...prev, ...hand]);
    setHand([]);

    // エネルギー回復
    setEnergy(runState.maxEnergy);

    // ブロックリセット
    setPlayerBlock(0);

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
    const updatedRunState: RunState = {
      ...runState,
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

      {/* ヘッダー（階層情報のみ） */}
      <View style={styles.header}>
        <View style={styles.floorInfo}>
          <Text style={styles.floorText}>{runState.floor}F</Text>
        </View>
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {turnPhase === 'enemy' ? '敵のターン' : `ターン ${battleState.turn}`}
          </Text>
        </View>
      </View>

      {/* 敵エリア（中央） */}
      <View style={styles.enemyArea}>
        <View style={styles.enemyRow}>
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

      {/* プレイヤー情報エリア（Slay the Spire風） */}
      <View style={styles.playerArea}>
        {/* 山札（左側） */}
        <TouchableOpacity style={styles.drawPileContainer}>
          <LinearGradient colors={['#2a4a6a', '#1a3a5a']} style={styles.pileGradient}>
            <Text style={styles.pileCount}>{drawPile.length}</Text>
            <Text style={styles.pileLabel}>山札</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* プレイヤーステータス（中央下） */}
        <View style={styles.playerStatusCenter}>
          {/* HP表示 */}
          <View style={styles.hpSection}>
            <Text style={styles.hpIcon}>❤️</Text>
            <View style={styles.hpBarBackground}>
              <LinearGradient
                colors={hpPercentage > 30 ? ['#c0392b', '#e74c3c'] : ['#8B0000', '#c0392b']}
                style={[styles.hpBarFill, { width: `${hpPercentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.hpValue}>{hp}/{runState.maxHp}</Text>
          </View>

          {/* ブロック表示（常に表示、0の時はグレー） */}
          <View style={[styles.blockSection, playerBlock === 0 && styles.blockEmpty]}>
            <Text style={styles.blockIcon}>🛡️</Text>
            <Text style={[styles.blockValue, playerBlock === 0 && styles.blockValueEmpty]}>
              {playerBlock}
            </Text>
          </View>

          {/* エネルギー表示 */}
          <View style={styles.energySection}>
            <LinearGradient colors={['#d4a574', '#b8956a']} style={styles.energyOrb}>
              <Text style={styles.energyValue}>{energy}</Text>
            </LinearGradient>
            <Text style={styles.energyMax}>/{runState.maxEnergy}</Text>
          </View>
        </View>

        {/* 捨て札（右側） */}
        <TouchableOpacity style={styles.discardPileContainer}>
          <LinearGradient colors={['#4a2a2a', '#3a1a1a']} style={styles.pileGradient}>
            <Text style={styles.pileCount}>{discardPile.length}</Text>
            <Text style={styles.pileLabel}>捨札</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ターン終了ボタン */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.endTurnButtonInline,
            (turnPhase !== 'player' || isProcessing) && styles.buttonDisabled,
          ]}
          onPress={handleEndTurn}
          disabled={turnPhase !== 'player' || isProcessing}
        >
          <LinearGradient
            colors={turnPhase !== 'player' || isProcessing ? ['#444', '#333'] : ['#8B4513', '#654321']}
            style={styles.endTurnGradient}
          >
            <Text style={styles.endTurnText}>
              {turnPhase === 'enemy' ? '敵ターン...' : 'ターン終了'}
            </Text>
          </LinearGradient>
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
          style={{ height: 170 }}
          contentContainerStyle={styles.handContainer}
          showsHorizontalScrollIndicator={false}
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
  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 500,
  },
  floorInfo: {
    backgroundColor: 'rgba(139, 69, 19, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  floorText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  turnIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
  },
  // 敵エリア
  enemyArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  enemyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // メッセージ（敵エリア内に表示）
  messageContainer: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  messageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  // フローティングダメージ
  floatingNumber: {
    position: 'absolute',
    zIndex: 200,
  },
  floatingNumberText: {
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // プレイヤーエリア（Slay the Spire風）
  playerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: 500,
  },
  drawPileContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  discardPileContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionRow: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    paddingVertical: 8,
  },
  endTurnButtonInline: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#654321',
  },
  pileGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 8,
  },
  pileCount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  pileLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  playerStatusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  // HP表示
  hpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpIcon: {
    fontSize: 24,
  },
  hpBarBackground: {
    width: 150,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#555',
  },
  hpBarFill: {
    height: '100%',
  },
  hpValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 70,
  },
  // ブロック表示
  blockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3498db',
    gap: 6,
  },
  blockEmpty: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderColor: '#555',
  },
  blockIcon: {
    fontSize: 20,
  },
  blockValue: {
    color: '#3498db',
    fontSize: 20,
    fontWeight: 'bold',
  },
  blockValueEmpty: {
    color: '#666',
  },
  // エネルギー表示
  energySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  energyValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  energyMax: {
    color: '#aaa',
    fontSize: 16,
    marginLeft: 4,
  },
  // 手札エリア
  handArea: {
    height: 180,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'flex-end',
  },
  handContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 170,
  },
  cardWrapper: {
    marginHorizontal: 4,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  endTurnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  endTurnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
