// 報酬画面
// 戦闘勝利後のカード選択・報酬獲得

import React, { useState, useMemo } from 'react';
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
  const [goldTaken, setGoldTaken] = useState(false);
  const [cardTaken, setCardTaken] = useState(false);
  const [relicTaken, setRelicTaken] = useState(false);

  // カード報酬を生成
  const cardRewards = useMemo(() => {
    return generateRewardCards(runState.floor);
  }, [runState.floor]);

  // レリック報酬（ボス戦のみ）
  const relicReward = useMemo(() => {
    if (!isBossReward) return null;
    const ownedRelicIds = runState.relics.map(r => r.id);
    return getRandomRelicByRarity(ownedRelicIds);
  }, [isBossReward, runState.relics]);

  const handleTakeGold = () => {
    if (goldTaken) return;
    setGoldTaken(true);
    onTakeGold();
  };

  const handleSelectCard = (card: Card) => {
    if (cardTaken) return;
    setCardTaken(true);
    onSelectCard(card);
  };

  const handleSelectRelic = () => {
    if (relicTaken || !relicReward || !onSelectRelic) return;
    setRelicTaken(true);
    onSelectRelic(relicReward);
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
        {/* ゴールド報酬 */}
        <View style={styles.rewardSection}>
          <Text style={styles.sectionTitle}>ゴールド</Text>
          <TouchableOpacity
            style={[styles.goldReward, goldTaken && styles.rewardTaken]}
            onPress={handleTakeGold}
            disabled={goldTaken}
          >
            <Text style={styles.goldText}>💰 {goldReward} ゴールド</Text>
            {goldTaken && <Text style={styles.takenText}>獲得済み</Text>}
          </TouchableOpacity>
        </View>

        {/* カード報酬 */}
        <View style={styles.rewardSection}>
          <Text style={styles.sectionTitle}>カードを1枚選択（任意）</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {cardRewards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.cardReward, cardTaken && styles.rewardTaken]}
                onPress={() => handleSelectCard(card)}
                disabled={cardTaken}
              >
                <BattleCard card={card} disabled={cardTaken} />
                <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(card.rarity) }]}>
                  <Text style={styles.rarityText}>{'★'.repeat(card.rarity)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {cardTaken && (
            <Text style={styles.takenMessage}>カードをデッキに追加しました</Text>
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
          onPress={onSkip}
          disabled={!canProceed}
        >
          <LinearGradient
            colors={canProceed ? ['#6C5CE7', '#5849BE'] : ['#444', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {runState.floor >= 15 ? 'クリア！' : '次の階へ進む'}
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
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
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
  goldReward: {
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f1c40f',
    alignItems: 'center',
  },
  goldText: {
    color: '#f1c40f',
    fontSize: 20,
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
  takenMessage: {
    color: '#2ecc71',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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
