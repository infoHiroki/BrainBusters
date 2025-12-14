# Phase 6: バトル演出 - 調査・設計ドキュメント

## 概要

Phase 6では以下のバトル演出を実装する:
1. ダメージ演出の強化（50↑火花、100↑爆発+シェイク）
2. 敵撃破時のエフェクト
3. ボス戦勝利時の演出
4. 報酬画面の演出

---

## 現在の技術スタック

### package.json の依存関係
```json
{
  "expo": "~54.0.25",
  "react-native": "0.81.5",
  "expo-linear-gradient": "~15.0.7",
  "expo-av": "~16.0.8"
}
```

**重要**: `react-native-reanimated` は未インストール。React Native 標準の `Animated` API を使用。

---

## 既存アニメーションパターン

### 1. FloatingDamage（BattleScreen.tsx:51-146）
フローティングダメージ表示用コンポーネント

```typescript
// 使用中のAnimated.Value
const opacity = useRef(new Animated.Value(1)).current;
const translateY = useRef(new Animated.Value(0)).current;
const scale = useRef(new Animated.Value(0.3)).current;
const rotate = useRef(new Animated.Value(0)).current;

// アニメーション構成
Animated.parallel([
  // フェードアウト（長めに表示）
  Animated.sequence([
    Animated.delay(1500),
    Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
  ]),
  // 上に浮かぶ
  Animated.timing(translateY, { toValue: -60, duration: 2500, useNativeDriver: true }),
  // ポップアニメーション（大きく飛び出す）
  Animated.sequence([
    Animated.spring(scale, { toValue: 1.5, friction: 3, tension: 200, useNativeDriver: true }),
    Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
  ]),
  // 微妙な揺れ
  Animated.sequence([
    Animated.timing(rotate, { toValue: 1, duration: 100, useNativeDriver: true }),
    Animated.timing(rotate, { toValue: -1, duration: 100, useNativeDriver: true }),
    Animated.timing(rotate, { toValue: 0, duration: 100, useNativeDriver: true }),
  ]),
])
```

**色の種類**:
- `damage`: #ff3333 (赤)
- `block`: #33aaff (青)
- `heal`: #33ff33 (緑)
- `buff`: #ffaa00 (オレンジ)
- `debuff`: #aa44ff (紫)
- `draw`: #44dd88 (緑)
- `energy`: #ffcc00 (黄)

### 2. 敵シェイクアニメーション（EnemyDisplay.tsx:124-146）

```typescript
// shakeAnimを受け取り、ダメージ時に揺れる
<Animated.View
  style={{
    transform: [
      {
        translateX: shakeAnim.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, -5, 5, -5, 0],
        }),
      },
    ],
  }}
>
```

**BattleScreen側での制御**:
```typescript
Animated.sequence([
  Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
  Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
  Animated.timing(shakeAnims[i], { toValue: 1, duration: 80, useNativeDriver: true }),
  Animated.timing(shakeAnims[i], { toValue: 0, duration: 80, useNativeDriver: true }),
]).start();
```

### 3. ComboDisplay（ComboDisplay.tsx）
コンボ発動時のオーバーレイ表示

**アニメーション種類**:
- `fade`: フェードイン/アウト
- `scale`: スケールアニメーション（spring使用）
- `shake`: 画面揺れ（translateX）
- `glow`: 画面グロー効果（opacity loop）
- `lightning`: 稲妻フラッシュ

```typescript
// 画面シェイク
if (combo.screenEffect === 'shake') {
  effectAnimation = Animated.sequence([
    ...Array(5).fill(null).map(() =>
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
      ])
    ),
    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
}

// グロー効果
if (combo.screenEffect === 'glow' || combo.screenEffect === 'sparkle') {
  effectAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]),
    { iterations: 2 }
  );
}

// 稲妻
if (combo.screenEffect === 'lightning') {
  effectAnimation = Animated.sequence([
    Animated.timing(glowAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    Animated.timing(glowAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    Animated.timing(glowAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
  ]);
}
```

