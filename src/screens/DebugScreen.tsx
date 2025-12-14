// デバッグ画面
// 開発用：全ての画面とパターンをテスト可能

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, GAME_CONFIG } from '../types/game';
import { BattleScreen } from './BattleScreen';
import { RewardScreen } from './RewardScreen';
import { startNewRun } from '../store/runStore';
import { getEliteEnemies, getNormalEnemies, getBossForFloor } from '../data/enemies';
import { getRandomCard } from '../data/cards';

type DebugPhase = 'menu' | 'battle' | 'reward' | 'result';

interface DebugScreenProps {
  onExit: () => void;
}

// デバッグ用のバトル設定
interface BattleConfig {
  type: 'normal' | 'elite' | 'boss';
  floor: number;
  enemyCount: number;
}

// デバッグ用のプレイヤー状態
interface PlayerConfig {
  hp: number;
  maxHp: number;
  gold: number;
  stockCount: number;  // 0-5
}

// デバッグ用の報酬設定
interface RewardConfig {
  type: 'normal' | 'elite' | 'boss';
  floor: number;
}

// バトル結果
interface BattleResult {
  victory: boolean;
  enemiesDefeated: number;
}

export const DebugScreen: React.FC<DebugScreenProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<DebugPhase>('menu');
  const [runState, setRunState] = useState<RunState | null>(null);
  const [battleConfig, setBattleConfig] = useState<BattleConfig>({
    type: 'normal',
    floor: 1,
    enemyCount: 1,
  });
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>({
    hp: GAME_CONFIG.STARTING_HP,
    maxHp: GAME_CONFIG.STARTING_HP,
    gold: 100,
    stockCount: 0,
  });
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>({
    type: 'normal',
    floor: 5,
  });
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  // デバッグ用RunState生成
  const createDebugRunState = async (
    floor: number,
    stockCount: number = 0,
    hp?: number,
    gold?: number
  ): Promise<RunState> => {
    const baseRun = await startNewRun();

    // ストックカードを生成
    const stockCards: Card[] = [];
    for (let i = 0; i < stockCount; i++) {
      stockCards.push(getRandomCard());
    }

    return {
      ...baseRun,
      floor,
      hp: hp ?? playerConfig.hp,
      maxHp: playerConfig.maxHp,
      gold: gold ?? playerConfig.gold,
      stockCards,
    };
  };

  // バトルテスト開始
  const startBattleTest = async (type: 'normal' | 'elite' | 'boss', floor: number, enemyCount: number) => {
    const config = { type, floor, enemyCount };
    setBattleConfig(config);

    const run = await createDebugRunState(floor, playerConfig.stockCount);

    // ノードタイプに合わせたノードを設定
    const nodeType = type === 'boss' ? 'boss' : type === 'elite' ? 'elite' : 'battle';
    const node = run.map.find(n => n.type === nodeType) || run.map[0];
    run.currentNodeId = node.id;

    setRunState(run);
    setPhase('battle');
  };

  // 報酬画面テスト
  const startRewardTest = async (type: 'normal' | 'elite' | 'boss', stockCount: number) => {
    const floor = type === 'boss' ? rewardConfig.floor : 10;
    setRewardConfig({ type, floor });

    const run = await createDebugRunState(floor, stockCount);
    setRunState(run);
    setPhase('reward');
  };

  // バトル終了ハンドラ
  const handleBattleEnd = async (victory: boolean, updatedRunState: RunState, enemiesDefeated: number = 0) => {
    setBattleResult({ victory, enemiesDefeated });
    setRunState(updatedRunState);
    setPhase('result');
  };

  // カード選択ハンドラ（ダミー）
  const handleSelectCard = async (card: Card) => {
    console.log('Debug: Selected card', card.name);
  };

  const handleSetStockCard = async (card: Card) => {
    console.log('Debug: Set stock card', card.name);
  };

  const handleReplaceStockCard = async (index: number, card: Card) => {
    console.log('Debug: Replace stock card', index, card.name);
  };

  // ボス名を取得
  const getBossName = (floor: number): string => {
    const template = getBossForFloor(floor);
    return template?.name || '不明';
  };

  // メニュー画面
  if (phase === 'menu') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onExit} style={styles.backButton}>
              <Text style={styles.backText}>← タイトルへ</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🛠️ デバッグモード</Text>
            <Text style={styles.subtitle}>全シナリオテスト用</Text>
          </View>

          {/* プレイヤー状態設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 プレイヤー状態</Text>

            <Text style={styles.label}>HP: {playerConfig.hp} / {playerConfig.maxHp}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, playerConfig.hp === 10 && styles.selectedButton]}
                onPress={() => setPlayerConfig(p => ({ ...p, hp: 10 }))}
              >
                <Text style={styles.buttonText}>瀕死(10)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, playerConfig.hp === 35 && styles.selectedButton]}
                onPress={() => setPlayerConfig(p => ({ ...p, hp: 35 }))}
              >
                <Text style={styles.buttonText}>半分(35)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, playerConfig.hp === 70 && styles.selectedButton]}
                onPress={() => setPlayerConfig(p => ({ ...p, hp: 70 }))}
              >
                <Text style={styles.buttonText}>満タン(70)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>ストックカード: {playerConfig.stockCount}/5</Text>
            <View style={styles.buttonRow}>
              {[0, 1, 2, 3, 4, 5].map(count => (
                <TouchableOpacity
                  key={count}
                  style={[styles.tinyButton, playerConfig.stockCount === count && styles.selectedButton]}
                  onPress={() => setPlayerConfig(p => ({ ...p, stockCount: count }))}
                >
                  <Text style={styles.buttonText}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 通常バトルテスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚔️ 通常バトル</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity style={styles.button} onPress={() => startBattleTest('normal', 1, 1)}>
                <Text style={styles.buttonText}>1階 敵1体</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => startBattleTest('normal', 10, 2)}>
                <Text style={styles.buttonText}>10階 敵2体</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => startBattleTest('normal', 25, 3)}>
                <Text style={styles.buttonText}>25階 敵3体</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => startBattleTest('normal', 45, 3)}>
                <Text style={styles.buttonText}>45階 敵3体</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* エリートバトルテスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ エリートバトル</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity style={[styles.button, styles.eliteButton]} onPress={() => startBattleTest('elite', 5, 1)}>
                <Text style={styles.buttonText}>エリート1体</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.eliteButton]} onPress={() => startBattleTest('elite', 20, 2)}>
                <Text style={styles.buttonText}>エリート2体</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ボスバトルテスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 ボスバトル</Text>
            <View style={styles.buttonGrid}>
              {GAME_CONFIG.BOSS_FLOORS.map(floor => (
                <TouchableOpacity
                  key={floor}
                  style={[styles.button, styles.bossButton]}
                  onPress={() => startBattleTest('boss', floor, 1)}
                >
                  <Text style={styles.buttonText}>{floor}階</Text>
                  <Text style={styles.bossName}>{getBossName(floor)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 報酬画面テスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 報酬画面テスト</Text>

            <Text style={styles.subTitle}>通常報酬</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => startRewardTest('normal', 0)}>
                <Text style={styles.buttonText}>ストック空</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => startRewardTest('normal', 3)}>
                <Text style={styles.buttonText}>ストック3枚</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={() => startRewardTest('normal', 5)}>
                <Text style={styles.buttonText}>ストック満杯</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}>ボス報酬（レリック付き）</Text>
            <View style={styles.buttonGrid}>
              {GAME_CONFIG.BOSS_FLOORS.slice(0, 5).map(floor => (
                <TouchableOpacity
                  key={floor}
                  style={[styles.button, styles.bossButton]}
                  onPress={() => {
                    setRewardConfig({ type: 'boss', floor });
                    startRewardTest('boss', playerConfig.stockCount);
                  }}
                >
                  <Text style={styles.buttonText}>{floor}階ボス報酬</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ゲーム設定情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 ゲーム設定</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>最大階層: {GAME_CONFIG.MAX_FLOOR}</Text>
              <Text style={styles.infoText}>初期HP: {GAME_CONFIG.STARTING_HP}</Text>
              <Text style={styles.infoText}>初期エネルギー: {GAME_CONFIG.STARTING_ENERGY}</Text>
              <Text style={styles.infoText}>手札枚数: {GAME_CONFIG.STARTING_HAND_SIZE}</Text>
              <Text style={styles.infoText}>ストック上限: {GAME_CONFIG.MAX_STOCK_CARDS}枚</Text>
            </View>
          </View>

          {/* 敵情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👾 敵情報</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>通常敵 (1-9階): {getNormalEnemies(1).length}種</Text>
              <Text style={styles.infoText}>通常敵 (10-19階): {getNormalEnemies(15).length}種</Text>
              <Text style={styles.infoText}>通常敵 (20-29階): {getNormalEnemies(25).length}種</Text>
              <Text style={styles.infoText}>通常敵 (30-39階): {getNormalEnemies(35).length}種</Text>
              <Text style={styles.infoText}>通常敵 (40-50階): {getNormalEnemies(45).length}種</Text>
              <Text style={styles.infoText}>エリート: {getEliteEnemies().length}種</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // バトル画面
  if (phase === 'battle' && runState) {
    return (
      <BattleScreen
        runState={runState}
        onBattleEnd={handleBattleEnd}
        nodeType={battleConfig.type === 'boss' ? 'boss' : battleConfig.type === 'elite' ? 'elite' : 'battle'}
        enemyCount={battleConfig.enemyCount}
        onDebugExit={() => setPhase('menu')}
      />
    );
  }

  // 結果画面（バトル終了後）
  if (phase === 'result' && battleResult) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={battleResult.victory ? ['#1a2e1a', '#2d4e2d', '#1a2e1a'] : ['#2e1a1a', '#4e2d2d', '#2e1a1a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {battleResult.victory ? '🎉 勝利！' : '💀 敗北...'}
          </Text>
          <Text style={styles.resultInfo}>
            倒した敵: {battleResult.enemiesDefeated}体
          </Text>
          <Text style={styles.resultInfo}>
            設定: {battleConfig.floor}階 / {battleConfig.type === 'boss' ? 'ボス' : battleConfig.type === 'elite' ? 'エリート' : '通常'} / 敵{battleConfig.enemyCount}体
          </Text>

          <View style={styles.resultButtons}>
            {battleResult.victory && (
              <TouchableOpacity
                style={[styles.resultButton, styles.rewardButton]}
                onPress={() => {
                  setRewardConfig({ type: battleConfig.type, floor: battleConfig.floor });
                  setPhase('reward');
                }}
              >
                <Text style={styles.resultButtonText}>🎁 報酬画面へ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.resultButton, styles.menuButton]}
              onPress={() => {
                setBattleResult(null);
                setPhase('menu');
              }}
            >
              <Text style={styles.resultButtonText}>🛠️ デバッグメニューへ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 報酬画面
  if (phase === 'reward' && runState) {
    const isBoss = rewardConfig.type === 'boss';
    const goldReward = isBoss ? 80 : rewardConfig.type === 'elite' ? 40 : 20;

    return (
      <View style={styles.container}>
        {/* デバッグ用戻るボタン */}
        <TouchableOpacity
          style={styles.rewardExitButton}
          onPress={() => setPhase('menu')}
        >
          <Text style={styles.rewardExitText}>← 中断</Text>
        </TouchableOpacity>

        <RewardScreen
          runState={runState}
          goldReward={goldReward}
          isBossReward={isBoss}
          onSelectCard={handleSelectCard}
          onSetStockCard={handleSetStockCard}
          onReplaceStockCard={handleReplaceStockCard}
          onSkip={() => setPhase('menu')}
          onTakeGold={() => console.log('Debug: Gold taken')}
        />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subTitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  tinyButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#4a6a8a',
    borderWidth: 2,
    borderColor: '#6a8aaa',
  },
  eliteButton: {
    backgroundColor: '#6a4a2a',
  },
  bossButton: {
    backgroundColor: '#6a2a4a',
    minWidth: 100,
  },
  warningButton: {
    backgroundColor: '#8a6a2a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bossName: {
    color: '#ffcc88',
    fontSize: 10,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    marginVertical: 1,
  },
  // 結果画面
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultInfo: {
    color: '#ccc',
    fontSize: 16,
    marginVertical: 6,
  },
  resultButtons: {
    marginTop: 40,
    gap: 16,
  },
  resultButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
  },
  rewardButton: {
    backgroundColor: '#2a6a4a',
  },
  menuButton: {
    backgroundColor: '#4a4a6a',
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // 報酬画面の戻るボタン
  rewardExitButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f66',
  },
  rewardExitText: {
    color: '#f88',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
