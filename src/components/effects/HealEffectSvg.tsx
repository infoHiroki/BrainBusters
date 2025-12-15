// 回復エフェクト（SVG版）
// 上昇する癒しの光

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
  RadialGradient,
  Stop,
} from 'react-native-svg';

// カラーパレット（癒し・生命力）
const HEAL_COLORS = [
  '#2ECC71', // エメラルド
  '#58D68D', // ライトグリーン
  '#82E0AA', // ミントグリーン
  '#ABEBC6', // ペールグリーン
  '#E8B4D8', // ソフトピンク
  '#FFB6C1', // ライトピンク
];

const SPARKLE_COLORS = [
  '#FFFFFF', // 白
  '#F0FFF0', // ハニーデュー
  '#FFE4E1', // ミスティローズ
];

interface HealEffectSvgProps {
  heal: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const HealEffectSvg: React.FC<HealEffectSvgProps> = ({
  heal,
  x,
  y,
  onComplete,
}) => {
  // 回復量レベル
  const isLarge = heal >= 15;
  const isMedium = heal >= 8;

  // 上昇する光粒子
  const particleCount = isLarge ? 36 : isMedium ? 28 : 20;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const spreadX = (Math.random() - 0.5) * 140;
      return {
        startX: spreadX,
        riseHeight: 100 + Math.random() * 80,
        size: 3 + Math.random() * 4,
        color: HEAL_COLORS[Math.floor(Math.random() * HEAL_COLORS.length)],
        delay: Math.random() * 150,
        duration: 600 + Math.random() * 250,
        sway: (Math.random() - 0.5) * 30,
      };
    })
  , [particleCount]);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  // 中心の癒しシンボル
  const symbolScale = useRef(new Animated.Value(0)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;

  // キラキラ
  const sparkleCount = isLarge ? 16 : isMedium ? 12 : 10;
  const sparkleData = useMemo(() =>
    Array.from({ length: sparkleCount }, (_, i) => {
      const angle = (i / sparkleCount) * Math.PI * 2;
      return {
        angle,
        distance: 50 + Math.random() * 40,
        size: 4 + Math.random() * 4,
      };
    })
  , [sparkleCount]);

  const sparkleAnims = useRef(
    Array.from({ length: sparkleCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // 底部の楕円リング（光源）
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. 底部リング（光源）
    animations.push(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.2,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 2. 中心シンボル
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(symbolScale, {
            toValue: isLarge ? 1.3 : 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true
          }),
          Animated.timing(symbolScale, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(symbolOpacity, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.delay(280),
          Animated.timing(symbolOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 3. 上昇する光粒子
    particleAnims.forEach((anim, index) => {
      const data = particleData[index];
      animations.push(
        Animated.sequence([
          Animated.delay(data.delay),
          Animated.parallel([
            // Y方向（上昇）
            Animated.timing(anim.translateY, {
              toValue: -data.riseHeight,
              duration: data.duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            // X方向（揺れ）
            Animated.sequence([
              Animated.timing(anim.translateX, {
                toValue: data.sway,
                duration: data.duration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true
              }),
              Animated.timing(anim.translateX, {
                toValue: -data.sway * 0.5,
                duration: data.duration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true
              }),
            ]),
            // スケール
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
              }),
              Animated.delay(data.duration - 200),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true
              }),
            ]),
            // 透明度
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 80,
                useNativeDriver: true
              }),
              Animated.delay(data.duration - 180),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 4. キラキラ
    sparkleAnims.forEach((anim, index) => {
      const delay = index * 50 + 100;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 150,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
              }),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true
              }),
            ]),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 300,
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

    const timeout = setTimeout(onComplete, 800);
    return () => clearTimeout(timeout);
  }, []);

  // クロスパス（十字）
  const createCross = (cx: number, cy: number, size: number): string => {
    const arm = size * 0.4;
    const width = size * 0.15;
    return `
      M ${cx - width} ${cy - arm}
      L ${cx + width} ${cy - arm}
      L ${cx + width} ${cy - width}
      L ${cx + arm} ${cy - width}
      L ${cx + arm} ${cy + width}
      L ${cx + width} ${cy + width}
      L ${cx + width} ${cy + arm}
      L ${cx - width} ${cy + arm}
      L ${cx - width} ${cy + width}
      L ${cx - arm} ${cy + width}
      L ${cx - arm} ${cy - width}
      L ${cx - width} ${cy - width}
      Z
    `;
  };

  // キラキラパス（4点星）
  const createSparkle = (cx: number, cy: number, size: number): string => {
    return `
      M ${cx} ${cy - size}
      Q ${cx + size * 0.2} ${cy} ${cx + size} ${cy}
      Q ${cx} ${cy + size * 0.2} ${cx} ${cy + size}
      Q ${cx - size * 0.2} ${cy} ${cx - size} ${cy}
      Q ${cx} ${cy - size * 0.2} ${cx} ${cy - size}
      Z
    `;
  };

  const symbolSize = isLarge ? 25 : isMedium ? 20 : 16;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 底部の楕円リング（光源） */}
      <Animated.View
        style={[
          styles.ring,
          {
            left: x - 40,
            top: y + 10,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      >
        <Svg width={80} height={30}>
          <Defs>
            <RadialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#2ECC71" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="#2ECC71" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={40}
            cy={15}
            rx={38}
            ry={12}
            fill="url(#ringGrad)"
          />
          <Ellipse
            cx={40}
            cy={15}
            rx={35}
            ry={10}
            stroke="#58D68D"
            strokeWidth={0.3}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* 上昇する光粒子 */}
      {particleData.map((data, index) => {
        const anim = particleAnims[index];
        return (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                left: x + data.startX - data.size,
                top: y - data.size,
                opacity: anim.opacity,
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                  { scale: anim.scale },
                ],
              },
            ]}
          >
            <Svg width={data.size * 2} height={data.size * 2}>
              <Circle
                cx={data.size}
                cy={data.size}
                r={data.size}
                fill={data.color}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* キラキラ */}
      {sparkleData.map((data, index) => {
        const anim = sparkleAnims[index];
        const sx = x + Math.cos(data.angle) * data.distance;
        const sy = y + Math.sin(data.angle) * data.distance - 20;
        return (
          <Animated.View
            key={`sparkle-${index}`}
            style={[
              styles.sparkle,
              {
                left: sx - data.size,
                top: sy - data.size,
                opacity: anim.opacity,
                transform: [{ scale: anim.scale }],
              },
            ]}
          >
            <Svg width={data.size * 2} height={data.size * 2}>
              <Path
                d={createSparkle(data.size, data.size, data.size)}
                fill={SPARKLE_COLORS[index % SPARKLE_COLORS.length]}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 中心の癒しシンボル（十字） */}
      <Animated.View
        style={[
          styles.symbol,
          {
            left: x - symbolSize,
            top: y - symbolSize - 15,
            opacity: symbolOpacity,
            transform: [{ scale: symbolScale }],
          },
        ]}
      >
        <Svg width={symbolSize * 2} height={symbolSize * 2}>
          <Defs>
            <RadialGradient id="healGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="50%" stopColor="#82E0AA" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="#2ECC71" stopOpacity={0.2} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={symbolSize}
            cy={symbolSize}
            r={symbolSize - 2}
            fill="url(#healGrad)"
          />
          <Path
            d={createCross(symbolSize, symbolSize, symbolSize * 0.8)}
            fill="#2ECC71"
            opacity={0.8}
          />
          <Path
            d={createCross(symbolSize, symbolSize, symbolSize * 0.5)}
            fill="#FFFFFF"
            opacity={0.6}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 275,
  },
  ring: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
  symbol: {
    position: 'absolute',
  },
});
