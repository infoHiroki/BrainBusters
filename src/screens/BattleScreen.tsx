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
import { selectNextIntent as selectNextIntentFromTemplate } from '../data/enemies';
import { playCardEffects, canPlayCard } from '../utils/cardEffects';
import { GAME_CONFIG } from '../types/game';
import { playSound, playVictoryFanfare, initializeSound } from '../utils/sound';
import { ComboResult } from '../types/tags';
import { TurnCardTracker, createTurnTracker, checkCombosWithStock } from '../utils/comboDetection';
import { ComboDisplay } from '../components/ComboDisplay';
import {
  DamageEffectSvg,
  DefeatEffectSvg,
  BlockEffectSvg,
  HealEffectSvg,
  BuffEffectSvg,
  DebuffEffectSvg,
  CardPlayEffectSvg,
} from '../components/effects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// カードサイズ（通常サイズ：150x215）
const CARD_WIDTH = 150;
const CARD_HEIGHT = 215;

// フローティングダメージ表示用のコンポーネント
interface FloatingNumber {
  id: string;
  value: number;
  type: 'damage' | 'block' | 'blocked' | 'heal' | 'buff' | 'debuff' | 'draw' | 'energy';
  label?: string;  // バフ・デバフ名など
  x: number;
  y: number;
}

const FloatingDamage: React.FC<{ number: FloatingNumber; onComplete: () => void }> = ({ number, onComplete }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      // フェードアウト（長めに表示）
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      // 上に浮かぶ
      Animated.timing(translateY, { toValue: -60, duration: 2500, useNativeDriver: true }),
      // ポップアニメーション（大きく飛び出す）
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.5, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      ]),
      // 微妙な揺れ
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    ]).start(onComplete);
  }, []);

  // 色の設定
  const getColor = () => {
    switch (number.type) {
      case 'damage': return '#ff3333';
      case 'block': return '#33aaff';
      case 'blocked': return '#33aaff';
      case 'heal': return '#33ff33';
      case 'buff': return '#ffaa00';
      case 'debuff': return '#aa44ff';
      case 'draw': return '#44dd88';
      case 'energy': return '#ffcc00';
    }
  };
  const color = getColor();

  // 表示テキスト
  const getText = () => {
    switch (number.type) {
      case 'damage': return `-${number.value}`;
      case 'block': return `+${number.value}`;
      case 'blocked': return `${number.value}`;
      case 'heal': return `+${number.value}`;
      case 'buff': return `${number.label}+${number.value}`;
      case 'debuff': return `${number.label}-${number.value}`;
      case 'draw': return `+${number.value}枚`;
      case 'energy': return `+${number.value}⚡`;
    }
  };

  // バフ・デバフ・ドロー・エネルギーはセンター表示・サイズ小さめ
  const isSpecialEffect = number.type === 'buff' || number.type === 'debuff' || number.type === 'draw' || number.type === 'energy';

  return (
    <Animated.View style={[
      styles.floatingNumber,
      isSpecialEffect ? {
        left: 0,
        right: 0,
        top: number.y + 60,  // ダメージ表示とずらす
      } : {
        left: number.x - 40,
        top: number.y,
      },
      {
        opacity,
        transform: [
          { translateY },
          { scale },
          { rotate: rotate.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] }) }
        ]
      }
    ]}>
      <Text style={[
        styles.floatingNumberText,
        {
          color,
          textShadowColor: '#000',
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 3,
          fontSize: isSpecialEffect ? 32 : 48,  // 特殊エフェクトは小さめ
        }
      ]} numberOfLines={1}>
        {getText()}
      </Text>
    </Animated.View>
  );
};

