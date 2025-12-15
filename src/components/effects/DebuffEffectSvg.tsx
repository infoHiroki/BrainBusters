// デバフ付与エフェクト（SVG版）
// 立体的な暗い円柱（上から下に降りてくる）

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
  Line,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// カラーパレット（弱体化・重圧）
const DEBUFF_COLORS = [
  '#9B59B6', // パープル
  '#8E44AD', // ダークパープル
  '#C0392B', // ダークレッド
  '#7D3C98', // プラム
  '#6C3483', // ディープパープル
];

const DARK_COLORS = [
  '#2C3E50', // ダークブルーグレー
  '#1A1A2E', // ミッドナイト
  '#4A235A', // ダークプラム
];

interface DebuffEffectSvgProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export const DebuffEffectSvg: React.FC<DebuffEffectSvgProps> = ({
  x,
  y,
  onComplete,
}) => {
  // 円柱の楕円リング（立体感）- 上から下に降りてくる
  const ringCount = 8;
  const ringAnims = useRef(
    Array.from({ length: ringCount }, () => ({
      translateY: new Animated.Value(-120),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  // 下降する暗い線
  const lineCount = 10;
  const lineAnims = useRef(
    Array.from({ length: lineCount }, () => ({
      scaleY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(-90),
    }))
  ).current;

  // 中心の暗いオーラ
  const auraOpacity = useRef(new Animated.Value(0)).current;
  const auraScale = useRef(new Animated.Value(0.5)).current;

  // 下降パーティクル
  const particleCount = 24;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 40 + Math.random() * 30;
      return {
        angle,
        radius,
        fallHeight: 70 + Math.random() * 50,
        size: 2.5 + Math.random() * 3,
        color: DEBUFF_COLORS[Math.floor(Math.random() * DEBUFF_COLORS.length)],
      };
    })
  , []);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      translateY: new Animated.Value(-40),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // フラッシュ（暗い）
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. 暗いフラッシュ
    animations.push(
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.45,
          duration: 60,
          useNativeDriver: true
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true
        }),
      ])
    );

    // 2. 下降する暗い線
    lineAnims.forEach((anim, index) => {
      const delay = index * 20;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scaleY, {
              toValue: 1,
              duration: 250,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.translateY, {
              toValue: 20,
              duration: 350,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 80,
                useNativeDriver: true
              }),
              Animated.delay(150),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 3. 円柱リング（上から下に順次降下）
    ringAnims.forEach((anim, index) => {
      const delay = index * 35;
      const targetY = 10 + index * 12;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: targetY,
              duration: 400,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.scale, {
              toValue: 1 + index * 0.06,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.75 - index * 0.08,
                duration: 80,
                useNativeDriver: true
              }),
              Animated.delay(250),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 4. 中心の暗いオーラ
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(auraScale, {
            toValue: 1.3,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(auraScale, {
            toValue: 0.8,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(auraOpacity, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.delay(300),
          Animated.timing(auraOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 5. 下降パーティクル
    particleAnims.forEach((anim, index) => {
      const data = particleData[index];
      const delay = Math.random() * 100;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: data.fallHeight,
              duration: 450,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7,
                duration: 60,
                useNativeDriver: true
              }),
              Animated.delay(280),
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

  const cylinderWidth = 100;
  const cylinderHeight = 35;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 暗いフラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity, backgroundColor: '#1A1A2E' },
        ]}
      />

      {/* 下降する暗い線 */}
      {lineAnims.map((anim, index) => {
        const angle = (index / lineCount) * Math.PI * 2;
        const lineX = Math.cos(angle) * 25;
        const lineLength = 60;
        return (
          <Animated.View
            key={`line-${index}`}
            style={[
              styles.line,
              {
                left: x + lineX - 1,
                top: y - 30,
                height: lineLength,
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { scaleY: anim.scaleY },
                ],
              },
            ]}
          >
            <Svg width={3} height={lineLength}>
              <Defs>
                <LinearGradient id={`lineGrad${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={DEBUFF_COLORS[index % DEBUFF_COLORS.length]} stopOpacity={0} />
                  <Stop offset="100%" stopColor={DARK_COLORS[index % DARK_COLORS.length]} stopOpacity={0.8} />
                </LinearGradient>
              </Defs>
              <Line
                x1={1.5}
                y1={0}
                x2={1.5}
                y2={lineLength}
                stroke={`url(#lineGrad${index})`}
                strokeWidth={0.4}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 円柱リング（立体表現）- 上から降下 */}
      {ringAnims.map((anim, index) => (
        <Animated.View
          key={`ring-${index}`}
          style={[
            styles.ring,
            {
              left: x - cylinderWidth / 2,
              top: y - cylinderHeight / 2 - 40,
              opacity: anim.opacity,
              transform: [
                { translateY: anim.translateY },
                { scale: anim.scale },
              ],
            },
          ]}
        >
          <Svg width={cylinderWidth} height={cylinderHeight}>
            <Ellipse
              cx={cylinderWidth / 2}
              cy={cylinderHeight / 2}
              rx={cylinderWidth / 2 - 2}
              ry={cylinderHeight / 2 - 2}
              stroke={DEBUFF_COLORS[index % DEBUFF_COLORS.length]}
              strokeWidth={0.3}
              fill="none"
            />
          </Svg>
        </Animated.View>
      ))}

      {/* 下降パーティクル */}
      {particleData.map((data, index) => {
        const anim = particleAnims[index];
        const px = x + Math.cos(data.angle) * data.radius;
        const py = y - 20;
        return (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                left: px - data.size,
                top: py - data.size,
                opacity: anim.opacity,
                transform: [{ translateY: anim.translateY }],
              },
            ]}
          >
            <Svg width={data.size * 2} height={data.size * 2}>
              <Circle cx={data.size} cy={data.size} r={data.size} fill={data.color} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 中心の暗いオーラ */}
      <Animated.View
        style={[
          styles.aura,
          {
            left: x - 25,
            top: y - 25,
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      >
        <Svg width={50} height={50}>
          <Defs>
            <RadialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#4A235A" stopOpacity={0.7} />
              <Stop offset="50%" stopColor="#9B59B6" stopOpacity={0.4} />
              <Stop offset="100%" stopColor="#2C3E50" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={25} cy={25} r={23} fill="url(#auraGrad)" />
          <Circle cx={25} cy={25} r={15} stroke="#8E44AD" strokeWidth={0.4} fill="none" opacity={0.6} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 270,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
  line: {
    position: 'absolute',
    width: 3,
    transformOrigin: 'top',
  },
  ring: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  aura: {
    position: 'absolute',
  },
});
