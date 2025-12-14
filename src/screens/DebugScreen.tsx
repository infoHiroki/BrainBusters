// デバッグ画面
// 開発用：全ての画面とパターンをテスト可能

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, GAME_CONFIG } from '../types/game';
import { BattleScreen } from './BattleScreen';
import { RewardScreen } from './RewardScreen';
import { startNewRun, healPlayer, updateGold } from '../store/runStore';
import { generateEnemyGroup, getBossForFloor, createEnemy, getEliteEnemies, getNormalEnemies } from '../data/enemies';
import { generateRewardCards } from '../data/cards';

type DebugPhase = 'menu' | 'battle' | 'reward' | 'shop' | 'rest' | 'result';

interface DebugScreenProps {
  onExit: () => void;
}

// デバッグ用のバトル設定
interface BattleConfig {
  type: 'normal' | 'elite' | 'boss';
  floor: number;
  enemyCount: number;
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
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  // デバッグ用RunState生成
  const createDebugRunState = async (config: Partial<RunState> = {}): Promise<RunState> => {
    const baseRun = await startNewRun();
    return {
      ...baseRun,
      floor: config.floor ?? battleConfig.floor,
      hp: config.hp ?? baseRun.hp,
      maxHp: config.maxHp ?? baseRun.maxHp,
      gold: config.gold ?? 999,
      ...config,
    };
  };

  // バトルテスト開始
  const startBattleTest = async (type: 'normal' | 'elite' | 'boss', floor: number, enemyCount: number = 1) => {
    const config = { type, floor, enemyCount };
    setBattleConfig(config);

    const run = await createDebugRunState({ floor });

    // currentNodeIdを設定（バトル用）
    const nodeType = type === 'boss' ? 'boss' : type === 'elite' ? 'elite' : 'battle';
    const node = run.map.find(n => n.type === nodeType) || run.map[0];
    run.currentNodeId = node.id;

    setRunState(run);
    setPhase('battle');
  };

  // 報酬画面テスト
  const startRewardTest = async (isBoss: boolean = false) => {
    const run = await createDebugRunState({ floor: isBoss ? 10 : 5 });
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
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🛠️ デバッグモード</Text>
          </View>

          {/* バトルテスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚔️ バトルテスト</Text>

            <Text style={styles.subTitle}>通常戦闘</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startBattleTest('normal', 1, 1)}
              >
                <Text style={styles.buttonText}>1階 敵1体</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startBattleTest('normal', 5, 2)}
              >
                <Text style={styles.buttonText}>5階 敵2体</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startBattleTest('normal', 20, 3)}
              >
                <Text style={styles.buttonText}>20階 敵3体</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startBattleTest('normal', 30, 2)}
              >
                <Text style={styles.buttonText}>30階 敵2体</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startBattleTest('normal', 45, 3)}
              >
                <Text style={styles.buttonText}>45階 敵3体</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}>エリート戦</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.eliteButton]}
                onPress={() => startBattleTest('elite', 3, 1)}
              >
                <Text style={styles.buttonText}>エリート1体</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.eliteButton]}
                onPress={() => startBattleTest('elite', 15, 2)}
              >
                <Text style={styles.buttonText}>エリート2体</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}>ボス戦</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startBattleTest('boss', 5, 1)}
              >
                <Text style={styles.buttonText}>5階ボス</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startBattleTest('boss', 10, 1)}
              >
                <Text style={styles.buttonText}>10階ボス</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startBattleTest('boss', 25, 1)}
              >
                <Text style={styles.buttonText}>25階ボス</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startBattleTest('boss', 40, 1)}
              >
                <Text style={styles.buttonText}>40階ボス</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startBattleTest('boss', 50, 1)}
              >
                <Text style={styles.buttonText}>50階ボス</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 報酬画面テスト */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 報酬画面テスト</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => startRewardTest(false)}
              >
                <Text style={styles.buttonText}>通常報酬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.bossButton]}
                onPress={() => startRewardTest(true)}
              >
                <Text style={styles.buttonText}>ボス報酬</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ゲーム設定情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 ゲーム設定</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>最大階層: {GAME_CONFIG.MAX_FLOOR}</Text>
              <Text style={styles.infoText}>ボス階: {GAME_CONFIG.BOSS_FLOORS.join(', ')}</Text>
              <Text style={styles.infoText}>初期HP: {GAME_CONFIG.STARTING_HP}</Text>
              <Text style={styles.infoText}>初期エネルギー: {GAME_CONFIG.STARTING_ENERGY}</Text>
              <Text style={styles.infoText}>手札枚数: {GAME_CONFIG.STARTING_HAND_SIZE}</Text>
              <Text style={styles.infoText}>初期デッキ: {GAME_CONFIG.STARTING_DECK_SIZE}枚</Text>
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
            設定: {battleConfig.floor}階 / {battleConfig.type === 'boss' ? 'ボス' : battleConfig.type === 'elite' ? 'エリート' : '通常'}
          </Text>

          <View style={styles.resultButtons}>
            {battleResult.victory && (
              <TouchableOpacity
                style={[styles.resultButton, styles.rewardButton]}
                onPress={() => setPhase('reward')}
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
    return (
      <RewardScreen
        runState={runState}
        goldReward={50}
        isBossReward={battleConfig.type === 'boss'}
        onSelectCard={handleSelectCard}
        onSetStockCard={handleSetStockCard}
        onReplaceStockCard={handleReplaceStockCard}
        onSkip={() => setPhase('menu')}
        onTakeGold={() => console.log('Debug: Gold taken')}
      />
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subTitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  eliteButton: {
    backgroundColor: '#6a4a2a',
  },
  bossButton: {
    backgroundColor: '#6a2a4a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    marginVertical: 2,
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
    fontSize: 18,
    marginVertical: 8,
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
});
