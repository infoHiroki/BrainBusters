// カード使用エフェクト（SVG版）
// カードタイプ別（攻撃/防御/スキル）の軽快なエフェクト

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
  Line,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';

// カードタイプ別カラー
const CARD_COLORS = {
  attack: {
    primary: '#E74C3C',
    secondary: '#FF6B6B',
    light: '#FADBD8',
  },
  defense: {
    primary: '#3498DB',
    secondary: '#5DADE2',
    light: '#D6EAF8',
  },
  skill: {
    primary: '#2ECC71',
    secondary: '#58D68D',
    light: '#D5F5E3',
  },
};

interface CardPlayEffectSvgProps {
  cardType: 'attack' | 'defense' | 'skill';
  x: number;
  y: number;
  onComplete: () => void;
}

export const CardPlayEffectSvg: React.FC<CardPlayEffectSvgProps> = ({
  cardType,
  x,
  y,
  onComplete,
}) => {
  const colors = CARD_COLORS[cardType] || CARD_COLORS.skill;

  // 中心のフラッシュ
  const flashScale = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // 放射状の光線
  const rayCount = 12;
  const rayAnims = useRef(
    Array.from({ length: rayCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // パーティクル
  const particleCount = 18;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      return {
        angle,
        distance: 45 + Math.random() * 35,
        size: 2 + Math.random() * 3,
      };
    })
  , []);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // リング
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. 中心フラッシュ
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flashScale, {
            toValue: 1.4,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(flashScale, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.8,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 2. 放射状光線
    rayAnims.forEach((anim, index) => {
      const delay = index * 20;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7,
                duration: 60,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 280,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 3. リング
    animations.push(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.8,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 380,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true
          }),
        ]),
      ])
    );

    // 4. パーティクル
    particleAnims.forEach((anim) => {
      const delay = Math.random() * 80;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 60,
                useNativeDriver: true
              }),
              Animated.delay(200),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 180,
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

    const timeout = setTimeout(onComplete, 650);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 放射状光線 */}
      {rayAnims.map((anim, index) => {
        const angle = (index / rayCount) * Math.PI * 2;
        const rayLength = 60;
        const startX = x;
        const startY = y;
        const endX = x + Math.cos(angle) * rayLength;
        const endY = y + Math.sin(angle) * rayLength;
        return (
          <Animated.View
            key={`ray-${index}`}
            style={[
              styles.ray,
              {
                left: Math.min(startX, endX) - 5,
                top: Math.min(startY, endY) - 5,
                width: Math.abs(endX - startX) + 10,
                height: Math.abs(endY - startY) + 10,
                opacity: anim.opacity,
                transform: [{ scale: anim.scale }],
              },
            ]}
          >
            <Svg width={Math.abs(endX - startX) + 10} height={Math.abs(endY - startY) + 10}>
              <Line
                x1={startX < endX ? 5 : Math.abs(endX - startX) + 5}
                y1={startY < endY ? 5 : Math.abs(endY - startY) + 5}
                x2={startX < endX ? Math.abs(endX - startX) + 5 : 5}
                y2={startY < endY ? Math.abs(endY - startY) + 5 : 5}
                stroke={colors.secondary}
                strokeWidth={0.4}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* リング */}
      <Animated.View
        style={[
          styles.ring,
          {
            left: x - 25,
            top: y - 25,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      >
        <Svg width={50} height={50}>
          <Circle
            cx={25}
            cy={25}
            r={22}
            stroke={colors.primary}
            strokeWidth={0.3}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* パーティクル */}
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
                      outputRange: [0, Math.sin(data.angle) * data.distance],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={data.size * 2} height={data.size * 2}>
              <Circle cx={data.size} cy={data.size} r={data.size} fill={colors.secondary} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 中心フラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          {
            left: x - 20,
            top: y - 20,
            opacity: flashOpacity,
            transform: [{ scale: flashScale }],
          },
        ]}
      >
        <Svg width={40} height={40}>
          <Defs>
            <RadialGradient id="cardFlashGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="50%" stopColor={colors.light} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={20} cy={20} r={18} fill="url(#cardFlashGrad)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 260,
  },
  ray: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  flash: {
    position: 'absolute',
  },
});