interface BattleScreenProps {
  runState: RunState;
  onBattleEnd: (victory: boolean, updatedRunState: RunState, enemiesDefeated?: number) => void;
  nodeType?: 'battle' | 'elite' | 'boss';  // デバッグ用: ノードタイプを強制指定
  enemyCount?: number;  // デバッグ用: 敵数を強制指定
  onDebugExit?: () => void;  // デバッグ用: 戦闘中断ボタン
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  runState,
  onBattleEnd,
  nodeType,
  enemyCount,
  onDebugExit,
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
  const [messages, setMessages] = useState<Array<{ id: string; text: string; opacity: Animated.Value; offsetIndex: number; position: 'top' | 'center' | 'bottom' }>>([]);
  const [enemiesKilledThisBattle, setEnemiesKilledThisBattle] = useState<number>(0);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);
  const [usedStockIndices, setUsedStockIndices] = useState<number[]>([]);
  const [currentRunState, setCurrentRunState] = useState<RunState>(runState);
  const [showRelicsPanel, setShowRelicsPanel] = useState(false);
  const [battleWon, setBattleWon] = useState(false);  // 勝利フラグ（カード選択防止用）

  // コンボシステム
  const [turnTracker, setTurnTracker] = useState<TurnCardTracker>(createTurnTracker());
  const [activeCombo, setActiveCombo] = useState<ComboResult | null>(null);
  const [comboQueue, setComboQueue] = useState<ComboResult[]>([]);

  // バトルエフェクト
  const [activeDamageEffects, setActiveDamageEffects] = useState<Array<{
    id: string;
    damage: number;
    x: number;
    y: number;
  }>>([]);
  const [activeDefeatEffects, setActiveDefeatEffects] = useState<Array<{
    id: string;
    x: number;
    y: number;
    enemyType: 'normal' | 'elite' | 'boss';
  }>>([]);

  // 新規エフェクト状態
  const [activeBlockEffects, setActiveBlockEffects] = useState<Array<{
    id: string;
    block: number;
    x: number;
    y: number;
  }>>([]);
  const [activeHealEffects, setActiveHealEffects] = useState<Array<{
    id: string;
    heal: number;
    x: number;
    y: number;
  }>>([]);
  const [activeBuffEffects, setActiveBuffEffects] = useState<Array<{
    id: string;
    x: number;
    y: number;
  }>>([]);
  const [activeDebuffEffects, setActiveDebuffEffects] = useState<Array<{
    id: string;
    x: number;
    y: number;
  }>>([]);
  const [activeCardPlayEffects, setActiveCardPlayEffects] = useState<Array<{
    id: string;
    cardType: 'attack' | 'defense' | 'skill';
    x: number;
    y: number;
  }>>([]);

  // アニメーション
  const shakeAnims = useRef<Animated.Value[]>([]).current;
  const screenShakeAnim = useRef(new Animated.Value(0)).current;

  // 処理中フラグ（同期的に更新）
  const isProcessingRef = useRef(false);

  // 特殊エフェクトのオフセットカウンター（重なり防止）
  const specialEffectCountRef = useRef(0);

  // バトル初期化
  useEffect(() => {
    const initBattle = () => {
      // バトル状態を初期化（nodeType/enemyCountが指定されていれば使用）
      const newBattleState = initBattleState(runState, nodeType, enemyCount);
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

  // メッセージカウンター（縦位置のずらし用・位置別）
  const messageCountTopRef = useRef(0);
  const messageCountCenterRef = useRef(0);
  const messageCountBottomRef = useRef(0);

  // メッセージを表示（フェードのみ・全て真ん中）
  const showMessage = (msg: string, _position: 'top' | 'center' | 'bottom' = 'center') => {
    const position = 'center';  // 全て真ん中に統一
    const id = Math.random().toString(36).substr(2, 9);
    const opacity = new Animated.Value(0);
    // 連続メッセージは縦位置をずらして重ならないようにする（位置別カウント）
    const counterRef = position === 'top' ? messageCountTopRef : position === 'center' ? messageCountCenterRef : messageCountBottomRef;
    const offsetIndex = counterRef.current % 4;
    counterRef.current++;

    setMessages(prev => [...prev, { id, text: msg, opacity, offsetIndex, position }]);

    // フェードイン → 表示維持 → フェードアウト
    Animated.sequence([
      // フェードイン
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // 表示維持
      Animated.delay(1200),
      // フェードアウト
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // アニメーション完了後にメッセージを削除
      setMessages(prev => prev.filter(m => m.id !== id));
    });
  };

  // フローティングダメージを追加（効果音付き）
  const addFloatingNumber = (
    value: number,
    type: 'damage' | 'block' | 'blocked' | 'heal' | 'buff' | 'debuff' | 'draw' | 'energy',
    x: number,
    y: number,
    label?: string
  ) => {
    const id = Math.random().toString(36).substr(2, 9);

    // 特殊エフェクト（buff/debuff/draw/energy）は重ならないようにオフセット
    const isSpecial = type === 'buff' || type === 'debuff' || type === 'draw' || type === 'energy';
    let finalY = y;
    if (isSpecial) {
      const offset = specialEffectCountRef.current * 40;  // 40pxずつずらす
      finalY = y + offset;
      specialEffectCountRef.current++;
      // 一定時間後にカウンターをリセット
      setTimeout(() => {
        specialEffectCountRef.current = Math.max(0, specialEffectCountRef.current - 1);
      }, 500);
    }

    setFloatingNumbers(prev => [...prev, { id, value, type, x, y: finalY, label }]);

    // 効果音を再生
    if (type === 'damage') {
      playSound('attack');
    } else if (type === 'block' || type === 'blocked') {
      playSound('block');
    } else if (type === 'heal') {
      playSound('heal');
    }
    // buff/debuffは専用効果音があれば追加可能
  };

  // フローティングダメージを削除
  const removeFloatingNumber = (id: string) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  };

  // 画面シェイクをトリガー
  const triggerScreenShake = (intensity: number = 10, duration: number = 300) => {
    screenShakeAnim.setValue(0);
    Animated.sequence([
      ...Array(Math.floor(duration / 60)).fill(null).map(() =>
        Animated.sequence([
          Animated.timing(screenShakeAnim, {
            toValue: intensity,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(screenShakeAnim, {
            toValue: -intensity,
            duration: 30,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.timing(screenShakeAnim, {
        toValue: 0,
        duration: 30,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ダメージエフェクトを追加
  const addDamageEffect = (damage: number, x: number, y: number) => {
    if (damage < 50) return; // 50未満はエフェクトなし

    const id = Math.random().toString(36).substr(2, 9);
    setActiveDamageEffects(prev => [...prev, { id, damage, x, y }]);

    // 100以上のダメージは画面シェイク
    if (damage >= 100) {
      triggerScreenShake(Math.min(damage / 10, 15), 400);
    }
  };

  // ダメージエフェクトを削除
  const removeDamageEffect = (id: string) => {
    setActiveDamageEffects(prev => prev.filter(e => e.id !== id));
  };

  // 敵撃破エフェクトを追加
  const addDefeatEffect = (x: number, y: number, enemyType: 'normal' | 'elite' | 'boss') => {
    const id = Math.random().toString(36).substr(2, 9);
    setActiveDefeatEffects(prev => [...prev, { id, x, y, enemyType }]);
  };

  // 敵撃破エフェクトを削除
  const removeDefeatEffect = (id: string) => {
    setActiveDefeatEffects(prev => prev.filter(e => e.id !== id));
  };

  // ブロックエフェクトを追加
  const addBlockEffect = (block: number, x: number, y: number) => {
    if (block < 5) return; // 5未満はエフェクトなし
    const id = Math.random().toString(36).substr(2, 9);
    setActiveBlockEffects(prev => [...prev, { id, block, x, y }]);
  };

  // ブロックエフェクトを削除
  const removeBlockEffect = (id: string) => {
    setActiveBlockEffects(prev => prev.filter(e => e.id !== id));
  };

  // 回復エフェクトを追加
  const addHealEffect = (heal: number, x: number, y: number) => {
    if (heal < 3) return; // 3未満はエフェクトなし
    const id = Math.random().toString(36).substr(2, 9);
    setActiveHealEffects(prev => [...prev, { id, heal, x, y }]);
  };

  // 回復エフェクトを削除
  const removeHealEffect = (id: string) => {
    setActiveHealEffects(prev => prev.filter(e => e.id !== id));
  };

  // バフエフェクトを追加
  const addBuffEffect = (x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setActiveBuffEffects(prev => [...prev, { id, x, y }]);
  };

  // バフエフェクトを削除
  const removeBuffEffect = (id: string) => {
    setActiveBuffEffects(prev => prev.filter(e => e.id !== id));
  };

  // デバフエフェクトを追加
  const addDebuffEffect = (x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setActiveDebuffEffects(prev => [...prev, { id, x, y }]);
  };

  // デバフエフェクトを削除
  const removeDebuffEffect = (id: string) => {
    setActiveDebuffEffects(prev => prev.filter(e => e.id !== id));
  };

  // カード使用エフェクトを追加
  const addCardPlayEffect = (cardType: 'attack' | 'defense' | 'skill', x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setActiveCardPlayEffects(prev => [...prev, { id, cardType, x, y }]);
  };

  // カード使用エフェクトを削除
  const removeCardPlayEffect = (id: string) => {
    setActiveCardPlayEffects(prev => prev.filter(e => e.id !== id));
  };

  // コンボ効果を適用
  const applyComboEffects = (combo: ComboResult) => {
    if (!battleState) return;

    combo.appliedEffects.forEach(ae => {
      const effect = ae.effect;
      const value = ae.actualValue;

      switch (effect.type) {
        case 'damage':
          // ダメージ効果
          if (effect.target === 'all') {
            // 全体ダメージ
            setBattleState(prev => {
              if (!prev) return null;
              const updatedEnemies = prev.enemies.map(enemy => ({
                ...enemy,
                hp: Math.max(0, enemy.hp - Math.max(0, value - enemy.block)),
              }));
              return { ...prev, enemies: updatedEnemies };
            });
            showMessage(`${combo.combo.name}: 全体に${value}ダメージ！`, 'center');
          } else {
            // 単体ダメージ（ターゲット敵に）
            setBattleState(prev => {
              if (!prev) return null;
              const aliveEnemies = prev.enemies.filter(e => e.hp > 0);
              if (aliveEnemies.length === 0) return prev;
              const targetEnemy = aliveEnemies[0];
              const updatedEnemies = prev.enemies.map(enemy =>
                enemy.id === targetEnemy.id
                  ? { ...enemy, hp: Math.max(0, enemy.hp - Math.max(0, value - enemy.block)) }
                  : enemy
              );
              return { ...prev, enemies: updatedEnemies };
            });
            showMessage(`${combo.combo.name}: ${value}ダメージ！`, 'center');
          }
          addFloatingNumber(value, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3);
          break;

        case 'block':
          setPlayerBlock(prev => prev + value);
          addFloatingNumber(value, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
          showMessage(`${combo.combo.name}: 防御+${value}！`);  // 下部（デフォルト）
          break;

        case 'heal':
          setHp(prev => Math.min(runState.maxHp, prev + value));
          addFloatingNumber(value, 'heal', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
          showMessage(`${combo.combo.name}: ${value}回復！`);  // 下部（デフォルト）
          break;

        case 'draw':
          // カードドロー
          const drawResult = drawCards(drawPile, discardPile, hand, value);
          setHand(drawResult.hand);
          setDrawPile(drawResult.drawPile);
          setDiscardPile(drawResult.discardPile);
          showMessage(`${combo.combo.name}: ${value}枚ドロー！`);  // 下部（デフォルト）
          break;

        case 'energy':
          setEnergy(prev => prev + value);
          showMessage(`${combo.combo.name}: +${value}エネルギー！`);  // 下部（デフォルト）
          break;

        case 'buff':
          // バフ付与
          setBattleState(prev => {
            if (!prev) return null;
            const existingStatus = prev.playerStatuses.find(s => s.type === effect.buffType as any);
            let newStatuses;
            if (existingStatus) {
              newStatuses = prev.playerStatuses.map(s =>
                s.type === effect.buffType ? { ...s, stacks: s.stacks + value } : s
              );
            } else {
              newStatuses = [...prev.playerStatuses, {
                type: effect.buffType as any,
                stacks: value,
                duration: effect.duration,
              }];
            }
            return { ...prev, playerStatuses: newStatuses };
          });
          const buffName = effect.buffType === 'strength' ? '闘志' :
                          effect.buffType === 'dexterity' ? '克己' : effect.buffType;
          showMessage(`${combo.combo.name}: ${buffName}+${value}！`);
          addFloatingNumber(value, 'buff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65, buffName);
          addBuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
          break;

        case 'debuff':
          // デバフ付与
          setBattleState(prev => {
            if (!prev) return null;
            const applyDebuff = (enemy: Enemy): Enemy => {
              const existingStatus = enemy.statuses.find(s => s.type === effect.buffType as any);
              let newStatuses;
              if (existingStatus) {
                newStatuses = enemy.statuses.map(s =>
                  s.type === effect.buffType ? { ...s, stacks: s.stacks + value } : s
                );
              } else {
                newStatuses = [...enemy.statuses, {
                  type: effect.buffType as any,
                  stacks: value,
                  duration: effect.duration,
                }];
              }
              return { ...enemy, statuses: newStatuses };
            };

            const updatedEnemies = effect.target === 'all'
              ? prev.enemies.map(e => e.hp > 0 ? applyDebuff(e) : e)
              : prev.enemies.map((e, i) => i === 0 && e.hp > 0 ? applyDebuff(e) : e);

            return { ...prev, enemies: updatedEnemies };
          });
          const debuffName = effect.buffType === 'vulnerable' ? '不安' :
                            effect.buffType === 'weak' ? '虚弱' :
                            effect.buffType === 'poison' ? '苦悩' : effect.buffType;
          showMessage(`${combo.combo.name}: ${debuffName}付与！`, 'center');  // 敵への効果
          addFloatingNumber(value, 'debuff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3, debuffName);
          addDebuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3);
          break;
      }
    });
  };

  // コンボ演出完了時の処理
  const handleComboComplete = () => {
    // 現在のコンボ効果を適用
    if (activeCombo) {
      applyComboEffects(activeCombo);
    }

    // 次のコンボがあれば表示
    if (comboQueue.length > 0) {
      const [nextCombo, ...remaining] = comboQueue;
      setActiveCombo(nextCombo);
      setComboQueue(remaining);
    } else {
      setActiveCombo(null);
    }
  };

  // コンボをチェックして発動
  const checkAndTriggerCombos = (card: Card, instanceId: string) => {
    const { tracker: newTracker, newCombos } = checkCombosWithStock(
      turnTracker,
      currentRunState.stockCards,
      card,
      instanceId
    );

    setTurnTracker(newTracker);

    if (newCombos.length > 0) {
      // 最初のコンボを表示、残りはキューに
      const [firstCombo, ...remainingCombos] = newCombos;
      setActiveCombo(firstCombo);
      setComboQueue(remainingCombos);
    }
  };

  // カードを選択
  const handleCardSelect = (index: number) => {
    if (isProcessing || turnPhase !== 'player' || battleWon) return;

    const cardInstance = hand[index];
    const card = cardInstance.card;
    if (!battleState) return;

    // 使用可能かチェック
    if (!canPlayCard(card, energy, battleState.enemies, hp)) {
      showMessage('使用できません！', 'center');
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
        showMessage('敵を選択してください', 'center');
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
    if (!canPlayCard(stockCard, energy, battleState.enemies, hp)) {
      showMessage('使用できません！', 'center');
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
    // 同期的にフラグをチェック（連打防止・勝利後の操作防止）
    if (!battleState || isProcessingRef.current || battleWon) return;
    isProcessingRef.current = true;

    setIsProcessing(true);

    // カード効果を実行
    const result = playCardEffects(
      card,
      { ...battleState, playerBlock },
      enemyIndex,
      currentRunState.relics,
      hp,
      currentRunState.maxHp
    );

    // フローティングダメージを表示（連撃対応）
    if (result.damageDealt.length > 0) {
      const totalDamage = result.damageDealt.reduce((a, b) => a + b, 0);
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');

      if (isAllTarget) {
        // 全体攻撃
        let damageIndex = 0;
        battleState.enemies.forEach((originalEnemy, enemyIdx) => {
          if (originalEnemy.hp > 0 && damageIndex < result.damageDealt.length) {
            const damage = result.damageDealt[damageIndex];
            damageIndex++;
            if (damage > 0) {
              const xOffset = SCREEN_WIDTH / 2 + (enemyIdx - (battleState.enemies.length - 1) / 2) * 160;
              addFloatingNumber(damage, 'damage', xOffset, SCREEN_HEIGHT * 0.3);
              addDamageEffect(damage, xOffset, SCREEN_HEIGHT * 0.3);
            }
          }
        });
      } else {
        // 単体攻撃（連撃対応：300ms間隔）
        result.damageDealt.forEach((damage, hitIndex) => {
          if (damage > 0) {
            const xOffset = SCREEN_WIDTH / 2 + (enemyIndex - (battleState.enemies.length - 1) / 2) * 160;
            const delay = hitIndex * 300;
            const yOffset = SCREEN_HEIGHT * 0.3 - hitIndex * 30;
            setTimeout(() => {
              addFloatingNumber(damage, 'damage', xOffset, yOffset);
              addDamageEffect(damage, xOffset, yOffset);
            }, delay);
          }
        });
      }
      showMessage(`📦 ${card.name}: ${totalDamage}ダメージ！`, 'center');
    }

    // 防御力強化を表示（下部）
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      addBlockEffect(blockGained, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
      showMessage(`📦 ${card.name}: 防御力+${blockGained}！`);
    }

    // 敵へのダメージアニメーション（連撃対応：300ms間隔）
    if (result.damageDealt.length > 0) {
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');

      if (!isAllTarget) {
        // 単体攻撃の連撃：各ヒットごとに揺れを発生
        // 注: damageDealtには実際にヒットしたダメージのみが含まれる（敵が死んだ後はスキップされる）
        result.damageDealt.forEach((damage, hitIndex) => {
          if (damage > 0 && shakeAnims[enemyIndex]) {
            const delay = hitIndex * 300;
            setTimeout(() => {
              // アニメーション対象がまだ存在する場合のみ実行
              if (shakeAnims[enemyIndex]) {
                Animated.sequence([
                  Animated.timing(shakeAnims[enemyIndex], { toValue: 1, duration: 80, useNativeDriver: true }),
                  Animated.timing(shakeAnims[enemyIndex], { toValue: 0, duration: 80, useNativeDriver: true }),
                  Animated.timing(shakeAnims[enemyIndex], { toValue: -1, duration: 80, useNativeDriver: true }),
                  Animated.timing(shakeAnims[enemyIndex], { toValue: 0, duration: 80, useNativeDriver: true }),
                ]).start();
              }
            }, delay);
          }
        });
      } else {
        // 全体攻撃：一度だけ揺れる
        result.enemies.forEach((enemy, i) => {
          if (enemy.hp > 0 && shakeAnims[i]) {
            Animated.sequence([
              Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
            ]).start();
          }
        });
      }
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
      addHealEffect(result.healAmount, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
      setHp(prev => Math.min(currentRunState.maxHp, prev + result.healAmount));
    }

    // HPコスト（自傷ダメージ）
    if (result.selfDamage > 0) {
      addFloatingNumber(result.selfDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      setHp(prev => Math.max(1, prev - result.selfDamage)); // 最低1HP残す
      showMessage(`💔 ${card.name}: HP-${result.selfDamage}！`);
    }

    // バフ・デバフエフェクト
    for (const effect of card.effects) {
      if (effect.type === 'buff' && effect.statusType) {
        const buffLabel = effect.statusType === 'strength' ? '闘志' :
                         effect.statusType === 'dexterity' ? '克己' :
                         effect.statusType === 'regeneration' ? '調和' : effect.statusType;
        addFloatingNumber(effect.value, 'buff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65, buffLabel);
        addBuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
        showMessage(`📦 ${card.name}: ${buffLabel}+${effect.value}！`);
      } else if (effect.type === 'debuff' && effect.statusType) {
        const debuffLabel = effect.statusType === 'vulnerable' ? '不安' :
                           effect.statusType === 'weak' ? '躊躇' :
                           effect.statusType === 'frail' ? '倦怠' :
                           effect.statusType === 'poison' ? '苦悩' : effect.statusType;
        addFloatingNumber(effect.value, 'debuff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3, debuffLabel);
        addDebuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3);
        showMessage(`📦 ${card.name}: ${debuffLabel}付与！`, 'center');
      }
    }

    // 倒した敵のカウント + 撃破エフェクト
    if (result.enemiesKilled.length > 0) {
      setEnemiesKilledThisBattle(prev => prev + result.enemiesKilled.length);

      // 撃破エフェクトを表示
      result.enemiesKilled.forEach((killedIndex) => {
        const killedEnemy = battleState.enemies[killedIndex];
        if (killedEnemy) {
          const enemyType = killedEnemy.isBoss ? 'boss' : killedEnemy.isElite ? 'elite' : 'normal';
          const xOffset = SCREEN_WIDTH / 2 + (killedIndex - (battleState.enemies.length - 1) / 2) * 160;
          addDefeatEffect(xOffset, SCREEN_HEIGHT * 0.3, enemyType);
        }
      });
    }

    // 追加ドロー
    if (result.cardsDrawn > 0) {
      addFloatingNumber(result.cardsDrawn, 'draw', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
      const drawResult = drawCards(drawPile, discardPile, hand, result.cardsDrawn);
      setHand(drawResult.hand);
      setDrawPile(drawResult.drawPile);
      setDiscardPile(drawResult.discardPile);
    }

    // エネルギー獲得
    if (result.energyGained > 0) {
      addFloatingNumber(result.energyGained, 'energy', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
    }

    // ストックカードを使用済みにする（永続保存）
    const newRunState = await useStockCard(currentRunState, stockIndex);
    setCurrentRunState(newRunState);
    const newUsedStockIndices = [...usedStockIndices, stockIndex];
    setUsedStockIndices(newUsedStockIndices);

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      // 勝利フラグを立てる（カード選択を防止）
      setBattleWon(true);
      // ボス撃破時は長めの遅延（エフェクト完了まで）
      const hasBossKill = result.enemiesKilled.some(idx => battleState.enemies[idx]?.isBoss);
      const victoryDelay = hasBossKill ? 2200 : 900;
      setTimeout(() => {
        handleBattleEnd(true);
      }, victoryDelay);
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
    // 同期的にフラグをチェック（連打防止・勝利後の操作防止）
    if (!battleState || isProcessingRef.current || battleWon) return;
    isProcessingRef.current = true;

    const cardInstance = hand[cardIndex];
    const card = cardInstance.card;

    // エネルギー消費
    if (card.cost > energy) {
      showMessage('エネルギー不足！', 'center');
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
      runState.relics,
      hp,
      runState.maxHp
    );

    // ステータス効果のボーナスを取得
    const strengthBonus = battleState.playerStatuses.find(s => s.type === 'strength')?.stacks || 0;
    const dexterityBonus = battleState.playerStatuses.find(s => s.type === 'dexterity')?.stacks || 0;

    // フローティングダメージを表示（敵へのダメージ）
    if (result.damageDealt.length > 0) {
      const totalDamage = result.damageDealt.reduce((a, b) => a + b, 0);
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');

      if (isAllTarget) {
        // 全体攻撃: 生存敵のみにダメージ表示（インデックスを正しく対応させる）
        let damageIndex = 0;
        battleState.enemies.forEach((originalEnemy, enemyIdx) => {
          // 攻撃前に生存していた敵のみ（死亡敵はスキップされている）
          if (originalEnemy.hp > 0 && damageIndex < result.damageDealt.length) {
            const damage = result.damageDealt[damageIndex];
            damageIndex++;
            if (damage > 0) {
              const xOffset = SCREEN_WIDTH / 2 + (enemyIdx - (battleState.enemies.length - 1) / 2) * 160;
              addFloatingNumber(damage, 'damage', xOffset, SCREEN_HEIGHT * 0.3);
              addDamageEffect(damage, xOffset, SCREEN_HEIGHT * 0.3);
            }
          }
        });
      } else {
        // 単体攻撃（連撃対応：時間差とY位置をずらして表示）
        result.damageDealt.forEach((damage, hitIndex) => {
          if (damage > 0) {
            const xOffset = SCREEN_WIDTH / 2 + (enemyIndex - (battleState.enemies.length - 1) / 2) * 160;
            // 連撃の場合、各ヒットを時間差で表示（人間が知覚できる間隔）
            const delay = hitIndex * 300; // 300ms間隔
            const yOffset = SCREEN_HEIGHT * 0.3 - hitIndex * 30; // 上にずらす
            setTimeout(() => {
              addFloatingNumber(damage, 'damage', xOffset, yOffset);
              addDamageEffect(damage, xOffset, yOffset);
            }, delay);
          }
        });
      }

      // 攻撃メッセージは真ん中
      if (strengthBonus > 0) {
        showMessage(`${card.name}: ${totalDamage}ダメージ (💪+${strengthBonus})`, 'center');
      } else {
        showMessage(`${card.name}: ${totalDamage}ダメージ！`, 'center');
      }
    }

    // 防御力強化を表示（プレイヤー）
    const blockGained = result.playerBlock - playerBlock;
    if (blockGained > 0) {
      addFloatingNumber(blockGained, 'block', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      addBlockEffect(blockGained, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
      // 効果を含めたメッセージ
      if (dexterityBonus > 0) {
        showMessage(`防御力+${blockGained} (🏃+${dexterityBonus})`);
      } else {
        showMessage(`防御力+${blockGained}！`);
      }
    }

    // 敵にダメージを与えた場合のアニメーション（連撃対応：各ヒットで揺れる）
    if (result.damageDealt.length > 0) {
      const isAllTarget = card.effects.some(e => e.target === 'all_enemies');

      // 単体攻撃の連撃：各ヒットごとに揺れを発生
      if (!isAllTarget) {
        result.damageDealt.forEach((damage, hitIndex) => {
          if (damage > 0 && result.enemies[enemyIndex]?.hp > 0 && shakeAnims[enemyIndex]) {
            const delay = hitIndex * 300; // ダメージ表示と同じタイミング（300ms間隔）
            setTimeout(() => {
              Animated.sequence([
                Animated.timing(shakeAnims[enemyIndex], { toValue: 1, duration: 80, useNativeDriver: true }),
                Animated.timing(shakeAnims[enemyIndex], { toValue: 0, duration: 80, useNativeDriver: true }),
                Animated.timing(shakeAnims[enemyIndex], { toValue: -1, duration: 80, useNativeDriver: true }),
                Animated.timing(shakeAnims[enemyIndex], { toValue: 0, duration: 80, useNativeDriver: true }),
              ]).start();
            }, delay);
          }
        });
      } else {
        // 全体攻撃：一度だけ揺れる
        result.enemies.forEach((enemy, i) => {
          if (enemy.hp > 0 && shakeAnims[i]) {
            Animated.sequence([
              Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
            ]).start();
          }
        });
      }
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
      addHealEffect(result.healAmount, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
      setHp(prev => Math.min(runState.maxHp, prev + result.healAmount));
    }

    // HPコスト（自傷ダメージ）
    if (result.selfDamage > 0) {
      addFloatingNumber(result.selfDamage, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.75);
      setHp(prev => Math.max(1, prev - result.selfDamage));
      showMessage(`💔 ${card.name}: HP-${result.selfDamage}！`);
    }

    // バフ・デバフエフェクト
    for (const effect of card.effects) {
      if (effect.type === 'buff' && effect.statusType) {
        const buffLabel = effect.statusType === 'strength' ? '闘志' :
                         effect.statusType === 'dexterity' ? '克己' :
                         effect.statusType === 'regeneration' ? '調和' : effect.statusType;
        addFloatingNumber(effect.value, 'buff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65, buffLabel);
        addBuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
        showMessage(`${card.name}: ${buffLabel}+${effect.value}！`);
      } else if (effect.type === 'debuff' && effect.statusType) {
        const debuffLabel = effect.statusType === 'vulnerable' ? '不安' :
                           effect.statusType === 'weak' ? '躊躇' :
                           effect.statusType === 'frail' ? '倦怠' :
                           effect.statusType === 'poison' ? '苦悩' : effect.statusType;
        addFloatingNumber(effect.value, 'debuff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3, debuffLabel);
        addDebuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3);
        showMessage(`${card.name}: ${debuffLabel}付与！`, 'center');
      }
    }

    // 倒した敵のカウント + 撃破エフェクト
    if (result.enemiesKilled.length > 0) {
      setEnemiesKilledThisBattle(prev => prev + result.enemiesKilled.length);

      // 撃破エフェクトを表示
      result.enemiesKilled.forEach((killedIndex) => {
        const killedEnemy = battleState.enemies[killedIndex];
        if (killedEnemy) {
          const enemyType = killedEnemy.isBoss ? 'boss' : killedEnemy.isElite ? 'elite' : 'normal';
          const xOffset = SCREEN_WIDTH / 2 + (killedIndex - (battleState.enemies.length - 1) / 2) * 160;
          addDefeatEffect(xOffset, SCREEN_HEIGHT * 0.3, enemyType);
        }
      });
    }

    // カードを手札から捨て札へ
    const playResult = playCard(hand, discardPile, cardInstance.instanceId);
    setHand(playResult.hand);
    setDiscardPile(playResult.discardPile);

    // コンボチェック（カード使用後）
    checkAndTriggerCombos(card, cardInstance.instanceId);

    // 追加ドロー
    let finalHand = playResult.hand;
    if (result.cardsDrawn > 0) {
      addFloatingNumber(result.cardsDrawn, 'draw', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
      const drawResult = drawCards(drawPile, playResult.discardPile, playResult.hand, result.cardsDrawn);
      setHand(drawResult.hand);
      setDrawPile(drawResult.drawPile);
      setDiscardPile(drawResult.discardPile);
      finalHand = drawResult.hand;
    }

    // エネルギー獲得
    if (result.energyGained > 0) {
      addFloatingNumber(result.energyGained, 'energy', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.5);
    }

    // 勝利判定
    if (isBattleWon({ ...battleState, enemies: result.enemies })) {
      // 勝利フラグを立てる（カード選択を防止）
      setBattleWon(true);
      // ボス撃破時は長めの遅延（エフェクト完了まで）
      const hasBossKill = result.enemiesKilled.some(idx => battleState.enemies[idx]?.isBoss);
      const victoryDelay = hasBossKill ? 2200 : 900;
      setTimeout(() => {
        handleBattleEnd(true);
      }, victoryDelay);
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
      return card.cost <= currentEnergy && canPlayCard(card, currentEnergy, enemies, hp);
    });

    // ストックから打てるカードがあるかチェック
    const canPlayStockCard = currentRunState.stockCards.some((stockCard, index) => {
      if (currentUsedStockIndices.includes(index)) return false;
      return stockCard.cost <= currentEnergy && canPlayCard(stockCard, currentEnergy, enemies, hp);
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
    if (isProcessing || turnPhase !== 'player' || !battleState || battleWon) return;

    setIsProcessing(true);
    setTurnPhase('enemy');
    setSelectedCardIndex(null);

    // ターントラッカーをリセット（次のターン用）
    setTurnTracker(createTurnTracker());

    showMessage('⚔️ 敵のターン！', 'center');

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

        // ダメージ表示（1つのメッセージに統合して重複を防ぐ）
        const damageTaken = prevHp - currentHp;
        const blocked = actionResult.blocked;
        const attackValue = actionResult.attackValue;

        if (attackValue > 0) {
          // 攻撃行動の場合: 統合メッセージで表示
          if (damageTaken > 0 && blocked > 0) {
            // ブロックしたがダメージも受けた
            showMessage(`${enemy.name}の攻撃! 🛡️${blocked}防御 → 💥${damageTaken}ダメージ`, 'center');
            addFloatingNumber(blocked, 'blocked', SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT * 0.65);
            addFloatingNumber(damageTaken, 'damage', SCREEN_WIDTH / 2 + 40, SCREEN_HEIGHT * 0.7);
            playSound('damage');
          } else if (damageTaken > 0) {
            // ブロックなしでダメージを受けた
            showMessage(`${enemy.name}の攻撃! 💥${damageTaken}ダメージ`, 'center');
            addFloatingNumber(damageTaken, 'damage', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.7);
            playSound('damage');
          } else if (blocked > 0) {
            // 完全防御
            showMessage(`${enemy.name}の攻撃! ✨完全防御(${blocked})`, 'center');
            addFloatingNumber(blocked, 'blocked', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
          }
        } else if (actionResult.actionType === 'defend') {
          // 敵の防御
          showMessage(`${enemy.name}が防御態勢！`, 'center');
        } else if (actionResult.actionType === 'buff') {
          // 敵のバフ
          showMessage(`${enemy.name}が自己強化！`, 'center');
          addFloatingNumber(actionResult.buffValue, 'buff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.25, '闘志');
          addBuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.25);
        } else if (actionResult.actionType === 'debuff') {
          // 敵のデバフ（プレイヤーへの）
          showMessage(`${enemy.name}が躊躇をかけてきた！`, 'center');
          addFloatingNumber(actionResult.debuffValue, 'debuff', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65, '虚弱');
          addDebuffEffect(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.65);
        } else {
          showMessage(`${enemy.name}は様子を見ている...`, 'center');
        }

        // HP更新（リアルタイム表示）
        setHp(currentHp);
        setPlayerBlock(currentBlock);

        // 敗北判定
        if (currentHp <= 0) {
          // 敗北時の詳細情報を表示
          const finalDamage = prevHp;  // 残りHPが全て削られた
          showMessage(`💀 ${enemy.name}の攻撃で倒れた...`, 'center');

          // 画面を赤くフラッシュ
          triggerScreenShake(20, 500);

          // より長い遅延を入れて状況を把握させる
          setTimeout(() => {
            handleBattleEnd(false);
          }, 1500);
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
    attackValue: number;  // 敵の攻撃力（バフ・デバフ込み）
    buffValue: number;    // バフ値
    debuffValue: number;  // デバフ値
    playerStatuses: StatusEffect[];
    updatedEnemy: Enemy | null;
    actionType: string;
  } => {
    let newHp = currentHp;
    let newBlock = currentBlock;
    let blocked = 0;
    let attackValue = 0;  // 敵の攻撃力を保存
    let buffValue = 0;
    let debuffValue = 0;
    let newPlayerStatuses = [...playerStatuses];
    let updatedEnemy: Enemy | null = null;
    const actionType = enemy.intent.type;

    switch (enemy.intent.type) {
      case 'attack':
        const attackDamage = enemy.intent.value || 0;
        // 敵の筋力バフを適用
        const strengthBuff = enemy.statuses.find(s => s.type === 'strength')?.stacks || 0;
        let totalDamage = attackDamage + strengthBuff;

        // 敵の躊躇(weak)デバフを適用（与ダメージ25%減少）
        const isEnemyWeak = enemy.statuses.some(s => s.type === 'weak');
        if (isEnemyWeak) {
          totalDamage = Math.floor(totalDamage * 0.75);
        }

        // プレイヤーの脆弱を適用
        const isVulnerable = playerStatuses.some(s => s.type === 'vulnerable');
        const finalDamage = isVulnerable ? Math.floor(totalDamage * 1.5) : totalDamage;

        // 攻撃力を保存（表示用）
        attackValue = finalDamage;

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
        buffValue = enemy.intent.value || 2;
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
        debuffValue = enemy.intent.value || 2;
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
      attackValue,
      buffValue,
      debuffValue,
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
        showMessage(`${enemy.name}に苦悩で${poisonStatus.stacks}ダメージ！`, 'center');

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

    // プレイヤーのステータス効果の持続ターン減少
    let processedPlayerStatuses = playerStatuses.map(s => {
      if (s.duration && s.duration > 1) {
        return { ...s, duration: s.duration - 1 };
      } else if (s.duration === 1) {
        // 持続ターン切れ - スタックを0にしてフィルタで除去
        return { ...s, stacks: 0 };
      }
      return s;
    }).filter(s => s.stacks > 0);

    const newBattleState: BattleState = {
      ...battleState!,
      enemies: enemiesWithNewIntent,
      playerStatuses: processedPlayerStatuses,
      turn: battleState!.turn + 1,
      playerBlock: 0,
      isPlayerTurn: true,
    };

    setHp(finalHp);
    setPlayerBlock(0);
    setBattleState(newBattleState);

    checkBattleEndAndContinue({ hp: finalHp, battleState: newBattleState });
  };

  // 次の敵行動を選択（敵テンプレートから正しく選択）
  const selectNextIntent = (enemy: Enemy): Enemy['intent'] => {
    return selectNextIntentFromTemplate(enemy);
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
    onBattleEnd(victory, updatedRunState, enemiesKilledThisBattle);
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
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: screenShakeAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* ヘッダー（コンパクト） */}
      <View style={styles.header}>
        {/* デバッグ用戻るボタン */}
        {onDebugExit && (
          <TouchableOpacity style={styles.debugExitButton} onPress={onDebugExit}>
            <Text style={styles.debugExitText}>← 中断</Text>
          </TouchableOpacity>
        )}
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

      {/* メッセージ（全て真ん中・オレンジ枠） */}
      <View style={styles.messageContainerCenter}>
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            style={[
              styles.messageItem,
              {
                opacity: msg.opacity,
                top: msg.offsetIndex * 32,
              }
            ]}
          >
            <Text style={styles.messageTextCenter}>{msg.text}</Text>
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

      {/* コンボ演出 */}
      <ComboDisplay
        comboResult={activeCombo}
        onComplete={handleComboComplete}
      />

      {/* ダメージエフェクト（SVG版） */}
      {activeDamageEffects.map(effect => (
        <DamageEffectSvg
          key={effect.id}
          damage={effect.damage}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeDamageEffect(effect.id)}
        />
      ))}

      {/* 敵撃破エフェクト（SVG版） */}
      {activeDefeatEffects.map(effect => (
        <DefeatEffectSvg
          key={effect.id}
          x={effect.x}
          y={effect.y}
          enemyType={effect.enemyType}
          onComplete={() => removeDefeatEffect(effect.id)}
        />
      ))}

      {/* ブロックエフェクト */}
      {activeBlockEffects.map(effect => (
        <BlockEffectSvg
          key={effect.id}
          block={effect.block}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeBlockEffect(effect.id)}
        />
      ))}

      {/* 回復エフェクト */}
      {activeHealEffects.map(effect => (
        <HealEffectSvg
          key={effect.id}
          heal={effect.heal}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeHealEffect(effect.id)}
        />
      ))}

      {/* バフエフェクト */}
      {activeBuffEffects.map(effect => (
        <BuffEffectSvg
          key={effect.id}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeBuffEffect(effect.id)}
        />
      ))}

      {/* デバフエフェクト */}
      {activeDebuffEffects.map(effect => (
        <DebuffEffectSvg
          key={effect.id}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeDebuffEffect(effect.id)}
        />
      ))}

      {/* カード使用エフェクト */}
      {activeCardPlayEffects.map(effect => (
        <CardPlayEffectSvg
          key={effect.id}
          cardType={effect.cardType}
          x={effect.x}
          y={effect.y}
          onComplete={() => removeCardPlayEffect(effect.id)}
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
              const canPlay = canPlayCard(stockCard, energy, battleState.enemies, hp);
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
              disabled={!canPlayCard(cardInstance.card, energy, battleState.enemies, hp) || turnPhase !== 'player' || isProcessing}
              selected={selectedCardIndex === index}
              playerStatuses={battleState.playerStatuses}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
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
  // デバッグ用戻るボタン
  debugExitButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f66',
  },
  debugExitText: {
    color: '#f88',
    fontSize: 12,
    fontWeight: 'bold',
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
  // 敵メッセージ（上部）
  messageContainerTop: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  // システムメッセージ（真ん中）
  messageContainerCenter: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  // プレイヤーメッセージ（下部）
  messageContainerBottom: {
    position: 'absolute',
    bottom: 520,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  messageItem: {
    position: 'absolute',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: SCREEN_WIDTH - 40,
  },
  messageTextCenter: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    maxWidth: SCREEN_WIDTH - 32,
  },
  // フローティングダメージ
  floatingNumber: {
    position: 'absolute',
    zIndex: 200,
    alignItems: 'center',
  },
  floatingNumberText: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
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
