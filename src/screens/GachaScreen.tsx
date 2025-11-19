import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerData, pullGacha } from '../store/playerStore';
import { Concept } from '../data/concepts';
import { ConceptCard } from '../components/ConceptCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GachaScreenProps {
  playerData: PlayerData;
  onGachaPulled: (newData: PlayerData) => void;
  onBack: () => void;
}

export const GachaScreen: React.FC<GachaScreenProps> = ({
  playerData,
  onGachaPulled,
  onBack,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [result, setResult] = useState<{
    concept: Concept;
    isNew: boolean;
    leveledUp: boolean;
  } | null>(null);

  const cardScale = useState(new Animated.Value(0))[0];
  const glowOpacity = useState(new Animated.Value(0))[0];

  const handlePullGacha = async () => {
    if (playerData.points < 10) {
      return;
    }

    setIsPulling(true);
    setResult(null);

    // リセット
    cardScale.setValue(0);
    glowOpacity.setValue(0);

    try {
      const { newData, pulledConcept, isNew, leveledUp } = await pullGacha(playerData);

      // アニメーション
      Animated.sequence([
        // カードが現れる
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        // レア度が高い場合は輝く
        Animated.timing(glowOpacity, {
          toValue: pulledConcept.rarity >= 4 ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsPulling(false);
      });

      setResult({ concept: pulledConcept, isNew, leveledUp });
      onGachaPulled(newData);
    } catch (error) {
      console.error('Gacha error:', error);
      setIsPulling(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>概念召喚</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>所持ポイント</Text>
          <Text style={styles.pointsValue}>{playerData.points}</Text>
        </View>
      </View>

      {/* メインエリア */}
      <View style={styles.mainArea}>
        {result ? (
          <View style={styles.resultContainer}>
            {/* 輝くエフェクト */}
            {result.concept.rarity >= 4 && (
              <Animated.View
                style={[
                  styles.glowEffect,
                  {
                    opacity: glowOpacity,
                    backgroundColor:
                      result.concept.rarity === 5 ? '#FFD700' : '#A855F7',
                  },
                ]}
              />
            )}

            {/* NEW / LEVEL UP バッジ */}
            {(result.isNew || result.leveledUp) && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: result.isNew ? '#4CAF50' : '#FF9800',
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {result.isNew ? 'NEW!' : 'LEVEL UP!'}
                </Text>
              </View>
            )}

            {/* バトルと同じConceptCard */}
            <ConceptCard
              concept={result.concept}
              power={result.concept.basePower}
              scale={cardScale}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              ボタンを押して{'\n'}概念を召喚せよ
            </Text>
            <Text style={styles.costInfo}>1回 10ポイント</Text>
          </View>
        )}
      </View>

      {/* ガチャボタン */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.gachaButton,
            (isPulling || playerData.points < 10) && styles.buttonDisabled,
          ]}
          onPress={handlePullGacha}
          disabled={isPulling || playerData.points < 10}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isPulling || playerData.points < 10
                ? ['#444', '#333']
                : ['#FFD700', '#FFA500']
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>
              {isPulling
                ? '召喚中...'
                : playerData.points < 10
                ? 'ポイント不足'
                : result
                ? 'もう一度召喚'
                : '召喚する'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  pointsLabel: {
    color: '#888',
    fontSize: 12,
  },
  pointsValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 34,
  },
  costInfo: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 20,
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.45,
    opacity: 0.3,
  },
  badge: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingBottom: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  gachaButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 16,
  },
  buttonDisabled: {
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