### 4. RewardScreen パーティクル（RewardScreen.tsx:64-118）
ボス撃破時のパーティクルアニメーション

```typescript
const particleCount = 30;
const particles = useRef(
  Array.from({ length: particleCount }, () => ({
    x: new Animated.Value(screenWidth / 2),
    y: new Animated.Value(screenHeight / 2),
    opacity: new Animated.Value(1),
    scale: new Animated.Value(0),
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4'][...],
    emoji: ['✨', '⭐', '🌟', '💫', '🎉', '🏆'][...],
  }))
).current;

// 放射状に広がるアニメーション
Animated.sequence([
  Animated.delay(index * 30),
  Animated.parallel([
    Animated.timing(particle.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    Animated.timing(particle.x, { toValue: targetX, duration: 1500, useNativeDriver: true }),
    Animated.timing(particle.y, { toValue: targetY + 200, duration: 1500, useNativeDriver: true }),
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(particle.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]),
  ]),
]).start();
```

### 5. サウンドシステム（sound.ts）

**利用可能な効果音**:
```typescript
type SoundType =
  | 'attack'      // 攻撃
  | 'block'       // ブロック
  | 'heal'        // 回復
  | 'damage'      // ダメージを受けた
  | 'victory'     // 勝利
  | 'defeat'      // 敗北
  | 'cardPlay'    // カード使用
  | 'button'      // ボタン押下
  | 'levelUp'     // レベルアップ/ボス撃破
  | 'reward';     // 報酬獲得
```

---

## React Native Animated API リファレンス

### 基本メソッド

```typescript
// タイミングアニメーション
Animated.timing(value, {
  toValue: number,
  duration: number,
  useNativeDriver: boolean,
  easing?: EasingFunction,
}).start(callback);

// スプリングアニメーション
Animated.spring(value, {
  toValue: number,
  friction: number,     // 摩擦（デフォルト7）
  tension: number,      // 張力（デフォルト40）
  useNativeDriver: boolean,
}).start(callback);

// 組み合わせ
Animated.parallel([...animations]);   // 同時実行
Animated.sequence([...animations]);   // 順次実行
Animated.loop(animation, { iterations: number });  // ループ
Animated.delay(ms);                   // 遅延
```

### interpolate（値の変換）

```typescript
animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],  // 角度
  // または
  outputRange: [0, 100],            // 数値
  // または
  outputRange: ['#ff0000', '#00ff00'],  // 色（useNativeDriver: falseが必要）
});
```

---

## Phase 6 実装設計

### 1. ダメージ演出の強化

#### 1.1 火花エフェクト（50ダメージ以上）

```typescript
// SparkEffect コンポーネント
interface Spark {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

// 8方向に火花を飛ばす
const createSparks = (damage: number, centerX: number, centerY: number) => {
  const sparkCount = Math.min(Math.floor(damage / 10), 12);
  const sparks: Spark[] = [];

  for (let i = 0; i < sparkCount; i++) {
    const angle = (i / sparkCount) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;

    sparks.push({
      id: `spark-${i}`,
      x: new Animated.Value(centerX),
      y: new Animated.Value(centerY),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0),
    });

    // アニメーション
    Animated.parallel([
      Animated.timing(spark.x, {
        toValue: centerX + Math.cos(angle) * distance,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(spark.y, {
        toValue: centerY + Math.sin(angle) * distance,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(spark.scale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(spark.scale, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(spark.opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }
};
```

**表示**: `💥` または `✨` 絵文字を使用

#### 1.2 爆発エフェクト（100ダメージ以上）

```typescript
// ExplosionEffect コンポーネント
// 画面中央に大きな爆発 + 画面シェイク

const createExplosion = (damage: number) => {
  // 爆発アニメーション
  const explosionScale = new Animated.Value(0);
  const explosionOpacity = new Animated.Value(1);

  Animated.parallel([
    // 急速に拡大
    Animated.spring(explosionScale, {
      toValue: 2,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }),
    // フェードアウト
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(explosionOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]),
  ]).start();

  // 画面シェイク（強め）
  const shakeIntensity = Math.min(damage / 20, 15);
  triggerScreenShake(shakeIntensity, 400);
};
```

