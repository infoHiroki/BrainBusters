// コンボ演出コンポーネント
// コンボ発動時のオーバーレイ表示

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ComboResult, ComboEffect } from '../types/tags';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ComboDisplayProps {
  comboResult: ComboResult | null;
  onComplete: () => void;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({
  comboResult,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!comboResult) return;

    const combo = comboResult.combo;

    // アニメーションをリセット
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    shakeAnim.setValue(0);
    glowAnim.setValue(0);

    // メインアニメーション
    const mainAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);

    // 画面効果アニメーション
    let effectAnimation: Animated.CompositeAnimation | null = null;
    if (combo.screenEffect === 'shake') {
      effectAnimation = Animated.sequence([
        ...Array(5).fill(null).map(() =>
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -1,
              duration: 50,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]);
    } else if (combo.screenEffect === 'glow' || combo.screenEffect === 'sparkle') {
      effectAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      );
    } else if (combo.screenEffect === 'lightning') {
      effectAnimation = Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
    }

    // フェードアウト
    const fadeOutAnimation = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      delay: 2000,
      useNativeDriver: true,
    });

    // アニメーション実行
    mainAnimation.start();
    if (effectAnimation) {
      effectAnimation.start();
    }
    fadeOutAnimation.start(() => {
      onComplete();
    });

    return () => {
      mainAnimation.stop();
      effectAnimation?.stop();
      fadeOutAnimation.stop();
    };
  }, [comboResult]);

  if (!comboResult) return null;

  const combo = comboResult.combo;

  // エフェクトの説明を生成
  const getEffectDescription = (effect: ComboEffect): string => {
    switch (effect.type) {
      case 'damage':
        return `${effect.target === 'all' ? '全体に' : ''}${effect.value}ダメージ`;
      case 'block':
        return `${effect.value}ブロック`;
      case 'draw':
        return `${effect.value}枚ドロー`;
      case 'energy':
        return `+${effect.value}エネルギー`;
      case 'heal':
        return `${effect.value}回復`;
      case 'buff':
        const buffName = effect.buffType === 'strength' ? '闘志' :
                        effect.buffType === 'dexterity' ? '克己' : effect.buffType;
        return `${buffName}+${effect.value}${effect.duration ? `(${effect.duration}T)` : ''}`;
      case 'debuff':
        const debuffName = effect.buffType === 'vulnerable' ? '不安' :
                          effect.buffType === 'weak' ? '虚弱' :
                          effect.buffType === 'poison' ? '苦悩' : effect.buffType;
        return `${effect.target === 'all' ? '全体に' : ''}${debuffName}${effect.value}${effect.duration ? `(${effect.duration}T)` : ''}`;
      default:
        return '';
    }
  };

  // 画面効果に応じた背景色
  const getBackgroundColors = (): [string, string] => {
    switch (combo.screenEffect) {
      case 'shake':
        return ['rgba(231, 76, 60, 0.9)', 'rgba(192, 57, 43, 0.9)'];
      case 'glow':
        return ['rgba(241, 196, 15, 0.9)', 'rgba(243, 156, 18, 0.9)'];
      case 'lightning':
        return ['rgba(155, 89, 182, 0.9)', 'rgba(142, 68, 173, 0.9)'];
      case 'sparkle':
        return ['rgba(52, 152, 219, 0.9)', 'rgba(41, 128, 185, 0.9)'];
      default:
        return ['rgba(44, 62, 80, 0.9)', 'rgba(52, 73, 94, 0.9)'];
    }
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: shakeAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-10, 0, 10],
              }),
            },
          ],
        },
      ]}
    >
      {/* グロー効果 */}
      {(combo.screenEffect === 'glow' || combo.screenEffect === 'sparkle') && (
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
      )}

      {/* 稲妻効果 */}
      {combo.screenEffect === 'lightning' && (
        <Animated.View
          style={[
            styles.lightningOverlay,
            {
              opacity: glowAnim,
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getBackgroundColors()}
          style={styles.card}
        >
          {/* アイコン */}
          <Text style={styles.icon}>{combo.icon}</Text>

          {/* コンボ名 */}
          <Text style={styles.comboName}>{combo.name}</Text>

          {/* 効果リスト */}
          <View style={styles.effectsContainer}>
            {comboResult.appliedEffects.map((ae, index) => (
              <View key={index} style={styles.effectBadge}>
                <Text style={styles.effectText}>
                  {getEffectDescription(ae.effect)}
                </Text>
              </View>
            ))}
          </View>

          {/* 引用 */}
          <Text style={styles.quote}>{combo.quote}</Text>

          {/* 説明 */}
          <Text style={styles.description}>{combo.description}</Text>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f1c40f',
  },
  lightningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    fontSize: 64,
    marginBottom: 12,
  },
  comboName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  effectBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  effectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
