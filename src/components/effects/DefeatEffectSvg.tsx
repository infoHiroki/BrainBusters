// 敵撃破エフェクト（SVG版）
// ヒルマ・アフ・クリント風 - 繊細な神聖幾何学的崩壊

import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
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

// カラーパレット（敵タイプ別）
const NORMAL_COLORS = [
  '#888888', // グレー
  '#AAAAAA', // ライトグレー
  '#666666', // ダークグレー
  '#B0B0B0', // シルバー
  '#9E9E9E', // ミディアムグレー
];

const ELITE_COLORS = [
  '#FFD700', // ゴールド
  '#FFA500', // オレンジ
  '#FF8C00', // ダークオレンジ
  '#FFDF00', // ゴールデンイエロー
  '#E8B4D8', // ピンク
  '#F5E6D3', // クリーム
];

const BOSS_COLORS = [
  '#FFD700', // ゴールド
  '#FF6B6B', // コーラル
  '#4ECDC4', // ティール
  '#9B59B6', // パープル
  '#E74C3C', // レッド
  '#F39C12', // オレンジ
  '#1ABC9C', // ティール
  '#E8B4D8', // ピンク
  '#3498DB', // ブルー
  '#2ECC71', // グリーン
];

interface DefeatEffectSvgProps {
  x: number;
  y: number;
  enemyType: 'normal' | 'elite' | 'boss';
  onComplete: () => void;
}

