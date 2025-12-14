// サイケデリックエフェクト
// ヒルマ・アフ・クリント風 - 宇宙的でスピリチュアルなヒッピーテイスト

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 3;

interface PsychedelicEffectProps {
  isBoss?: boolean;
  onComplete?: () => void;
}

// ヒルマ・アフ・クリント風カラーパレット（宇宙的・スピリチュアル）
const COSMIC_COLORS = [
  '#E8B4D8', // ソフトピンク
  '#9B59B6', // ディープパープル
  '#3498DB', // コズミックブルー
  '#1ABC9C', // エーテリアルティール
  '#F39C12', // ゴールデンイエロー
  '#E74C3C', // サンセットレッド
  '#F5E6D3', // クリーム
  '#8E44AD', // ミスティックバイオレット
  '#2ECC71', // スピリチュアルグリーン
  '#D4A574', // アースオレンジ
];

// パステル系の蓮の花カラー
const LOTUS_COLORS = [
  '#FFB6C1', // ライトピンク
  '#DDA0DD', // プラム
  '#E6E6FA', // ラベンダー
  '#B0E0E6', // パウダーブルー
  '#FFDAB9', // ピーチ
];

export const PsychedelicEffect: React.FC<PsychedelicEffectProps> = ({
  isBoss = false,
  onComplete,
}) => {
  // ===== 宇宙の輪（コズミックリング）- 無限に広がり続ける =====
  const cosmicRingCount = isBoss ? 30 : 22;
  const cosmicRingAnims = useRef(
    Array.from({ length: cosmicRingCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // ===== 蓮の花びら（ロータスペタル）- より多くのレイヤー =====
  const lotusLayers = isBoss ? 6 : 5;
  const lotusRotations = useRef(
    Array.from({ length: lotusLayers }, () => new Animated.Value(0))
  ).current;
  const lotusScales = useRef(
    Array.from({ length: lotusLayers }, () => new Animated.Value(1))
  ).current;

  // ===== オーラの波動 =====
  const auraRotation = useRef(new Animated.Value(0)).current;
  const auraRotation2 = useRef(new Animated.Value(0)).current;

  // ===== 中心の宇宙の目（3つのレイヤー、それぞれずらして回転）=====
  const eyeLayerCount = 3;
  const eyeAnims = useRef(
    Array.from({ length: eyeLayerCount }, () => ({
      pulse: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  // ===== フラッシュ =====
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // ===== ボス用爆発エフェクト =====
  const explosionCount = 8;
  const explosionAnims = useRef(
    Array.from({ length: explosionCount }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // ===== 紙吹雪（継続的に降り注ぐ）=====
  const confettiCount = isBoss ? 160 : 110;
  const confettiAnims = useRef(
    Array.from({ length: confettiCount }, () => ({
      opacity: new Animated.Value(1),
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      rotateZ: new Animated.Value(0),
      scaleX: new Animated.Value(1),
    }))
  ).current;

  const confettiData = useRef(
    Array.from({ length: confettiCount }, (_, i) => {
      // 小さめの紙吹雪
      const width = 5 + Math.random() * 7;  // 5-12px
      const height = width * (0.6 + Math.random() * 0.5);  // 60-110% of width
      // 画面全体にバラバラに配置（最初から画面内にも存在）
      const initialY = Math.random() * (SCREEN_HEIGHT + 200) - 100;
      return {
        startX: Math.random() * SCREEN_WIDTH,
        initialY,
        width,
        height,
        color: [...COSMIC_COLORS, ...LOTUS_COLORS][Math.floor(Math.random() * (COSMIC_COLORS.length + LOTUS_COLORS.length))],
        // 大きい紙ほど遅く落ちる
        fallDuration: 4000 + width * 200,
        swayAmount: 25 + Math.random() * 35,
        swayDuration: 1200 + Math.random() * 800,
        flipSpeed: 200 + Math.random() * 300,
        rotateDirection: Math.random() > 0.5 ? 1 : -1,
      };
    })
  ).current;

  useEffect(() => {
    // 1. ソフトフラッシュ
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.5, duration: 120, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // 2. 宇宙の目（中心）- 3つのレイヤーがずれて脈動＋回転
    eyeAnims.forEach((anim, index) => {
      const stagger = index * 1500; // 1.5秒ずつずらす
      const rotationDirection = index % 2 === 0 ? 1 : -1; // 交互に逆回転
      const rotationDuration = 6000 + index * 2000; // レイヤーごとに異なる回転速度

      // 回転アニメーション（ずっと回り続ける）
      Animated.loop(
        Animated.timing(anim.rotation, {
          toValue: rotationDirection,
          duration: rotationDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 脈動アニメーション（ずらして開始）
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            // 消滅点から出現
            Animated.parallel([
              Animated.timing(anim.opacity, { toValue: 0.8 - index * 0.15, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(anim.pulse, { toValue: 2.2, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // 軽く脈動
            Animated.sequence([
              Animated.timing(anim.pulse, { toValue: 1.8, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(anim.pulse, { toValue: 2.2, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
            // 消滅点に吸い込まれる
            Animated.parallel([
              Animated.timing(anim.opacity, { toValue: 0, duration: 2000, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
              Animated.timing(anim.pulse, { toValue: 0, duration: 2000, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            ]),
            Animated.delay(1200),
            // リセット
            Animated.parallel([
              Animated.timing(anim.opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
              Animated.timing(anim.pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, stagger);
    });

    // ボス用爆発エフェクト（最初に一度だけ）
    if (isBoss) {
      explosionAnims.forEach((anim, index) => {
        const delay = index * 80;
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(anim.scale, { toValue: 15, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 0.7, duration: 150, useNativeDriver: true }),
              Animated.timing(anim.opacity, { toValue: 0, duration: 1050, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]),
          ]).start();
        }, delay);
      });
    }

    // 3. コズミックリング（無限に広がり続ける）
    cosmicRingAnims.forEach((anim, index) => {
      const stagger = index * 150; // より短い間隔で次々と生成
      Animated.loop(
        Animated.sequence([
          Animated.delay(stagger),
          Animated.parallel([
            // scale 25 で非常に遠くまで拡大（画面外に完全に消えるまで）
            Animated.timing(anim.scale, { toValue: 25, duration: 5000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 0.4, duration: 300, useNativeDriver: true }),
              Animated.timing(anim.opacity, { toValue: 0, duration: 4700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(anim.scale, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });

    // 4. 蓮の花びら回転＋呼吸（各レイヤーが異なる速度）
    lotusRotations.forEach((rotation, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const duration = 8000 + index * 2000;
      Animated.loop(
        Animated.timing(rotation, {
          toValue: direction,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    // 蓮の花の呼吸（スケール）
    lotusScales.forEach((scale, index) => {
      const duration = 3000 + index * 500;
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });

    // 5. オーラの波動回転
    Animated.loop(
      Animated.timing(auraRotation, {
        toValue: 1,
        duration: isBoss ? 12000 : 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(auraRotation2, {
        toValue: -1,
        duration: isBoss ? 18000 : 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 6. 紙吹雪（継続的に降り注ぐ）
    confettiAnims.forEach((anim, index) => {
      const data = confettiData[index];

      // 初期位置（画面全体にバラバラに配置）
      anim.y.setValue(data.initialY);
      anim.x.setValue(0);

      // 落下アニメーション（コールバックで上に戻してループ）
      const startFall = (fromY: number) => {
        const distance = SCREEN_HEIGHT + 150 - fromY;
        const duration = (distance / (SCREEN_HEIGHT + 250)) * data.fallDuration;

        Animated.timing(anim.y, {
          toValue: SCREEN_HEIGHT + 100,
          duration: Math.max(duration, 500),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          // 上に戻す（ランダムなX位置で）
          anim.y.setValue(-50 - Math.random() * 50);
          confettiData[index].startX = Math.random() * SCREEN_WIDTH;
          startFall(-50 - Math.random() * 50);
        });
      };
      startFall(data.initialY);

      // ひらひら効果（紙が裏返る）
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim.scaleX, { toValue: -1, duration: data.flipSpeed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim.scaleX, { toValue: 1, duration: data.flipSpeed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();

      // 回転
      Animated.loop(
        Animated.timing(anim.rotateZ, {
          toValue: data.rotateDirection,
          duration: data.flipSpeed * 10,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 横揺れ（始点に戻るループ）
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim.x, { toValue: data.swayAmount, duration: data.swayDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim.x, { toValue: 0, duration: data.swayDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim.x, { toValue: -data.swayAmount, duration: data.swayDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim.x, { toValue: 0, duration: data.swayDuration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });

    if (onComplete) {
      setTimeout(onComplete, 5000);
    }
  }, []);

  // 蓮の花びらパス生成
  const createLotusPetals = (cx: number, cy: number, radius: number, petals: number): string => {
    let path = '';
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
      const nextAngle = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;

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

  // オーラの波パス生成
  const createAuraWaves = (cx: number, cy: number, radius: number, waves: number): string => {
    let path = '';
    for (let i = 0; i < waves; i++) {
      const startAngle = (i / waves) * Math.PI * 2;
      const endAngle = ((i + 0.8) / waves) * Math.PI * 2;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * 1.3 * Math.cos((startAngle + endAngle) / 2);
      const y2 = cy + radius * 1.3 * Math.sin((startAngle + endAngle) / 2);
      const x3 = cx + radius * Math.cos(endAngle);
      const y3 = cy + radius * Math.sin(endAngle);

      path += `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} `;
    }
    return path;
  };

  // 蓮の花びらを画面全体に広げる
  const lotusPetalCounts = [6, 10, 14, 18, 24, 32];
  const lotusRadii = [60, 120, 200, 300, 420, 550];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* ソフトフラッシュ */}
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity, backgroundColor: isBoss ? '#E8B4D8' : '#B0E0E6' },
        ]}
      />

      {/* コズミックリング */}
      {cosmicRingAnims.map((anim, index) => (
        <Animated.View
          key={`cosmic-${index}`}
          style={[
            styles.cosmicRing,
            {
              borderColor: COSMIC_COLORS[index % COSMIC_COLORS.length],
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }],
            },
          ]}
        />
      ))}

      {/* オーラの波動1 - 画面全体を覆う */}
      <Animated.View
        style={[
          styles.auraContainer,
          {
            transform: [
              { rotate: auraRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          },
        ]}
      >
        <Svg width={SCREEN_WIDTH * 2} height={SCREEN_HEIGHT}>
          <Path
            d={createAuraWaves(CENTER_X, CENTER_Y, 180, 9)}
            stroke="#E8B4D8"
            strokeWidth={0.8}
            fill="none"
            opacity={0.3}
          />
          <Path
            d={createAuraWaves(CENTER_X, CENTER_Y, 280, 12)}
            stroke="#9B59B6"
            strokeWidth={0.6}
            fill="none"
            opacity={0.22}
          />
          <Path
            d={createAuraWaves(CENTER_X, CENTER_Y, 400, 15)}
            stroke="#8E44AD"
            strokeWidth={0.5}
            fill="none"
            opacity={0.15}
          />
        </Svg>
      </Animated.View>

      {/* オーラの波動2（逆回転）- 画面全体 */}
      <Animated.View
        style={[
          styles.auraContainer,
          {
            transform: [
              { rotate: auraRotation2.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] }) },
            ],
          },
        ]}
      >
        <Svg width={SCREEN_WIDTH * 2} height={SCREEN_HEIGHT}>
          <Path
            d={createAuraWaves(CENTER_X, CENTER_Y, 150, 7)}
            stroke="#3498DB"
            strokeWidth={0.6}
            fill="none"
            opacity={0.25}
          />
          <Path
            d={createAuraWaves(CENTER_X, CENTER_Y, 320, 11)}
            stroke="#1ABC9C"
            strokeWidth={0.5}
            fill="none"
            opacity={0.18}
          />
        </Svg>
      </Animated.View>

      {/* 蓮の花レイヤー - 全画面 */}
      {lotusRotations.map((rotation, layerIndex) => (
        <Animated.View
          key={`lotus-${layerIndex}`}
          style={[
            styles.lotusContainer,
            {
              transform: [
                { rotate: rotation.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-360deg', '0deg', '360deg'] }) },
                { scale: lotusScales[layerIndex] },
              ],
            },
          ]}
        >
          <Svg width={SCREEN_WIDTH * 2} height={SCREEN_HEIGHT * 1.2}>
            <Path
              d={createLotusPetals(CENTER_X, CENTER_Y, lotusRadii[layerIndex] || 100, lotusPetalCounts[layerIndex] || 8)}
              stroke={COSMIC_COLORS[(layerIndex * 2) % COSMIC_COLORS.length]}
              strokeWidth={0.8}
              fill={LOTUS_COLORS[layerIndex % LOTUS_COLORS.length]}
              fillOpacity={0.15}
              opacity={0.6 - layerIndex * 0.05}
            />
          </Svg>
        </Animated.View>
      ))}

      {/* ボス用爆発エフェクト */}
      {isBoss && explosionAnims.map((anim, index) => (
        <Animated.View
          key={`explosion-${index}`}
          style={[
            styles.explosionRing,
            {
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }],
              borderColor: COSMIC_COLORS[index % COSMIC_COLORS.length],
            },
          ]}
        />
      ))}

      {/* 宇宙の目（中心）- 3つのレイヤー、回転＋脈動 */}
      {eyeAnims.map((anim, index) => {
        // 各レイヤーで少し異なる色
        const colors = [
          { outer: '#E8B4D8', middle: '#DDA0DD', inner: '#9B59B6', core: '#F5E6D3' },
          { outer: '#B0E0E6', middle: '#E6E6FA', inner: '#3498DB', core: '#FFDAB9' },
          { outer: '#1ABC9C', middle: '#2ECC71', inner: '#8E44AD', core: '#F39C12' },
        ];
        const c = colors[index];
        return (
          <Animated.View
            key={`eye-${index}`}
            style={[
              styles.cosmicEye,
              {
                opacity: anim.opacity,
                transform: [
                  { scale: anim.pulse },
                  { rotate: anim.rotation.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-360deg', '0deg', '360deg'] }) },
                ],
              },
            ]}
          >
            <Svg width={100} height={100}>
              <Circle cx={50} cy={50} r={40} stroke={c.outer} strokeWidth={1} fill="none" opacity={0.5} />
              <Circle cx={50} cy={50} r={30} stroke={c.middle} strokeWidth={0.8} fill="none" opacity={0.4} />
              <Path d={createLotusPetals(50, 50, 35, 24)} stroke={c.inner} strokeWidth={0.5} fill="none" opacity={0.5} />
              <Path d={createLotusPetals(50, 50, 22, 16)} stroke={c.middle} strokeWidth={0.4} fill="none" opacity={0.4} />
              <Circle cx={50} cy={50} r={8} stroke={c.core} strokeWidth={0.5} fill="none" opacity={0.4} />
            </Svg>
          </Animated.View>
        );
      })}

      {/* 紙吹雪 */}
      {confettiAnims.map((anim, index) => {
        const data = confettiData[index];
        return (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              styles.confetti,
              {
                left: data.startX,
                width: data.width,
                height: data.height,
                backgroundColor: data.color,
                shadowColor: data.color,
                opacity: anim.opacity,
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { scaleX: anim.scaleX },
                  { rotate: anim.rotateZ.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-360deg', '0deg', '360deg'] }) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    overflow: 'hidden',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
  },
  cosmicRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    top: CENTER_Y - 30,
    left: CENTER_X - 30,
    zIndex: 60,
  },
  auraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 55,
  },
  lotusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 65,
  },
  cosmicEye: {
    position: 'absolute',
    top: CENTER_Y - 50,
    left: CENTER_X - 50,
    zIndex: 80,
  },
  explosionRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    top: CENTER_Y - 25,
    left: CENTER_X - 25,
    zIndex: 90,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    zIndex: 200,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});
