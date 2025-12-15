// ダメージエフェクト（SVG版）
// ヒルマ・アフ・クリント風 - 繊細な幾何学的エネルギーバースト

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
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// カラーパレット（攻撃的・エネルギッシュ）
const ENERGY_COLORS = [
  '#E74C3C', // 炎の赤
  '#F39C12', // 黄金
  '#9B59B6', // 紫
  '#E8B4D8', // ピンク
  '#FF6B6B', // コーラルレッド
  '#FFD93D', // サンライト
  '#1ABC9C', // ティール
  '#3498DB', // ブルー
];

const IMPACT_COLORS = [
  '#FFD700', // ゴールド
  '#FF4500', // オレンジレッド
  '#DC143C', // クリムゾン
  '#FF69B4', // ホットピンク
  '#E8B4D8', // ピンク
  '#9B59B6', // パープル
];

interface DamageEffectSvgProps {
  damage: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const DamageEffectSvg: React.FC<DamageEffectSvgProps> = ({
  damage,
  x,
  y,
  onComplete,
}) => {
  // ダメージレベル（5段階）- ゲームバランスに合わせた閾値
  const isExtreme = damage >= 80;   // 極大ダメージ（80+）
  const isMassive = damage >= 50;   // 超大ダメージ（50+）
  const isHeavy = damage >= 25;     // 大ダメージ（25+）
  const isMedium = damage >= 10;    // 中ダメージ（10+）

  // エネルギーリング（放射状に広がる）
  const ringCount = isExtreme ? 16 : isMassive ? 12 : isHeavy ? 8 : isMedium ? 5 : 3;
  const ringAnims = useRef(
    Array.from({ length: ringCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // エネルギーバースト（線状のエネルギー）
  const burstCount = isExtreme ? 48 : isMassive ? 36 : isHeavy ? 24 : isMedium ? 16 : 8;
  const burstAnims = useRef(
    Array.from({ length: burstCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // 幾何学的シンボル（中心）
  const symbolScale = useRef(new Animated.Value(0)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const symbolRotation = useRef(new Animated.Value(0)).current;

  // フラッシュ
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // 衝撃波
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;

  // 内側の波紋（200+用）
  const innerRippleCount = isMassive ? 6 : 0;
  const innerRippleAnims = useRef(
    Array.from({ length: innerRippleCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // 外側の幾何学リング（300+用）
  const geoRingCount = isExtreme ? 4 : 0;
  const geoRingAnims = useRef(
    Array.from({ length: geoRingCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // パーティクル
  const particleCount = isExtreme ? 40 : isMassive ? 30 : isHeavy ? 20 : isMedium ? 12 : 6;
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 40 + Math.random() * (isExtreme ? 120 : isMassive ? 100 : 60);
      return {
        angle,
        distance,
        size: 1 + Math.random() * 3,
        color: ENERGY_COLORS[Math.floor(Math.random() * ENERGY_COLORS.length)],
      };
    })
  , [particleCount, isExtreme, isMassive]);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // バーストデータ
  const burstData = useMemo(() =>
    Array.from({ length: burstCount }, (_, i) => {
      const angle = (i / burstCount) * Math.PI * 2;
      const length = 20 + Math.random() * (isExtreme ? 80 : isMassive ? 60 : 40);
      return { angle, length, color: ENERGY_COLORS[i % ENERGY_COLORS.length] };
    })
  , [burstCount, isExtreme, isMassive]);

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. フラッシュ
    animations.push(
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: isExtreme ? 0.8 : isMassive ? 0.7 : isHeavy ? 0.5 : isMedium ? 0.3 : 0.15,
          duration: 40,
          useNativeDriver: true
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: isExtreme ? 400 : 200,
          useNativeDriver: true
        }),
      ])
    );

    // 2. 衝撃波（重ダメージ時）
    if (isHeavy) {
      animations.push(
        Animated.parallel([
          Animated.timing(shockwaveScale, {
            toValue: isExtreme ? 5 : isMassive ? 4 : 3,
            duration: isExtreme ? 600 : isMassive ? 500 : 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.sequence([
            Animated.timing(shockwaveOpacity, {
              toValue: 0.6,
              duration: 40,
              useNativeDriver: true
            }),
            Animated.timing(shockwaveOpacity, {
              toValue: 0,
              duration: isExtreme ? 560 : isMassive ? 460 : 360,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
          ]),
        ])
      );
    }

    // 3. 内側の波紋（200+用）
    if (isMassive) {
      innerRippleAnims.forEach((anim, index) => {
        const delay = index * 60;
        animations.push(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim.scale, {
                toValue: 1.5 + index * 0.3,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
              }),
              Animated.sequence([
                Animated.timing(anim.opacity, {
                  toValue: 0.5,
                  duration: 60,
                  useNativeDriver: true
                }),
                Animated.timing(anim.opacity, {
                  toValue: 0,
                  duration: 340,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true
                }),
              ]),
            ]),
          ])
        );
      });
    }

    // 4. 幾何学リング（300+用）
    if (isExtreme) {
      geoRingAnims.forEach((anim, index) => {
        const delay = index * 80;
        const direction = index % 2 === 0 ? 1 : -1;
        animations.push(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim.scale, {
                toValue: 2.5 + index * 0.5,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
              }),
              Animated.timing(anim.rotation, {
                toValue: direction * 0.5,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true
              }),
              Animated.sequence([
                Animated.timing(anim.opacity, {
                  toValue: 0.7,
                  duration: 80,
                  useNativeDriver: true
                }),
                Animated.timing(anim.opacity, {
                  toValue: 0,
                  duration: 620,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true
                }),
              ]),
            ]),
          ])
        );
      });
    }

    // 5. 中心シンボル
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(symbolScale, {
            toValue: isExtreme ? 1.8 : isMassive ? 1.5 : 1.2,
            friction: 4,
            tension: 100,
            useNativeDriver: true
          }),
          Animated.timing(symbolScale, {
            toValue: 0,
            duration: isExtreme ? 500 : 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(symbolOpacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.delay(isExtreme ? 350 : 200),
          Animated.timing(symbolOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
        ]),
        Animated.timing(symbolRotation, {
          toValue: isExtreme ? 2 : isMassive ? 1.5 : 1,
          duration: isExtreme ? 800 : 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
      ])
    );

    // 6. エネルギーリング
    ringAnims.forEach((anim, index) => {
      const delay = index * 30;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 2 + index * 0.4,
              duration: isExtreme ? 600 : 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.5 - index * 0.03,
                duration: 60,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: isExtreme ? 540 : 340,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 7. エネルギーバースト（放射線）
    burstAnims.forEach((anim) => {
      const delay = Math.random() * 80;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1.5 + Math.random() * 0.5,
              duration: 250 + Math.random() * 100,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.6,
                duration: 40,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 210 + Math.random() * 100,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 8. パーティクル
    particleAnims.forEach((anim) => {
      const delay = Math.random() * 50;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 350 + Math.random() * 100,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 40,
                useNativeDriver: true
              }),
              Animated.delay(180),
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

    // 全アニメーション実行
    Animated.parallel(animations).start(() => {
      onComplete();
    });

    // タイムアウト保証
    const timeout = setTimeout(onComplete, isExtreme ? 900 : isMassive ? 700 : 600);
    return () => clearTimeout(timeout);
  }, []);

  // 幾何学パターン生成（星型）
  const createStar = (cx: number, cy: number, radius: number, points: number): string => {
    let path = '';
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? radius : radius * 0.4;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }
    path += ' Z';
    return path;
  };

  // 放射線パターン生成
  const createBurstLine = (cx: number, cy: number, angle: number, length: number): string => {
    const x2 = cx + length * Math.cos(angle);
    const y2 = cy + length * Math.sin(angle);
    return `M ${cx} ${cy} L ${x2} ${y2}`;
  };

  // 神聖幾何学リング（300+用）
  const createSacredRing = (cx: number, cy: number, radius: number, segments: number): string => {
    let path = '';
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 0.5) / segments) * Math.PI * 2;
      const x1 = cx + radius * Math.cos(angle1);
      const y1 = cy + radius * Math.sin(angle1);
      const x2 = cx + radius * 1.1 * Math.cos(angle2);
      const y2 = cy + radius * 1.1 * Math.sin(angle2);
      const x3 = cx + radius * Math.cos(((i + 1) / segments) * Math.PI * 2);
      const y3 = cy + radius * Math.sin(((i + 1) / segments) * Math.PI * 2);
      path += `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} `;
    }
    return path;
  };

