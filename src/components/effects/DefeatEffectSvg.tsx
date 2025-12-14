// 敵撃破エフェクト（SVG版）
// ヒルマ・アフ・クリント風 - 神聖幾何学的崩壊

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
];

const ELITE_COLORS = [
  '#FFD700', // ゴールド
  '#FFA500', // オレンジ
  '#FF8C00', // ダークオレンジ
  '#FFDF00', // ゴールデンイエロー
  '#E8B4D8', // ピンク
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

  // 設定（敵タイプ別）
  const config = {
    normal: { colors: NORMAL_COLORS, ringCount: 4, particleCount: 8, fragmentCount: 6, showText: false },
    elite: { colors: ELITE_COLORS, ringCount: 6, particleCount: 14, fragmentCount: 10, showText: false },
    boss: { colors: BOSS_COLORS, ringCount: 10, particleCount: 24, fragmentCount: 16, showText: true },
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
      const distance = 60 + Math.random() * 80;
      return {
        angle,
        distance,
        size: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        sides: [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        rotationSpeed: (Math.random() - 0.5) * 2,
      };
    })
  , [fragmentCount, colors]);

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
      const distance = 40 + Math.random() * 60;
      return {
        angle,
        distance,
        size: 2 + Math.random() * 4,
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

  // 蓮の花（ボス用）
  const lotusScale = useRef(new Animated.Value(0)).current;
  const lotusOpacity = useRef(new Animated.Value(0)).current;
  const lotusRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // 1. フラッシュ
    if (enemyType === 'boss') {
      animations.push(
        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }),
        ])
      );
    }

    // 2. 崩壊リング
    ringAnims.forEach((anim, index) => {
      const delay = index * 30;
      const direction = index % 2 === 0 ? 1 : -1;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 2 + index * 0.4,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.rotation, {
              toValue: direction,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.6 - index * 0.05,
                duration: 100,
                useNativeDriver: true
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 3. フラグメント（飛散）
    fragmentAnims.forEach((anim, index) => {
      const delay = index * 15;
      const data = fragmentData[index];
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(anim.rotation, {
              toValue: data.rotationSpeed,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.spring(anim.scale, {
                toValue: 1.2,
                friction: 4,
                tension: 120,
                useNativeDriver: true
              }),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              }),
            ]),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
              }),
              Animated.delay(300),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 4. パーティクル
    particleAnims.forEach((anim) => {
      const delay = Math.random() * 50;
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 400 + Math.random() * 100,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 50,
                useNativeDriver: true
              }),
              Animated.delay(200),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              }),
            ]),
          ]),
        ])
      );
    });

    // 5. 中心シンボル
    animations.push(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(symbolScale, {
            toValue: 1.5,
            friction: 4,
            tension: 80,
            useNativeDriver: true
          }),
          Animated.timing(symbolScale, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
          }),
        ]),
        Animated.sequence([
          Animated.timing(symbolOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.delay(300),
          Animated.timing(symbolOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
        ]),
        Animated.timing(symbolRotation, {
          toValue: enemyType === 'boss' ? 2 : 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
      ])
    );

    // 6. ボス用：蓮の花 + テキスト
    if (enemyType === 'boss') {
      animations.push(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(100),
            Animated.spring(lotusScale, {
              toValue: 1,
              friction: 3,
              tension: 60,
              useNativeDriver: true
            }),
            Animated.timing(lotusScale, {
              toValue: 2,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true
            }),
          ]),
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(lotusOpacity, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true
            }),
            Animated.delay(600),
            Animated.timing(lotusOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true
            }),
          ]),
          Animated.timing(lotusRotation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
        ])
      );

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
    Animated.parallel(animations).start(() => {
      setTimeout(onComplete, 100);
    });

    // タイムアウト保証
    const timeout = setTimeout(onComplete, enemyType === 'boss' ? 2000 : 800);
    return () => clearTimeout(timeout);
  }, [enemyType, onComplete]);

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
      const x1 = cx + radius * 0.2 * Math.cos(angle - 0.15);
      const y1 = cy + radius * 0.2 * Math.sin(angle - 0.15);
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      const x3 = cx + radius * 0.2 * Math.cos(angle + 0.15);
      const y3 = cy + radius * 0.2 * Math.sin(angle + 0.15);
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
      const x2 = cx + radius * 1.15 * Math.cos(angle2);
      const y2 = cy + radius * 1.15 * Math.sin(angle2);
      const x3 = cx + radius * Math.cos(((i + 1) / segments) * Math.PI * 2);
      const y3 = cy + radius * Math.sin(((i + 1) / segments) * Math.PI * 2);
      path += `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} `;
    }
    return path;
  };

  const symbolSize = enemyType === 'boss' ? 20 : enemyType === 'elite' ? 15 : 10;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* ボス撃破時のフラッシュ */}
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

      {/* 崩壊リング */}
      {ringAnims.map((anim, index) => {
        const ringSize = 60 + index * 16;
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
                      outputRange: ['-180deg', '0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={ringSize} height={ringSize}>
              <Path
                d={createSacredRing(ringSize / 2, ringSize / 2, 20 + index * 8, 6 + index * 2)}
                stroke={colors[index % colors.length]}
                strokeWidth={1.5 - index * 0.1}
                fill="none"
              />
            </Svg>
          </Animated.View>
        );
      })}

      {/* フラグメント（飛散する幾何学図形） */}
      {fragmentData.map((data, index) => {
        const anim = fragmentAnims[index];
        const fragSize = data.size * 2 + 4;
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
                      outputRange: [0, Math.sin(data.angle) * data.distance - 30],
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
                fill={data.color}
                stroke={colors[0]}
                strokeWidth={0.5}
                opacity={0.8}
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
            left: x - symbolSize - 5,
            top: y - symbolSize - 5,
            width: (symbolSize + 5) * 2,
            height: (symbolSize + 5) * 2,
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
        <Svg width={(symbolSize + 5) * 2} height={(symbolSize + 5) * 2}>
          <Defs>
            <RadialGradient id="defeatGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors[0]} stopOpacity={0.8} />
              <Stop offset="50%" stopColor={colors[1] || colors[0]} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={colors[2] || colors[0]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={symbolSize + 5}
            cy={symbolSize + 5}
            r={symbolSize}
            fill="url(#defeatGrad)"
          />
          <Path
            d={createPolygon(symbolSize + 5, symbolSize + 5, symbolSize - 2, 6)}
            stroke={colors[0]}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* ボス用：蓮の花 */}
      {enemyType === 'boss' && (
        <Animated.View
          style={[
            styles.lotus,
            {
              left: x - 55,
              top: y - 55,
              opacity: lotusOpacity,
              transform: [
                { scale: lotusScale },
                {
                  rotate: lotusRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '120deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={110} height={110}>
            <Path
              d={createLotusPetals(55, 55, 50, 12)}
              stroke="#FFD700"
              strokeWidth={1}
              fill="#E8B4D8"
              fillOpacity={0.3}
            />
            <Path
              d={createLotusPetals(55, 55, 35, 8)}
              stroke="#9B59B6"
              strokeWidth={0.8}
              fill="#DDA0DD"
              fillOpacity={0.25}
            />
          </Svg>
        </Animated.View>
      )}
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
