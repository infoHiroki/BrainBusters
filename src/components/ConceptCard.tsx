import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Concept } from '../data/concepts';
import { getCategoryGradient, getCategoryName } from '../utils/battle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

interface ConceptCardProps {
  concept: Concept;
  power: number;
  isWinner?: boolean;
  isLoser?: boolean;
  showResult?: boolean;
  scale?: Animated.Value;
  translateY?: Animated.Value;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  power,
  isWinner,
  isLoser,
  showResult = false,
  scale,
  translateY,
}) => {
  const gradientColors = getCategoryGradient(concept.category);
  const isQuote = concept.category === 'quote';

  const displayWinner = showResult && isWinner;
  const displayLoser = showResult && isLoser;

  const transforms: Animated.WithAnimatedObject<any>[] = [];
  if (scale) transforms.push({ scale });
  if (translateY) transforms.push({ translateY });

  const cardStyle = transforms.length > 0
    ? [styles.cardOuter, { transform: transforms }]
    : [styles.cardOuter];

  return (
    <Animated.View style={cardStyle}>
      <LinearGradient
        colors={
          displayWinner
            ? ['#FFD700' + '60', '#FFA500' + '80']
            : displayLoser
            ? [gradientColors[0] + '20', gradientColors[1] + '30']
            : [gradientColors[0] + '40', gradientColors[1] + '60']
        }
        style={[
          styles.card,
          {
            borderColor: displayWinner ? '#FFD700' : gradientColors[0],
            opacity: displayLoser ? 0.6 : 1,
          },
          displayWinner && styles.winnerCard,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* カテゴリバッジ */}
        <View style={[styles.categoryBadge, { backgroundColor: gradientColors[0] }]}>
          <Text style={styles.categoryText}>{getCategoryName(concept.category)}</Text>
        </View>

        {/* 概念名 */}
        <View style={styles.nameContainer}>
          {isQuote && <Text style={styles.quoteMarks}>"</Text>}
          <Text
            style={[
              styles.conceptName,
              isQuote && styles.quoteName,
              concept.name.length > 10 && styles.smallerName,
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {concept.name}
          </Text>
          {isQuote && <Text style={styles.quoteMarksEnd}>"</Text>}
        </View>

        {/* 作者（発言の場合） */}
        {concept.author && (
          <Text style={styles.author}>— {concept.author}</Text>
        )}

        {/* 一言説明 */}
        <Text style={styles.description} numberOfLines={1}>
          {concept.description}
        </Text>

        {/* パワー表示 */}
        <View style={styles.powerContainer}>
          <Text style={[styles.powerValue, displayWinner && styles.winnerPower]}>
            {power}
          </Text>
        </View>

        {/* 勝者エフェクト */}
        {displayWinner && (
          <Text style={styles.crownIcon}>👑</Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: CARD_WIDTH,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#1a1a2e',
    position: 'relative',
  },
  winnerCard: {
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  conceptName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1,
  },
  smallerName: {
    fontSize: 22,
  },
  quoteName: {
    fontStyle: 'italic',
  },
  quoteMarks: {
    color: '#666',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 4,
  },
  quoteMarksEnd: {
    color: '#666',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  author: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  powerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  powerValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  winnerPower: {
    color: '#FFD700',
  },
  crownIcon: {
    position: 'absolute',
    top: -15,
    fontSize: 28,
  },
});
