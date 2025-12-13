// バトル用カードコンポーネント
// 手札に表示されるカード

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, StatusEffect } from '../types/game';
import { getCardTypeColor, getCardTypeName, getCardDescription } from '../utils/cardEffects';
import { getRarityColor } from '../data/concepts';

interface BattleCardProps {
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  playerStatuses?: StatusEffect[];
  scale?: Animated.Value;
}

export const BattleCard: React.FC<BattleCardProps> = ({
  card,
  onPress,
  disabled = false,
  selected = false,
  playerStatuses = [],
  scale,
}) => {
  const typeColor = getCardTypeColor(card.type);
  const rarityColor = getRarityColor(card.rarity);
  const description = getCardDescription(card, playerStatuses);

  // カードタイプに応じた背景色
  const getCardGradient = (): [string, string] => {
    if (disabled) return ['#333', '#222'];
    switch (card.type) {
      case 'attack':
        return ['#4a2a2a', '#3a1a1a']; // 赤系
      case 'defense':
        return ['#2a3a4a', '#1a2a3a']; // 青系
      case 'skill':
        return ['#2a4a2a', '#1a3a1a']; // 緑系
      default:
        return ['#2a2a4e', '#1a1a3e'];
    }
  };

  const cardContent = (
    <View style={[
      styles.card,
      disabled && styles.cardDisabled,
      selected && styles.cardSelected,
      { borderColor: selected ? '#FFD700' : typeColor },
    ]}>
      {/* コスト */}
      <View style={[styles.costContainer, { backgroundColor: typeColor }]}>
        <Text style={styles.costText}>{card.cost}</Text>
      </View>

      {/* カード本体 */}
      <LinearGradient
        colors={getCardGradient()}
        style={styles.cardGradient}
      >
        {/* レアリティバー */}
        <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />

        {/* カード名 */}
        <Text style={styles.cardName} numberOfLines={1}>
          {card.name}
        </Text>

        {/* タイプ */}
        <View style={[styles.typeContainer, { backgroundColor: typeColor }]}>
          <Text style={styles.typeText}>
            {getCardTypeName(card.type)}
          </Text>
        </View>

        {/* 効果説明 */}
        <Text style={styles.descriptionText} numberOfLines={3}>
          {description}
        </Text>

        {/* フレーバーテキスト */}
        {card.flavorText && (
          <Text style={styles.flavorText} numberOfLines={1}>
            {card.flavorText}
          </Text>
        )}
      </LinearGradient>
    </View>
  );

  if (scale) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || !onPress}
          activeOpacity={0.8}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.8}
    >
      {cardContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  cardSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.08 }, { translateY: -10 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  costContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  costText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardGradient: {
    flex: 1,
    padding: 8,
    paddingTop: 12,
  },
  rarityBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 18,
  },
  typeContainer: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
  flavorText: {
    color: '#999',
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
