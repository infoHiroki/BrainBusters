// ブロック獲得エフェクト（SVG版）
// 立体的な六角形シールド

import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Ellipse,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// カラーパレット（防御的・保護的）
const SHIELD_COLORS = [
  '#3498DB', // ブルー
  '#5DADE2', // ライトブルー
  '#85C1E9', // スカイブルー
  '#AED6F1', // ペールブルー
  '#1ABC9C', // ティール
];

interface BlockEffectSvgProps {
  block: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const BlockEffectSvg: React.FC<BlockEffectSvgProps> = ({
  block,
  x,
  y,
  onComplete,
}) => {
  // ブロック量レベル
  const isHuge = block >= 30;
  const isLarge = block >= 20;
  const isMedium = block >= 10;

  // メインシールド
  const shieldScale = useRef(new Animated.Value(0)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;

  // 立体リング（楕円で奥行き表現）
  const ringCount = isHuge ? 8 : isLarge ? 7 : isMedium ? 5 : 4;
  const ringAnims = useRef(
    Array.from({ length: ringCount }, () => ({
      scale: new Animated.Value(0.5),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  // 光粒子
  const particleCount = isHuge ? 28 : isLarge ? 22 : isMedium ? 16 : 12;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      return {
        angle,
        distance: 50 + Math.random() * 60,
        size: 2 + Math.random() * 3,
        color: SHIELD_COLORS[Math.floor(Math.random() * SHIELD_COLORS.length)],
      };
    })
  , [particleCount]);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // フラッシュ
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. ソフトフラッシュ
    animations.push(
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: isHuge ? 0.3 : isLarge ? 0.2 : 0.15,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
      ])
    );

    // 2. メインシールド
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(shieldScale, {
            toValue: isHuge ? 1.4 : isLarge ? 1.2 : 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true
          }),
          Animated.timing(shieldScale, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(shieldOpacity, {
            toValue: 0.5,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.delay(250),
          Animated.timing(shieldOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 3. 立体リング（下から上に浮かび上がる）
    ringAnims.forEach((anim, index) => {
      const delay = index * 35;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1.3 + index * 0.2,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.translateY, {
              toValue: -20 - index * 8,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.55 - index * 0.05,
                duration: 60,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 390,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 4. 光粒子
    particleAnims.forEach((anim) => {
      const delay = Math.random() * 60;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 350 + Math.random() * 80,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7,
                duration: 50,
                useNativeDriver: true
              }),
              Animated.delay(180),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    Animated.parallel(animations).start(() => {
      onComplete();
    });

    const timeout = setTimeout(onComplete, 600);
    return () => clearTimeout(timeout);
  }, []);

  // 六角形パス
  const createHexagon = (cx: number, cy: number, radius: number): string => {
    let path = '';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }
    path += ' Z';
    return path;
  };

  const shieldSize = isHuge ? 70 : isLarge ? 60 : isMedium ? 50 : 40;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* フラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity, backgroundColor: '#D6EAF8' },
        ]}
      />

      {/* 立体リング（楕円で奥行き表現） */}
      {ringAnims.map((anim, index) => {
        const ringWidth = 90 + index * 20;
        const ringHeight = 35 + index * 8;
        return (
          <Animated.View
            key={`ring-${index}`}
            style={[
              styles.ring,
              {
                left: x - ringWidth / 2,
                top: y - ringHeight / 2,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  { translateY: anim.translateY },
                ],
              },
            ]}
          >
            <Svg width={ringWidth} height={ringHeight}>
              <Ellipse
                cx={ringWidth / 2}
                cy={ringHeight / 2}
                rx={ringWidth / 2 - 2}
                ry={ringHeight / 2 - 2}
                stroke={SHIELD_COLORS[index % SHIELD_COLORS.length]}
                strokeWidth={0.3}
                fill="none"
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 光粒子 */}
      {particleData.map((data, index) => {
        const anim = particleAnims[index];
        return (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                left: x - data.size,
                top: y - data.size,
                opacity: anim.opacity,
                transform: [
                  {
                    translateX: anim.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(data.angle) * data.distance],
                    }),
                  },
                  {
                    translateY: anim.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(data.angle) * data.distance - 15],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={data.size * 2} height={data.size * 2}>
              <Circle cx={data.size} cy={data.size} r={data.size} fill={data.color} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* メインシールド（立体六角形） */}
      <Animated.View
        style={[
          styles.shield,
          {
            left: x - shieldSize - 5,
            top: y - shieldSize - 5,
            opacity: shieldOpacity,
            transform: [{ scale: shieldScale }],
          },
        ]}
      >
        <Svg width={(shieldSize + 5) * 2} height={(shieldSize + 5) * 2}>
          <Defs>
            <RadialGradient id="shieldGrad" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.7} />
              <Stop offset="50%" stopColor="#AED6F1" stopOpacity={0.4} />
              <Stop offset="100%" stopColor="#3498DB" stopOpacity={0.1} />
            </RadialGradient>
            <LinearGradient id="shieldStroke" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#85C1E9" />
              <Stop offset="100%" stopColor="#3498DB" />
            </LinearGradient>
          </Defs>
          {/* 外枠 */}
          <Path
            d={createHexagon(shieldSize + 5, shieldSize + 5, shieldSize)}
            fill="url(#shieldGrad)"
            stroke="url(#shieldStroke)"
            strokeWidth={0.5}
          />
          {/* 内側のリング */}
          <Path
            d={createHexagon(shieldSize + 5, shieldSize + 5, shieldSize * 0.7)}
            fill="none"
            stroke="#5DADE2"
            strokeWidth={0.4}
          />
          <Path
            d={createHexagon(shieldSize + 5, shieldSize + 5, shieldSize * 0.4)}
            fill="none"
            stroke="#85C1E9"
            strokeWidth={0.3}
          />
          {/* 中心の光点 */}
          <Circle
            cx={shieldSize + 5}
            cy={shieldSize + 5}
            r={3}
            fill="#FFFFFF"
            opacity={0.8}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 280,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  shield: {
    position: 'absolute',
  },
});
