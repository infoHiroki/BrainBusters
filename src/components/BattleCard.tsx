// バトル用カードコンポーネント
// TCG風デザイン - 将来の画像追加を想定

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

// デフォルトカードサイズ
const DEFAULT_CARD_WIDTH = 150;
const DEFAULT_CARD_HEIGHT = 215;

interface BattleCardProps {
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  playerStatuses?: StatusEffect[];
  scale?: Animated.Value;
  cardWidth?: number;  // カスタムサイズ
  cardHeight?: number;
}

export const BattleCard: React.FC<BattleCardProps> = ({
  card,
  onPress,
  disabled = false,
  selected = false,
  playerStatuses = [],
  scale,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
}) => {
  const typeColor = getCardTypeColor(card.type);
  const rarityColor = getRarityColor(card.rarity);
  const description = getCardDescription(card, playerStatuses);

  // サイズ比率を計算（デフォルトサイズ150に対する比率）
  const sizeRatio = cardWidth / 150;

  // カードタイプに応じたイラストエリアの背景
  const getArtGradient = (): [string, string, string] => {
    switch (card.type) {
      case 'attack':
        return ['#8B0000', '#DC143C', '#FF4500']; // 赤〜オレンジ
      case 'defense':
        return ['#00008B', '#4169E1', '#00CED1']; // 青系
      case 'skill':
        return ['#006400', '#228B22', '#32CD32']; // 緑系
      default:
        return ['#4B0082', '#8B008B', '#DA70D6']; // 紫系
    }
  };

  // レアリティに応じた枠の輝き
  const getFrameStyle = () => {
    // 強化済みカードは緑の輝き
    if (card.upgraded && !selected) {
      return {
        borderColor: '#2ECC71',
        shadowColor: '#2ECC71',
        shadowOpacity: 0.7,
        shadowRadius: 8,
      };
    }
    if (selected) {
      return {
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOpacity: 1,
        shadowRadius: 15,
      };
    }
    switch (card.rarity) {
      case 5: // レジェンダリー
        return {
          borderColor: '#FFD700',
          shadowColor: '#FFD700',
          shadowOpacity: 0.8,
          shadowRadius: 10,
        };
      case 4: // エピック
        return {
          borderColor: '#9932CC',
          shadowColor: '#9932CC',
          shadowOpacity: 0.6,
          shadowRadius: 8,
        };
      case 3: // レア
        return {
          borderColor: '#3498db',
          shadowColor: '#3498db',
          shadowOpacity: 0.4,
          shadowRadius: 6,
        };
      default:
        return {
          borderColor: '#555',
          shadowOpacity: 0,
          shadowRadius: 0,
        };
    }
  };

  const frameStyle = getFrameStyle();

  const cardContent = (
    <View style={[
      styles.cardFrame,
      {
        width: cardWidth,
        height: cardHeight,
        borderColor: frameStyle.borderColor,
        shadowColor: frameStyle.shadowColor,
        shadowOpacity: frameStyle.shadowOpacity,
        shadowRadius: frameStyle.shadowRadius,
      },
      disabled && styles.cardDisabled,
      selected && styles.cardSelected,
    ]}>
      {/* カード内側 */}
      <View style={styles.cardInner}>
        {/* コストバッジ（左上に重ねて表示） */}
        <View style={[styles.costBadge, {
          backgroundColor: typeColor,
          width: 26 * sizeRatio,
          height: 26 * sizeRatio,
          borderRadius: 13 * sizeRatio,
        }]}>
          <Text style={[styles.costText, { fontSize: 14 * sizeRatio }]}>{card.cost}</Text>
        </View>

        {/* 強化済みバッジ（右上） */}
        {card.upgraded && (
          <View style={[styles.upgradedBadge, {
            width: 20 * sizeRatio,
            height: 20 * sizeRatio,
            borderRadius: 10 * sizeRatio,
          }]}>
            <Text style={[styles.upgradedText, { fontSize: 14 * sizeRatio }]}>+</Text>
          </View>
        )}

        {/* イラストエリア（将来画像を入れる場所） */}
        <LinearGradient
          colors={getArtGradient()}
          style={[styles.artArea, { height: 70 * sizeRatio }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* プレースホルダー: カテゴリアイコン的な表示 */}
          <Text style={[styles.artPlaceholder, { fontSize: 36 * sizeRatio }]}>
            {card.type === 'attack' ? '⚔️' : card.type === 'defense' ? '🛡️' : '✨'}
          </Text>
        </LinearGradient>

        {/* カード名バナー */}
        <View style={[styles.nameBanner, {
          backgroundColor: typeColor,
          minHeight: 28 * sizeRatio,
          paddingVertical: 3 * sizeRatio,
          paddingHorizontal: 6 * sizeRatio,
        }]}>
          <Text style={[styles.cardName, { fontSize: 11 * sizeRatio }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {card.name}
          </Text>
        </View>

        {/* タイプ表示 */}
        <View style={[styles.typeRow, { paddingVertical: 3 * sizeRatio }]}>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={[styles.typeText, { fontSize: 9 * sizeRatio }]}>{getCardTypeName(card.type)}</Text>
          </View>
          <View style={[styles.rarityStars]}>
            <Text style={[styles.rarityText, { color: rarityColor, fontSize: 9 * sizeRatio }]}>
              {'★'.repeat(card.rarity)}
            </Text>
          </View>
        </View>

        {/* 効果テキストエリア */}
        <View style={styles.effectArea}>
          <Text style={[styles.effectText, { fontSize: 10 * sizeRatio, lineHeight: 13 * sizeRatio }]} numberOfLines={3}>
            {description}
          </Text>
        </View>
      </View>
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
  cardFrame: {
    // width/heightは動的に設定
    borderRadius: 12,
    borderWidth: 3,
    backgroundColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    overflow: 'hidden', // 内容がはみ出さないように
  },
  cardDisabled: {
    opacity: 0.4,
  },
  cardSelected: {
    // 拡大なし、枠の色で選択状態を示す
    elevation: 20,
  },
  cardInner: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
  },
  // コストバッジ
  costBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  costText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // 強化済みバッジ
  upgradedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  upgradedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // イラストエリア
  artArea: {
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artPlaceholder: {
    fontSize: 42,
    opacity: 0.9,
  },
  // カード名バナー
  nameBanner: {
    minHeight: 34,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
  },
  cardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // タイプ行
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0a0a1a',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityStars: {
    flexDirection: 'row',
  },
  rarityText: {
    fontSize: 10,
    letterSpacing: -1,
  },
  // 効果エリア
  effectArea: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 8,
    justifyContent: 'center',
  },
  effectText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
});
