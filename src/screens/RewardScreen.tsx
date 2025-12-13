// 報酬画面
// 戦闘勝利後のカード選択・報酬獲得

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, Relic } from '../types/game';
import { BattleCard } from '../components/BattleCard';
import { generateRewardCards } from '../data/cards';
import { getRandomRelicByRarity, getRelicPrice } from '../data/relics';
import { getRarityColor } from '../data/concepts';

interface RewardScreenProps {
  runState: RunState;
  isBossReward?: boolean;
  goldReward: number;
  onSelectCard: (card: Card) => void;
  onSelectRelic?: (relic: Relic) => void;
  onSkip: () => void;
  onTakeGold: () => void;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({
  runState,
  isBossReward = false,
  goldReward,
  onSelectCard,
  onSelectRelic,
  onSkip,
  onTakeGold,
}) => {
  const [goldTaken, setGoldTaken] = useState(true); // 自動取得
  const [selectedCard, setSelectedCard] = useState<Card | null>(null); // 選択中のカード（再選択可能）
  const [relicTaken, setRelicTaken] = useState(false);

  // ゴールド自動取得
  useEffect(() => {
    onTakeGold();
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

  // 「次の階へ進む」ボタン押下時にカードを確定
  const handleProceed = () => {
    if (selectedCard) {
      onSelectCard(selectedCard);
    }
    onSkip();
  };

  const canProceed = goldTaken;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* タイトル */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isBossReward ? 'ボス撃破！' : '勝利！'}
        </Text>
        <Text style={styles.subtitle}>報酬を選択してください</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* ゴールド報酬（自動取得） */}
        <View style={styles.rewardSection}>
          <View style={styles.goldRewardAuto}>
            <Text style={styles.goldText}>💰 +{goldReward} ゴールド獲得！</Text>
          </View>
        </View>

        {/* カード報酬 */}
        <View style={styles.rewardSection}>
          <Text style={styles.sectionTitle}>カードを1枚選択（任意・再選択可）</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
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
            <Text style={styles.selectedMessage}>「{selectedCard.name}」を選択中（進むボタンで確定）</Text>
          )}
        </View>

        {/* レリック報酬（ボス戦のみ） */}
        {isBossReward && relicReward && (
          <View style={styles.rewardSection}>
            <Text style={styles.sectionTitle}>ボスレリック</Text>
            <TouchableOpacity
              style={[styles.relicReward, relicTaken && styles.rewardTaken]}
              onPress={handleSelectRelic}
              disabled={relicTaken}
            >
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
              {relicTaken && <Text style={styles.takenText}>獲得済み</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 進むボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, !canProceed && styles.buttonDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
        >
          <LinearGradient
            colors={canProceed ? ['#6C5CE7', '#5849BE'] : ['#444', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {runState.floor >= 15 ? 'クリア！' : selectedCard ? `${selectedCard.name}を獲得して進む` : '次の階へ進む'}
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
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  rewardSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  goldRewardAuto: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2ecc71',
    alignItems: 'center',
  },
  goldText: {
    color: '#2ecc71',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardTaken: {
    opacity: 0.5,
    borderColor: '#666',
  },
  takenText: {
    color: '#2ecc71',
    fontSize: 12,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 12,
  },
  cardReward: {
    alignItems: 'center',
  },
  cardSelected: {
    transform: [{ scale: 1.05 }],
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
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
  },
  relicReward: {
    flexDirection: 'row',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9b59b6',
    alignItems: 'center',
  },
  relicIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  relicEmoji: {
    fontSize: 24,
  },
  relicInfo: {
    flex: 1,
  },
  relicName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  relicDescription: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  relicRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 500,
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