**表示**: `💥🔥` 重ね合わせ、または専用の爆発アニメーション

### 2. 敵撃破時のエフェクト

```typescript
// EnemyDefeatEffect コンポーネント
const triggerDefeatEffect = (enemyPosition: { x: number; y: number }) => {
  // 1. 敵が崩れるアニメーション
  const collapseScale = new Animated.Value(1);
  const collapseRotate = new Animated.Value(0);
  const collapseOpacity = new Animated.Value(1);

  Animated.parallel([
    // 縮小
    Animated.timing(collapseScale, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }),
    // 回転
    Animated.timing(collapseRotate, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }),
    // フェード
    Animated.timing(collapseOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }),
  ]).start();

  // 2. パーティクル散乱
  createDefeatParticles(enemyPosition, 15);

  // 3. 効果音
  playSound('victory');  // または新規 'defeat_enemy' サウンド
};
```

**表示案**:
- 通常敵: 小さめのパーティクル（8個）+ 縮小フェード
- エリート: 中程度のパーティクル（12個）+ 金の光
- ボス: 大きなパーティクル（20個）+ 画面フラッシュ + シェイク

### 3. ボス戦勝利時の演出

```typescript
// BossVictoryEffect コンポーネント
const triggerBossVictory = () => {
  // 1. 画面フラッシュ（白）
  const flashOpacity = new Animated.Value(0);
  Animated.sequence([
    Animated.timing(flashOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
  ]).start();

  // 2. 「BOSS DEFEATED!」テキストアニメーション
  const textScale = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  Animated.sequence([
    Animated.delay(200),
    Animated.parallel([
      Animated.spring(textScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]),
    Animated.delay(1500),
    Animated.timing(textOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
  ]).start();

  // 3. パーティクル爆発（大量）
  createVictoryParticles(40);

  // 4. 勝利ファンファーレ
  playVictoryFanfare();
};
```

### 4. 報酬画面の演出強化

**現状**: ボス撃破時パーティクル実装済み

**追加案**:
```typescript
// カード選択時のキラキラエフェクト
const cardSelectEffect = (cardPosition: { x: number; y: number }) => {
  // カードの周りに光のパーティクルを配置
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
    angle: (i / 6) * Math.PI * 2,
  }));

  // ループアニメーション
  Animated.loop(
    Animated.stagger(100, sparkles.map(s =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(s.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(s.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(s.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(s.scale, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ])
    )),
    { iterations: -1 }
  ).start();
};
```

---

## ファイル構成案

```
src/
├── components/
│   ├── effects/
│   │   ├── SparkEffect.tsx      # 火花エフェクト
│   │   ├── ExplosionEffect.tsx  # 爆発エフェクト
│   │   ├── DefeatEffect.tsx     # 敵撃破エフェクト
│   │   └── VictoryEffect.tsx    # 勝利演出
│   └── ...
├── utils/
│   └── effects.ts               # エフェクト生成ユーティリティ
└── ...
```

---

## 実装優先順位

1. **ダメージエフェクト強化** (高優先)
   - 火花エフェクト（50+ダメージ）
   - 爆発+シェイク（100+ダメージ）

2. **敵撃破エフェクト** (中優先)
   - 通常敵の撃破
   - エリート/ボスの特別演出

3. **ボス勝利演出** (中優先)
   - 画面フラッシュ
   - 「BOSS DEFEATED!」表示
   - パーティクル強化

4. **報酬画面演出** (低優先)
   - カード選択時のエフェクト
   - レリック獲得時の演出

---

## 注意事項

- `useNativeDriver: true` を常に使用（パフォーマンス）
- 色アニメーションは `useNativeDriver: false` が必要
- パーティクル数は端末性能を考慮して上限設定
- 効果音と視覚エフェクトのタイミング同期が重要
