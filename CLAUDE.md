# BrainBusters - Claude Code 開発ガイド

## プロジェクト概要

BrainBustersは、哲学的概念をカードとして使う「Slay the Spire」風のローグライクカードゲームです。

**技術スタック**: React Native / Expo / TypeScript

## ディレクトリ構造

```
BrainBusters/
├── src/
│   ├── screens/       # 画面コンポーネント
│   ├── components/    # 共有コンポーネント
│   ├── data/          # カード・敵・レリックのデータ
│   ├── store/         # 状態管理（AsyncStorage）
│   ├── types/         # TypeScript型定義
│   └── __tests__/     # ユニットテスト
├── docs/              # ドキュメント
├── temp/              # 一時ファイル・現在のタスク
├── archive/           # 不要ファイルの保管
└── assets/            # 画像・フォント
```

## 主要ファイル

| ファイル | 説明 |
|---------|------|
| `src/types/game.ts` | ゲームの型定義（Card, Enemy, RunState等） |
| `src/data/cards.ts` | カード生成ロジック |
| `src/data/enemies.ts` | 敵生成ロジック |
| `src/data/concepts.json` | 500の哲学的概念データ |
| `src/store/runStore.ts` | ランの状態管理・永続化 |
| `src/screens/BattleScreen.tsx` | バトル画面 |
| `src/screens/RunScreen.tsx` | マップ・ラン進行画面 |

## 開発コマンド

```bash
# 開発サーバー起動
npx expo start

# テスト実行
npm test

# iOS シミュレータ
npx expo start --ios

# Android エミュレータ
npx expo start --android
```

## ゲームシステム

### 基本ルール
- 50階層のダンジョンを攻略
- 毎ターン7エネルギー、カード6枚ドロー
- 敵を倒してカードを獲得しデッキを強化
- 5階ごとにボス戦（全10体）

### カードタイプ
- `attack`: 攻撃カード（ダメージを与える）
- `defense`: 防御カード（ブロックを得る）
- `special`: 特殊カード（バフ・デバフ等）

### 状態管理
- `RunState`: 現在のランの状態（HP, デッキ, 階層等）
- AsyncStorageで永続化
- `runStore.ts`の関数で状態更新

## コーディング規約

- TypeScript strict mode
- 日本語コメント推奨
- テストは`src/__tests__/`に配置
- Atomic commit推奨

## 注意事項

- `concepts.json`は500件の概念データ、手動編集注意
- `GAME_CONFIG`定数でゲームバランスを調整
- ボス階層: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50階
