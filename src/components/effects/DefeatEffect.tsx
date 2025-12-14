// 敵撃破エフェクトコンポーネント
// 敵を倒した時のパーティクルと崩壊アニメーション

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  targetX: number;
  targetY: number;
  emoji: string;
  color: string;
}

interface DefeatEffectProps {
  x: number;
  y: number;
  enemyType: 'normal' | 'elite' | 'boss';
  onComplete: () => void;
}

export const DefeatEffect: React.FC<DefeatEffectProps> = ({
  x,
  y,
  enemyType,
  onComplete,
}) => {
  const particles = useRef<Particle[]>([]).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // 敵タイプによるパーティクル設定
  const config = {
    normal: { count: 8, emojis: ['💨', '✨'], colors: ['#888', '#aaa'], showText: false },
    elite: { count: 14, emojis: ['💫', '⭐', '✨'], colors: ['#FFD700', '#FFA500'], showText: false },
    boss: { count: 24, emojis: ['🌟', '💥', '✨', '🔥', '⭐'], colors: ['#FFD700', '#FF6B6B', '#4ECDC4'], showText: true },
  };

  const { count, emojis, colors, showText } = config[enemyType];

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // パーティクル生成
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 60 + Math.random() * 80;

      const particle: Particle = {
        id: `particle-${i}`,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        rotation: new Animated.Value(0),
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance - 30, // 少し上向きに
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      particles.push(particle);

      const particleAnim = Animated.parallel([
        // 移動
        Animated.timing(particle.x, {
          toValue: particle.targetX,
          duration: 500 + Math.random() * 200,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: particle.targetY,
          duration: 500 + Math.random() * 200,
          useNativeDriver: true,
        }),
        // スケール
        Animated.sequence([
          Animated.spring(particle.scale, {
            toValue: 1 + Math.random() * 0.5,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // 回転
        Animated.timing(particle.rotation, {
          toValue: (Math.random() - 0.5) * 4,
          duration: 700,
          useNativeDriver: true,
        }),
        // フェード
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]);

      animations.push(Animated.sequence([
        Animated.delay(i * 15),
        particleAnim,
      ]));
    }

    // ボス撃破時の追加演出
    if (enemyType === 'boss') {
      // 画面フラッシュ
      const flashAnim = Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      // テキスト表示
      const textAnim = Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(textScale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1200),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      animations.push(flashAnim, textAnim);
    }

    // 全アニメーション実行
    Animated.parallel(animations).start(() => {
      setTimeout(onComplete, 100);
    });

    // 最大時間でも完了を保証
    const timeout = setTimeout(onComplete, enemyType === 'boss' ? 2000 : 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* ボス撃破時の画面フラッシュ */}
      {enemyType === 'boss' && (
        <Animated.View
          style={[
            styles.flash,
            { opacity: flashOpacity },
          ]}
        />
      )}

      {/* ボス撃破テキスト */}
      {showText && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ scale: textScale }],
            },
          ]}
        >
          <Text style={styles.defeatText}>BOSS DEFEATED!</Text>
          <Text style={styles.defeatSubtext}>撃破</Text>
        </Animated.View>
      )}

      {/* パーティクル */}
      {particles.map((particle) => (
        <Animated.Text
          key={particle.id}
          style={[
            styles.particle,
            {
              left: x,
              top: y,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [-2, 0, 2],
                    outputRange: ['-360deg', '0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {particle.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
  },
  textContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 260,
  },
  defeatText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  defeatSubtext: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginTop: 8,
  },
  particle: {
    position: 'absolute',
    fontSize: 28,
  },
});