  const symbolSize = isExtreme ? 30 : isMassive ? 25 : isHeavy ? 20 : isMedium ? 14 : 10;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* フラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          {
            opacity: flashOpacity,
            backgroundColor: isExtreme ? '#FFFFFF' : isMassive ? '#FFD700' : '#FF6B6B',
          },
        ]}
      />

      {/* 衝撃波 */}
      {isHeavy && (
        <Animated.View
          style={[
            styles.shockwave,
            {
              left: x - 60,
              top: y - 60,
              opacity: shockwaveOpacity,
              transform: [{ scale: shockwaveScale }],
            },
          ]}
        >
          <Svg width={120} height={120}>
            <Defs>
              <RadialGradient id="impactGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={isExtreme ? '#FFFFFF' : '#FFD700'} stopOpacity={0.6} />
                <Stop offset="50%" stopColor="#FF6B6B" stopOpacity={0.3} />
                <Stop offset="100%" stopColor="#E74C3C" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={60} cy={60} r={60} fill="url(#impactGrad)" />
            <Circle cx={60} cy={60} r={55} stroke="#FFD700" strokeWidth={0.5} fill="none" opacity={0.4} />
          </Svg>
        </Animated.View>
      )}

      {/* 内側の波紋（200+用） */}
      {isMassive && innerRippleAnims.map((anim, index) => (
        <Animated.View
          key={`ripple-${index}`}
          style={[
            styles.ring,
            {
              left: x - 25,
              top: y - 25,
              width: 50,
              height: 50,
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }],
            },
          ]}
        >
          <Svg width={50} height={50}>
            <Circle
              cx={25}
              cy={25}
              r={20}
              stroke={IMPACT_COLORS[index % IMPACT_COLORS.length]}
              strokeWidth={0.3}
              fill="none"
              strokeDasharray="3,3"
            />
          </Svg>
        </Animated.View>
      ))}

      {/* 幾何学リング（300+用） */}
      {isExtreme && geoRingAnims.map((anim, index) => {
        const geoSize = 80 + index * 20;
        return (
          <Animated.View
            key={`geo-${index}`}
            style={[
              styles.ring,
              {
                left: x - geoSize / 2,
                top: y - geoSize / 2,
                width: geoSize,
                height: geoSize,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ['-180deg', '0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={geoSize} height={geoSize}>
              <Path
                d={createSacredRing(geoSize / 2, geoSize / 2, geoSize / 3, 12 + index * 4)}
                stroke={ENERGY_COLORS[index % ENERGY_COLORS.length]}
                strokeWidth={0.4}
                fill="none"
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* エネルギーリング */}
      {ringAnims.map((anim, index) => (
        <Animated.View
          key={`ring-${index}`}
          style={[
            styles.ring,
            {
              left: x - 25 - index * 3,
              top: y - 25 - index * 3,
              width: 50 + index * 6,
              height: 50 + index * 6,
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }],
            },
          ]}
        >
          <Svg width={50 + index * 6} height={50 + index * 6}>
            <Circle
              cx={(50 + index * 6) / 2}
              cy={(50 + index * 6) / 2}
              r={(18 + index * 3)}
              stroke={IMPACT_COLORS[index % IMPACT_COLORS.length]}
              strokeWidth={0.6 - index * 0.03}
              fill="none"
            />
          </Svg>
        </Animated.View>
      ))}

      {/* エネルギーバースト（放射線） */}
      {burstAnims.map((anim, index) => {
        const data = burstData[index];
        return (
          <Animated.View
            key={`burst-${index}`}
            style={[
              styles.burst,
              {
                left: x - 50,
                top: y - 50,
                opacity: anim.opacity,
                transform: [{ scale: anim.scale }],
              },
            ]}
          >
            <Svg width={100} height={100}>
              <Path
                d={createBurstLine(50, 50, data.angle, data.length)}
                stroke={data.color}
                strokeWidth={0.5}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        );
      })}

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
              <Circle cx={data.size} cy={data.size} r={data.size} fill={data.color} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 中心シンボル（星型） */}
      <Animated.View
        style={[
          styles.symbol,
          {
            left: x - symbolSize - 5,
            top: y - symbolSize - 5,
            opacity: symbolOpacity,
            transform: [
              { scale: symbolScale },
              {
                rotate: symbolRotation.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0deg', '180deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={(symbolSize + 5) * 2} height={(symbolSize + 5) * 2}>
          <Path
            d={createStar(symbolSize + 5, symbolSize + 5, symbolSize, isExtreme ? 12 : isMassive ? 10 : isHeavy ? 8 : 6)}
            fill="none"
            stroke="#FFD700"
            strokeWidth={0.8}
          />
          <Path
            d={createStar(symbolSize + 5, symbolSize + 5, symbolSize * 0.6, isExtreme ? 8 : 4)}
            fill="none"
            stroke="#F39C12"
            strokeWidth={0.5}
          />
          {(isMassive || isExtreme) && (
            <Path
              d={createStar(symbolSize + 5, symbolSize + 5, symbolSize * 0.3, 4)}
              fill="#FFFFFF"
              stroke="none"
              opacity={0.8}
            />
          )}
        </Svg>
      </Animated.View>
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
  },
  shockwave: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  burst: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  symbol: {
    position: 'absolute',
  },
});