export const DefeatEffectSvg: React.FC<DefeatEffectSvgProps> = ({
  x,
  y,
  enemyType,
  onComplete,
}) => {
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // 設定（敵タイプ別）- より繊細に
  const config = {
    normal: { colors: NORMAL_COLORS, ringCount: 5, particleCount: 12, fragmentCount: 8, showText: false },
    elite: { colors: ELITE_COLORS, ringCount: 8, particleCount: 20, fragmentCount: 14, showText: false },
    boss: { colors: BOSS_COLORS, ringCount: 24, particleCount: 60, fragmentCount: 40, showText: false },
  };

  const { colors, ringCount, particleCount, fragmentCount, showText } = config[enemyType];

  // 崩壊リング
  const ringAnims = useRef(
    Array.from({ length: ringCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // 神聖幾何学フラグメント
  const fragmentData = useMemo(() =>
    Array.from({ length: fragmentCount }, (_, i) => {
      const angle = (i / fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const distance = 50 + Math.random() * (enemyType === 'boss' ? 100 : 70);
      return {
        angle,
        distance,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        sides: [3, 4, 5, 6, 8][Math.floor(Math.random() * 5)],
        rotationSpeed: (Math.random() - 0.5) * 2,
      };
    })
  , [fragmentCount, colors, enemyType]);

  const fragmentAnims = useRef(
    Array.from({ length: fragmentCount }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // エネルギーパーティクル
  const particleData = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 30 + Math.random() * 60;
      return {
        angle,
        distance,
        size: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    })
  , [particleCount, colors]);

  const particleAnims = useRef(
    Array.from({ length: particleCount }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // 中心シンボル
  const symbolScale = useRef(new Animated.Value(0)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const symbolRotation = useRef(new Animated.Value(0)).current;

  // 蓮の花（ボス用）- 複数レイヤー
  const lotusLayerCount = enemyType === 'boss' ? 6 : 0;
  const lotusAnims = useRef(
    Array.from({ length: lotusLayerCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // 内側の波紋（エリート・ボス用）
  const innerRippleCount = enemyType === 'boss' ? 12 : enemyType === 'elite' ? 4 : 0;
  const innerRippleAnims = useRef(
    Array.from({ length: innerRippleCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. フラッシュ
    if (enemyType === 'boss' || enemyType === 'elite') {
      animations.push(
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: enemyType === 'boss' ? 0.6 : 0.3,
            duration: 80,
            useNativeDriver: true
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: enemyType === 'boss' ? 500 : 300,
            useNativeDriver: true
          }),
        ])
      );
    }

    // 2. 内側の波紋（エリート・ボス用）
    if (innerRippleCount > 0) {
      innerRippleAnims.forEach((anim, index) => {
        const delay = index * 50;
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
                  toValue: 0.4,
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

    // 3. 崩壊リング
    ringAnims.forEach((anim, index) => {
      const delay = enemyType === 'boss' ? index * 60 : index * 40;
      const direction = index % 2 === 0 ? 1 : -1;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 2 + index * (enemyType === 'boss' ? 0.4 : 0.35),
              duration: enemyType === 'boss' ? 1400 : 750,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.rotation, {
              toValue: direction * 0.3,
              duration: enemyType === 'boss' ? 1800 : 1000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: enemyType === 'boss' ? 0.6 - index * 0.02 : 0.5 - index * 0.03,
                duration: 120,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: enemyType === 'boss' ? 1300 : 630,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 4. フラグメント（飛散）
    fragmentAnims.forEach((anim, index) => {
      const delay = index * 18;
      const data = fragmentData[index];
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 680,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.rotation, {
              toValue: data.rotationSpeed,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.spring(anim.scale, {
                toValue: 1,
                friction: 5,
                tension: 100,
                useNativeDriver: true
              }),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true
              }),
            ]),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.7,
                duration: 120,
                useNativeDriver: true
              }),
              Animated.delay(380),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 5. パーティクル
    particleAnims.forEach((anim) => {
      const delay = Math.random() * 60;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 520 + Math.random() * 150,
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
                duration: 280,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 6. 中心シンボル
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(symbolScale, {
            toValue: enemyType === 'boss' ? 1.8 : enemyType === 'elite' ? 1.4 : 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true
          }),
          Animated.timing(symbolScale, {
            toValue: 0,
            duration: 450,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(symbolOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true
          }),
          Animated.delay(420),
          Animated.timing(symbolOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }),
        ]),
        Animated.timing(symbolRotation, {
          toValue: enemyType === 'boss' ? 2 : 1,
          duration: 950,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
      ])
    );

    // 7. ボス用：蓮の花（複数レイヤー）
    if (enemyType === 'boss') {
      lotusAnims.forEach((anim, index) => {
        const delay = 100 + index * 150;
        const direction = index % 2 === 0 ? 1 : -1;
        animations.push(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.sequence([
                Animated.spring(anim.scale, {
                  toValue: 1 + index * 0.4,
                  friction: 4,
                  tension: 40,
                  useNativeDriver: true
                }),
                Animated.timing(anim.scale, {
                  toValue: 2.5 + index * 0.6,
                  duration: 1200,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true
                }),
              ]),
              Animated.sequence([
                Animated.timing(anim.opacity, {
                  toValue: 0.5 - index * 0.06,
                  duration: 200,
                  useNativeDriver: true
                }),
                Animated.delay(800),
                Animated.timing(anim.opacity, {
                  toValue: 0,
                  duration: 600,
                  useNativeDriver: true
                }),
              ]),
              Animated.timing(anim.rotation, {
                toValue: direction * (0.4 + index * 0.12),
                duration: 2000,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ])
        );
      });

      // テキスト
      animations.push(
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.spring(textScale, {
              toValue: 1,
              friction: 4,
              tension: 80,
              useNativeDriver: true
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true
            }),
          ]),
          Animated.delay(1200),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }),
        ])
      );
    }

    // 全アニメーション実行
    let completed = false;
    const safeComplete = () => {
      if (!completed) {
        completed = true;
        onComplete();
      }
    };

    Animated.parallel(animations).start(() => {
      setTimeout(safeComplete, 100);
    });

    // タイムアウト保証（エフェクトが見えるよう延長）
    const timeout = setTimeout(safeComplete, enemyType === 'boss' ? 4000 : 1400);
    return () => clearTimeout(timeout);
  }, [enemyType]);

  // 正多角形パス生成
  const createPolygon = (cx: number, cy: number, radius: number, sides: number): string => {
    let path = '';
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    }
    path += ' Z';
    return path;
  };

  // 蓮の花びらパス生成
  const createLotusPetals = (cx: number, cy: number, radius: number, petals: number): string => {
    let path = '';
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + radius * 0.2 * Math.cos(angle - 0.12);
      const y1 = cy + radius * 0.2 * Math.sin(angle - 0.12);
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      const x3 = cx + radius * 0.2 * Math.cos(angle + 0.12);
      const y3 = cy + radius * 0.2 * Math.sin(angle + 0.12);
      path += `M ${cx} ${cy} Q ${x1} ${y1} ${x2} ${y2} Q ${x3} ${y3} ${cx} ${cy} `;
    }
    return path;
  };

  // 神聖幾何学リングパス
  const createSacredRing = (cx: number, cy: number, radius: number, segments: number): string => {
    let path = '';
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 0.5) / segments) * Math.PI * 2;
      const x1 = cx + radius * Math.cos(angle1);
      const y1 = cy + radius * Math.sin(angle1);
      const x2 = cx + radius * 1.08 * Math.cos(angle2);
      const y2 = cy + radius * 1.08 * Math.sin(angle2);
      const x3 = cx + radius * Math.cos(((i + 1) / segments) * Math.PI * 2);
      const y3 = cy + radius * Math.sin(((i + 1) / segments) * Math.PI * 2);
      path += `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} `;
    }
    return path;
  };

  const symbolSize = enemyType === 'boss' ? 18 : enemyType === 'elite' ? 12 : 8;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* フラッシュ */}
      {(enemyType === 'boss' || enemyType === 'elite') && (
        <Animated.View
          style={[
            styles.flash,
            {
              opacity: flashOpacity,
              backgroundColor: enemyType === 'boss' ? '#FFD700' : '#FFA500',
            },
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

      {/* 内側の波紋（エリート・ボス用） */}
      {innerRippleAnims.map((anim, index) => (
        <Animated.View
          key={`ripple-${index}`}
          style={[
            styles.ring,
            {
              left: x - 20,
              top: y - 20,
              width: 40,
              height: 40,
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }],
            },
          ]}
        >
          <Svg width={40} height={40}>
            <Circle
              cx={20}
              cy={20}
              r={16}
              stroke={colors[index % colors.length]}
              strokeWidth={0.3}
              fill="none"
              strokeDasharray="2,2"
            />
          </Svg>
        </Animated.View>
      ))}

      {/* 崩壊リング */}
      {ringAnims.map((anim, index) => {
        const ringSize = 50 + index * 12;
        return (
          <Animated.View
            key={`ring-${index}`}
            style={[
              styles.ring,
              {
                left: x - ringSize / 2,
                top: y - ringSize / 2,
                width: ringSize,
                height: ringSize,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ['-120deg', '0deg', '120deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={ringSize} height={ringSize}>
              <Path
                d={createSacredRing(ringSize / 2, ringSize / 2, ringSize / 3, 6 + index)}
                stroke={colors[index % colors.length]}
                strokeWidth={0.4}
                fill="none"
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* フラグメント（飛散する幾何学図形） */}
      {fragmentData.map((data, index) => {
        const anim = fragmentAnims[index];
        const fragSize = data.size * 2 + 2;
        return (
          <Animated.View
            key={`fragment-${index}`}
            style={[
              styles.fragment,
              {
                left: x - fragSize / 2,
                top: y - fragSize / 2,
                width: fragSize,
                height: fragSize,
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
                      outputRange: [0, Math.sin(data.angle) * data.distance - 20],
                    }),
                  },
                  { scale: anim.scale },
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [-2, 0, 2],
                      outputRange: ['-360deg', '0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={fragSize} height={fragSize}>
              <Path
                d={createPolygon(fragSize / 2, fragSize / 2, data.size, data.sides)}
                fill="none"
                stroke={data.color}
                strokeWidth={0.5}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* エネルギーパーティクル */}
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

      {/* 中心シンボル */}
      <Animated.View
        style={[
          styles.symbol,
          {
            left: x - symbolSize - 4,
            top: y - symbolSize - 4,
            width: (symbolSize + 4) * 2,
            height: (symbolSize + 4) * 2,
            opacity: symbolOpacity,
            transform: [
              { scale: symbolScale },
              {
                rotate: symbolRotation.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0deg', '360deg', '720deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={(symbolSize + 4) * 2} height={(symbolSize + 4) * 2}>
          <Defs>
            <RadialGradient id="defeatGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors[0]} stopOpacity={0.6} />
              <Stop offset="60%" stopColor={colors[1] || colors[0]} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colors[2] || colors[0]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={symbolSize + 4}
            cy={symbolSize + 4}
            r={symbolSize}
            fill="url(#defeatGrad)"
          />
          <Path
            d={createPolygon(symbolSize + 4, symbolSize + 4, symbolSize - 2, 6)}
            stroke={colors[0]}
            strokeWidth={0.5}
            fill="none"
          />
          <Path
            d={createPolygon(symbolSize + 4, symbolSize + 4, symbolSize * 0.5, 6)}
            stroke={colors[1] || colors[0]}
            strokeWidth={0.3}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* ボス用：蓮の花（複数レイヤー） */}
      {enemyType === 'boss' && lotusAnims.map((anim, index) => {
        const lotusSize = 90 + index * 30;
        const petalCount = 10 + index * 4;
        return (
          <Animated.View
            key={`lotus-${index}`}
            style={[
              styles.lotus,
              {
                left: x - lotusSize / 2,
                top: y - lotusSize / 2,
                width: lotusSize,
                height: lotusSize,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ['-120deg', '0deg', '120deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={lotusSize} height={lotusSize}>
              <Path
                d={createLotusPetals(lotusSize / 2, lotusSize / 2, lotusSize / 2.5, petalCount)}
                stroke={BOSS_COLORS[index * 2 % BOSS_COLORS.length]}
                strokeWidth={0.4}
                fill={BOSS_COLORS[(index * 2 + 1) % BOSS_COLORS.length]}
                fillOpacity={0.15}
              />
            </Svg>
          </Animated.View>
        );
      })}
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
  ring: {
    position: 'absolute',
  },
  fragment: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  symbol: {
    position: 'absolute',
  },
  lotus: {
    position: 'absolute',
  },
});
