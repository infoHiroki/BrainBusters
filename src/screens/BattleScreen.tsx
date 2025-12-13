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

    // 敵のターン処理 - 段階的なアニメーション表示
    setTimeout(() => {
      // 攻撃する敵のintentを取得
      const attackingEnemies = battleState.enemies.filter(e =>
        e.hp > 0 && e.intent.type === 'attack'
      );
      const totalIntent = attackingEnemies.reduce((sum, e) => sum + (e.intent.value || 0), 0);

      const enemyResult = processEnemyTurn(battleState, hp, playerBlock);

      // ダメージ計算の詳細
      const blockedAmount = Math.min(playerBlock, totalIntent);
      const actualDamage = hp - enemyResult.hp;

      if (totalIntent > 0) {
        // Step 1: 攻撃表示
        showMessage(`⚔️ 敵の攻撃！ ${totalIntent}`);

        setTimeout(() => {
          if (playerBlock > 0 && blockedAmount > 0) {
            // Step 2: ブロック表示
            showMessage(`🛡️ ブロック ${blockedAmount}`);
            addFloatingNumber(blockedAmount, 'block', SCREEN_WIDTH / 2 - 50, SCREEN_HEIGHT * 0.65);

            setTimeout(() => {
              if (actualDamage > 0) {
                // Step 3: 最終ダメージ
                showMessage(`💥 ${actualDamage} ダメージ！`);
                addFloatingNumber(actualDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
              } else {
                // 完全ブロック
                showMessage(`✨ 完全ブロック！`);
              }
              // 状態更新
              setHp(enemyResult.hp);
              setPlayerBlock(enemyResult.block);
              setBattleState(enemyResult.battleState);
              checkBattleEndAndContinue(enemyResult);
            }, 600);
          } else {
            // ブロックなし - 直接ダメージ
            showMessage(`💥 ${actualDamage} ダメージ！`);
            addFloatingNumber(actualDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
            setHp(enemyResult.hp);
            setPlayerBlock(enemyResult.block);
            setBattleState(enemyResult.battleState);
            checkBattleEndAndContinue(enemyResult);
          }
        }, 600);
      } else {
        // 敵が防御やバフの場合
        const defendingEnemy = battleState.enemies.find(e =>
          e.hp > 0 && e.intent.type === 'defend'
        );
        if (defendingEnemy) {
          showMessage(`🛡️ 敵がブロック +${defendingEnemy.intent.value}`);
        }
        setHp(enemyResult.hp);
        setPlayerBlock(enemyResult.block);
        setBattleState(enemyResult.battleState);
        checkBattleEndAndContinue(enemyResult);
      }
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

      {/* ヘッダー（コンパクト） */}
      <View style={styles.header}>
        <View style={styles.floorBadge}>
          <Text style={styles.floorText}>{runState.floor}F</Text>
        </View>
        <Text style={styles.turnText}>
          {turnPhase === 'enemy' ? '敵ターン' : `ターン${battleState.turn}`}
        </Text>
      </View>

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
          <View style={styles.playerAvatar}>
            <Text style={styles.avatarEmoji}>🧙</Text>
          </View>
          <View style={styles.playerStats}>
            <View style={styles.hpRow}>
              <Text style={styles.statEmoji}>❤️</Text>
              <View style={styles.hpBar}>
                <LinearGradient
                  colors={hpPercentage > 30 ? ['#c0392b', '#e74c3c'] : ['#8B0000', '#c0392b']}
                  style={[styles.hpFill, { width: `${hpPercentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.hpText}>{hp}/{runState.maxHp}</Text>
            </View>
            <View style={styles.statsRow}>
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
          style={{ height: 205 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(100, 100, 200, 0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6464c8',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  playerStats: {
    flex: 1,
    gap: 8,
  },
  hpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statEmoji: {
    fontSize: 16,
  },
  hpBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
  },
  hpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  blockDim: {
    opacity: 0.4,
  },
  blockText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
  },
  energyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 69, 19, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  energyText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // ステータス効果表示
  statusEffectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
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
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // アクションバー
  actionBar: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    paddingVertical: 8,
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
    height: 210,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  handContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
    height: 200,
    minWidth: '100%',
    justifyContent: 'center',
  },
  cardWrapper: {
    marginHorizontal: 3,
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
