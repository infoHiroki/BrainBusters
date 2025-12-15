// 報酬画面
// 戦闘勝利後のカード選択・報酬獲得

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, Relic } from '../types/game';
import { BattleCard } from '../components/BattleCard';
import { generateRewardCards } from '../data/cards';
import { getRandomRelicByRarity } from '../data/relics';
import { getRarityColor } from '../data/concepts';
import { PsychedelicEffect } from '../components/effects';

interface RewardScreenProps {
  runState: RunState;
  isBossReward?: boolean;
  goldReward: number;
  onSelectCard: (card: Card) => Promise<void>;
  onSetStockCard: (card: Card) => Promise<void>;
  onReplaceStockCard: (index: number, newCard: Card) => Promise<void>;
  onSelectRelic?: (relic: Relic) => void;
  onSkip: () => void;
  onTakeGold: () => void;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({
  runState,
  isBossReward = false,
  goldReward,
  onSelectCard,
  onSetStockCard,
  onReplaceStockCard,
  onSelectRelic,
  onSkip,
  onTakeGold,
}) => {
  const [goldTaken, setGoldTaken] = useState(true); // 自動取得
  const [selectedCard, setSelectedCard] = useState<Card | null>(null); // 選択中のカード（再選択可能）
  const [relicTaken, setRelicTaken] = useState(false);
  const [cardAction, setCardAction] = useState<'deck' | 'stock'>('stock'); // デフォルトはストック
  const [isReplacingStock, setIsReplacingStock] = useState(false); // ストック交換モード
  const [selectedStockIndex, setSelectedStockIndex] = useState<number | null>(null); // 交換対象のストックインデックス
  const [isProcessing, setIsProcessing] = useState(false); // 処理中フラグ（連打防止）

  // ゴールド自動取得
  useEffect(() => {
    onTakeGold();
  }, []);

  // ボスレリック自動獲得
  useEffect(() => {
    if (isBossReward && relicRewardRef.current && !relicTaken && onSelectRelic) {
      setRelicTaken(true);
      onSelectRelic(relicRewardRef.current);
    }
  }, [isBossReward, relicTaken, onSelectRelic]);

  // ===== タイトルアニメーション =====
  const titleScale = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // タイトル演出（バウンス + パルス）
    Animated.sequence([
      Animated.delay(100),
      Animated.spring(titleScale, {
        toValue: 1.2,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // タイトルパルス（常時）
    Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(titlePulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // カード報酬を生成（初回のみ）
  const cardRewardsRef = useRef<Card[] | null>(null);
  if (!cardRewardsRef.current) {
    cardRewardsRef.current = generateRewardCards(runState.floor);
  }
  const cardRewards = cardRewardsRef.current;

  // レリック報酬（ボス戦のみ、初回生成時に固定）
  const relicRewardRef = useRef<Relic | null | undefined>(undefined);
  if (relicRewardRef.current === undefined) {
    if (isBossReward) {
      const ownedRelicIds = runState.relics.map(r => r.id);
      relicRewardRef.current = getRandomRelicByRarity(ownedRelicIds);
    } else {
      relicRewardRef.current = null;
    }
  }
  const relicReward = relicRewardRef.current;

  const handleTakeGold = () => {
    if (goldTaken) return;
    setGoldTaken(true);
    onTakeGold();
  };

  // カードタップ → 選択（まだ確定しない、再選択可能）
  const handleCardSelect = (card: Card) => {
    // 同じカードをタップしたら選択解除
    if (selectedCard && selectedCard.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleSelectRelic = () => {
    if (relicTaken || !relicReward || !onSelectRelic) return;
    setRelicTaken(true);
    onSelectRelic(relicReward);
  };

  const canProceed = goldTaken;
  const stockIsFull = runState.stockCards.length >= 5;

  // ストック交換モードへ切り替え
  const handleEnterReplaceMode = () => {
    setIsReplacingStock(true);
    setSelectedStockIndex(null);
  };

  // ストック交換モードをキャンセル
  const handleCancelReplace = () => {
    setIsReplacingStock(false);
    setSelectedStockIndex(null);
  };

  // 交換対象のストックカードを選択
  const handleSelectStockForReplace = (index: number) => {
    setSelectedStockIndex(index === selectedStockIndex ? null : index);
  };

  // 「次の階へ進む」ボタン押下時にカードを確定
  const handleProceed = async () => {
    // 連打防止：処理中なら何もしない
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (selectedCard) {
        if (isReplacingStock && selectedStockIndex !== null) {
          // ストック交換
          await onReplaceStockCard(selectedStockIndex, selectedCard);
        } else if (!stockIsFull) {
          // ストックに追加
          await onSetStockCard(selectedCard);
        }
      }
      onSkip();
    } catch (error) {
      console.error('報酬処理エラー:', error);
      setIsProcessing(false);
    }
    // onSkip後は画面遷移するのでisProcessingをリセットしない
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* SVGサイケデリックエフェクト */}
      <PsychedelicEffect isBoss={isBossReward} />

      {/* タイトル */}
      <View style={styles.header}>
        <Animated.View
          style={{
            transform: [
              { scale: Animated.multiply(titleScale, titlePulse) },
            ],
          }}
        >
          {isBossReward ? (
            <Text style={styles.psychedelicBossTitle}>BOSS{'\n'}DEFEATED!</Text>
          ) : (
            <Text style={styles.psychedelicTitle}>VICTORY!</Text>
          )}
        </Animated.View>
        <Text style={styles.subtitle}>報酬を選択してください</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* ボス撃破時HP全回復 */}
        {isBossReward && (
          <View style={styles.rewardSection}>
            <View style={styles.healRewardAuto}>
              <Text style={styles.healText}>💚 HP全回復！</Text>
              <Text style={styles.healTotalText}>HP: {runState.maxHp} / {runState.maxHp}</Text>
            </View>
          </View>
        )}

        {/* ゴールド報酬（自動取得） */}
        <View style={styles.rewardSection}>
          <View style={styles.goldRewardAuto}>
            <Text style={styles.goldText}>💰 +{goldReward} ゴールド獲得！</Text>
            <Text style={styles.goldTotalText}>所持金: {runState.gold + goldReward} G</Text>
          </View>
        </View>

        {/* カード報酬 */}
        <View style={styles.rewardSection}>
          <Text style={styles.sectionTitle}>カードを1枚選択（任意・再選択可）</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardScrollView}
          >
            {cardRewards.map((card, index) => {
              const isSelected = selectedCard !== null && selectedCard.id === card.id;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.cardReward, isSelected && styles.cardSelected]}
                  onPress={() => handleCardSelect(card)}
                >
                  <BattleCard card={card} selected={isSelected} />
                  <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(card.rarity) }]}>
                    <Text style={styles.rarityText}>{'★'.repeat(card.rarity)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selectedCard && (
            <View style={styles.cardActionContainer}>
              <Text style={styles.selectedMessage}>「{selectedCard.name}」を選択中</Text>
              {stockIsFull && !isReplacingStock ? (
                <View style={styles.stockFullContainer}>
                  <Text style={styles.stockWarning}>⚠️ ストックが満杯です（5枚）</Text>
                  <TouchableOpacity style={styles.replaceButton} onPress={handleEnterReplaceMode}>
                    <Text style={styles.replaceButtonText}>🔄 ストックと交換する</Text>
                  </TouchableOpacity>
                </View>
              ) : !isReplacingStock ? (
                <Text style={styles.stockInfo}>📦 ストック: {runState.stockCards.length}/5 - 戦闘中いつでも使用可能！</Text>
              ) : null}
            </View>
          )}

          {/* ストック交換モード */}
          {isReplacingStock && selectedCard && (
            <View style={styles.replaceSection}>
              <Text style={styles.replaceSectionTitle}>🔄 交換するストックカードを選択</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stockCardRow}
              >
                {runState.stockCards.map((stockCard, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.stockCardItem}
                    onPress={() => handleSelectStockForReplace(index)}
                  >
                    <BattleCard card={stockCard} selected={selectedStockIndex === index} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelReplaceButton} onPress={handleCancelReplace}>
                <Text style={styles.cancelReplaceText}>✕ キャンセル</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* レリック報酬（ボス戦のみ・自動獲得） */}
        {isBossReward && relicReward && (
          <View style={styles.rewardSection}>
            <Text style={styles.sectionTitle}>✨ ボスレリック獲得！</Text>
            <View style={[styles.relicReward, styles.relicAcquired]}>
              <View style={styles.relicIcon}>
                <Text style={styles.relicEmoji}>🏆</Text>
              </View>
              <View style={styles.relicInfo}>
                <Text style={styles.relicName}>{relicReward.name}</Text>
                <Text style={styles.relicDescription}>{relicReward.description}</Text>
                <Text style={[styles.relicRarity, { color: getRelicRarityColor(relicReward.rarity) }]}>
                  {relicReward.rarity.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 進むボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, (!canProceed || isProcessing) && styles.buttonDisabled]}
          onPress={handleProceed}
          disabled={!canProceed || isProcessing}
        >
          <LinearGradient
            colors={canProceed ? ['#6C5CE7', '#5849BE'] : ['#444', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {runState.floor >= 50
                ? 'クリア！'
                : isReplacingStock && selectedCard && selectedStockIndex !== null
                  ? `🔄 ${runState.stockCards[selectedStockIndex]?.name} と交換`
                  : selectedCard && !stockIsFull
                    ? `📦 ${selectedCard.name}をストック`
                    : '次の階へ進む'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getRelicRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '#9CA3AF';
    case 'uncommon': return '#3B82F6';
    case 'rare': return '#F59E0B';
    case 'boss': return '#EF4444';
    default: return '#9CA3AF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
  },
  header: {
    zIndex: 200,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
  },
  psychedelicTitle: {
    color: '#00FFFF',
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    letterSpacing: 6,
    textAlign: 'center',
  },
  psychedelicBossTitle: {
    color: '#FF00FF',
    fontSize: 42,
    fontWeight: 'bold',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 35,
    letterSpacing: 8,
    textAlign: 'center',
    lineHeight: 52,
  },
  victoryTitle: {
    color: '#4ECDC4',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(78, 205, 196, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bossTitle: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    flex: 1,
    width: '100%',
    zIndex: 100,
  },
  contentContainer: {
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'visible',
  },
  rewardSection: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 560,  // カードサイズ拡大に対応
    overflow: 'visible',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  healRewardAuto: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#27ae60',
    alignItems: 'center',
  },
  healText: {
    color: '#27ae60',
    fontSize: 18,
    fontWeight: 'bold',
  },
  healTotalText: {
    color: '#2ecc71',
    fontSize: 14,
    marginTop: 4,
  },
  goldRewardAuto: {
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f1c40f',
    alignItems: 'center',
  },
  goldText: {
    color: '#f1c40f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goldTotalText: {
    color: '#f39c12',
    fontSize: 14,
    marginTop: 4,
  },
  rewardTaken: {
    opacity: 0.5,
    borderColor: '#666',
  },
  relicAcquired: {
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  acquiredBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  acquiredText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  acquireButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  acquireButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  takenText: {
    color: '#2ecc71',
    fontSize: 12,
    marginTop: 4,
  },
  cardScrollView: {
    overflow: 'visible',
    marginHorizontal: -8,
  },
  cardRow: {
    flexDirection: 'row',
    paddingTop: 30,  // 選択時の拡大用スペース
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 16,
    overflow: 'visible',
  },
  cardReward: {
    alignItems: 'center',
    padding: 8,
    overflow: 'visible',
  },
  cardSelected: {
    // BattleCardのselected propで枠が光るため、ここでは追加スタイルなし
  },
  rarityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
  },
  selectedMessage: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cardActionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  actionToggle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#666',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
    borderColor: '#6C5CE7',
  },
  actionButtonDisabled: {
    opacity: 0.4,
    borderColor: '#444',
  },
  actionButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  actionButtonTextDisabled: {
    color: '#555',
  },
  stockWarning: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  stockInfo: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  stockFullContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  replaceButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  replaceButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  replaceSection: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  replaceSectionTitle: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stockCardRow: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  stockCardItem: {
    alignItems: 'center',
  },
  stockCardSelected: {
    // BattleCardのselected propで処理
  },
  cancelReplaceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  cancelReplaceText: {
    color: '#888',
    fontSize: 14,
  },
  relicReward: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  relicIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  relicEmoji: {
    fontSize: 40,
  },
  relicInfo: {
    alignItems: 'center',
  },
  relicName: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  relicDescription: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  relicRarity: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 500,
    zIndex: 100,
  },
  proceedButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
