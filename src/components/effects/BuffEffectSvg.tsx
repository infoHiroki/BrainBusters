// バフ付与エフェクト（SVG版）
// 立体的な光の円柱（下から上に立ち上がる）

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

// カラーパレット（強化・上昇）
const BUFF_COLORS = [
  '#FFD700', // ゴールド
  '#F39C12', // オレンジ
  '#FFD93D', // サンライト
  '#E67E22', // タンジェリン
  '#FFF176', // ライトイエロー
];

interface BuffEffectSvgProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export const BuffEffectSvg: React.FC<BuffEffectSvgProps> = ({
  x,
  y,
  onComplete,
}) => {
  // 円柱の楕円リング（立体感）
  const ringCount = 8;
  const ringAnims = useRef(
    Array.from({ length: ringCount }, () => ({
      translateY: new Animated.Value(70),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  // 上昇する光線
  const rayCount = 10;
  const rayAnims = useRef(
    Array.from({ length: rayCount }, () => ({
      scaleY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // 中心の光
  const coreOpacity = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(0.5)).current;

  // 上昇パーティクル
  const particleCount = 24;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 40 + Math.random() * 30;
      return {
        angle,
        radius,
        riseHeight: 90 + Math.random() * 60,
        size: 2.5 + Math.random() * 3,
        color: BUFF_COLORS[Math.floor(Math.random() * BUFF_COLORS.length)],
      };
    })
  , []);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // フラッシュ
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. フラッシュ
    animations.push(
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.25,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
      ])
    );

    // 2. 光線（下から上に伸びる）
    rayAnims.forEach((anim, index) => {
      const delay = index * 20;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scaleY, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7,
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

    // 3. 円柱リング（下から上に順次表示）
    ringAnims.forEach((anim, index) => {
      const delay = index * 40;
      const targetY = -20 - index * 15;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: targetY,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.scale, {
              toValue: 1 - index * 0.08,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7 - index * 0.1,
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

    // 4. 中心の光
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(coreScale, {
            toValue: 1.2,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(coreScale, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(coreOpacity, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.delay(200),
          Animated.timing(coreOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 5. 上昇パーティクル
    particleAnims.forEach((anim, index) => {
      const data = particleData[index];
      const delay = Math.random() * 100;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: -data.riseHeight,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
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
      {/* フラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity, backgroundColor: '#FFF8DC' },
        ]}
      />

      {/* 光線（下から上に伸びる） */}
      {rayAnims.map((anim, index) => {
        const angle = (index / rayCount) * Math.PI * 2;
        const rayX = Math.cos(angle) * 25;
        const rayLength = 70;
        return (
          <Animated.View
            key={`ray-${index}`}
            style={[
              styles.ray,
              {
                left: x + rayX - 1,
                top: y - rayLength,
                height: rayLength,
                opacity: anim.opacity,
                transform: [
                  { scaleY: anim.scaleY },
                ],
              },
            ]}
          >
            <Svg width={3} height={rayLength}>
              <Defs>
                <LinearGradient id={`rayGrad${index}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={BUFF_COLORS[index % BUFF_COLORS.length]} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Line
                x1={1.5}
                y1={rayLength}
                x2={1.5}
                y2={0}
                stroke={`url(#rayGrad${index})`}
                strokeWidth={0.4}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 円柱リング（立体表現） */}
      {ringAnims.map((anim, index) => (
        <Animated.View
          key={`ring-${index}`}
          style={[
            styles.ring,
            {
              left: x - cylinderWidth / 2,
              top: y - cylinderHeight / 2,
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
              stroke={BUFF_COLORS[index % BUFF_COLORS.length]}
              strokeWidth={0.3}
              fill="none"
            />
          </Svg>
        </Animated.View>
      ))}

      {/* 上昇パーティクル */}
      {particleData.map((data, index) => {
        const anim = particleAnims[index];
        const px = x + Math.cos(data.angle) * data.radius;
        const py = y;
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

      {/* 中心の光 */}
      <Animated.View
        style={[
          styles.core,
          {
            left: x - 20,
            top: y - 20,
            opacity: coreOpacity,
            transform: [{ scale: coreScale }],
          },
        ]}
      >
        <Svg width={40} height={40}>
          <Defs>
            <RadialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="50%" stopColor="#FFD700" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="#F39C12" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={20} cy={20} r={18} fill="url(#coreGrad)" />
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
  ray: {
    position: 'absolute',
    width: 3,
    transformOrigin: 'bottom',
  },
  ring: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  core: {
    position: 'absolute',
  },
});
