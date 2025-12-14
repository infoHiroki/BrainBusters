// ダメージエフェクトコンポーネント
// 50+ダメージで火花、100+ダメージで爆発+シェイク

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 火花パーティクル
interface Spark {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  targetX: number;
  targetY: number;
  emoji: string;
}

interface DamageEffectProps {
  damage: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const DamageEffect: React.FC<DamageEffectProps> = ({
  damage,
  x,
  y,
  onComplete,
}) => {
  const sparks = useRef<Spark[]>([]).current;
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const isExplosion = damage >= 100;
  const hasSparks = damage >= 50;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 火花エフェクト（50+ダメージ）
    if (hasSparks) {
      const sparkCount = Math.min(Math.floor(damage / 10), 16);
      const sparkEmojis = ['💥', '✨', '⚡', '🔥'];

      for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const distance = 50 + Math.random() * 40;

        const spark: Spark = {
          id: `spark-${i}`,
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          opacity: new Animated.Value(1),
          scale: new Animated.Value(0),
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance,
          emoji: sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)],
        };
        sparks.push(spark);

        const sparkAnim = Animated.parallel([
          Animated.timing(spark.x, {
            toValue: spark.targetX,
            duration: 300 + Math.random() * 100,
            useNativeDriver: true,
          }),
          Animated.timing(spark.y, {
            toValue: spark.targetY,
            duration: 300 + Math.random() * 100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(spark.scale, {
              toValue: 1 + Math.random() * 0.5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(spark.scale, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(spark.opacity, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]);

        animations.push(Animated.sequence([
          Animated.delay(i * 20),
          sparkAnim,
        ]));
      }
    }

    // 爆発エフェクト（100+ダメージ）
    if (isExplosion) {
      // 画面フラッシュ
      const flashAnim = Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);

      // 爆発拡大
      const explosionAnim = Animated.parallel([
        Animated.sequence([
          Animated.timing(explosionOpacity, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.delay(150),
          Animated.timing(explosionOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(explosionScale, {
          toValue: 2.5,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]);

      animations.push(flashAnim, explosionAnim);
    }

    // 全アニメーション実行
    Animated.parallel(animations).start(() => {
      onComplete();
    });

    // 最大時間でも完了を保証
    const timeout = setTimeout(onComplete, 600);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 画面フラッシュ（100+ダメージ） */}
      {isExplosion && (
        <Animated.View
          style={[
            styles.flash,
            { opacity: flashOpacity },
          ]}
        />
      )}

      {/* 爆発（100+ダメージ） */}
      {isExplosion && (
        <Animated.View
          style={[
            styles.explosion,
            {
              left: x - 50,
              top: y - 50,
              opacity: explosionOpacity,
              transform: [{ scale: explosionScale }],
            },
          ]}
        >
          <Animated.Text style={styles.explosionEmoji}>💥</Animated.Text>
        </Animated.View>
      )}

      {/* 火花パーティクル（50+ダメージ） */}
      {hasSparks && sparks.map((spark) => (
        <Animated.Text
          key={spark.id}
          style={[
            styles.spark,
            {
              left: x,
              top: y,
              opacity: spark.opacity,
              transform: [
                { translateX: spark.x },
                { translateY: spark.y },
                { scale: spark.scale },
              ],
            },
          ]}
        >
          {spark.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  explosion: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explosionEmoji: {
    fontSize: 80,
    textShadowColor: '#ff6600',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  spark: {
    position: 'absolute',
    fontSize: 24,
  },
});
