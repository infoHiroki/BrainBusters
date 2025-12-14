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
import { startNewRun, saveRunState } from '../store/runStore';
import { getEliteEnemies, getNormalEnemies, getBossForFloor } from '../data/enemies';
import { getRandomCard } from '../data/cards';

type DebugPhase = 'menu' | 'battle' | 'reward' | 'result';
type TestMode = 'battle' | 'reward';

interface DebugScreenProps {
  onExit: () => void;
}

// バトル結果
interface BattleResult {
  victory: boolean;
  enemiesDefeated: number;
}

// テストプリセット
interface TestPreset {
  id: number;
  name: string;
  category: 'battle' | 'reward' | 'ui' | 'flow';
  testMode: TestMode;
  nodeType: 'battle' | 'elite' | 'boss';
  floor: number;
  enemyCount: number;
  hp: number;
  stockCount: number;
  description: string;
}

// プリセットシナリオ一覧
const TEST_PRESETS: TestPreset[] = [
  // バトルテスト
  { id: 1, name: '通常バトル基本', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '1階/敵1体/HP満タン/ストック0' },
  { id: 2, name: '通常バトル敵3体', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 25, enemyCount: 3, hp: 70, stockCount: 0, description: '25階/敵3体/HP満タン/ストック0' },
  { id: 3, name: '高難度+ストック満杯', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 45, enemyCount: 3, hp: 10, stockCount: 5, description: '45階/敵3体/HP瀕死/ストック5' },
  { id: 4, name: 'エリート2体', category: 'battle', testMode: 'battle', nodeType: 'elite', floor: 20, enemyCount: 2, hp: 35, stockCount: 3, description: '20階/敵2体/HP半分/ストック3' },
  { id: 5, name: '序盤ボス', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 5, enemyCount: 1, hp: 70, stockCount: 0, description: '5階ボス/HP満タン/ストック0' },
  { id: 6, name: '中盤ボス', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 25, enemyCount: 1, hp: 35, stockCount: 3, description: '25階ボス/HP半分/ストック3' },
  { id: 7, name: '最終ボス極限', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 50, enemyCount: 1, hp: 10, stockCount: 5, description: '50階ボス/HP瀕死/ストック5' },
  // 報酬画面テスト
  { id: 8, name: 'ストック空→追加', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 0, description: '通常報酬/ストック0' },
  { id: 9, name: 'ストック一部→追加', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 3, description: '通常報酬/ストック3' },
  { id: 10, name: 'ストック満杯→入替', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 5, description: '通常報酬/ストック5' },
  { id: 11, name: 'エリート報酬+満杯', category: 'reward', testMode: 'reward', nodeType: 'elite', floor: 15, enemyCount: 1, hp: 70, stockCount: 5, description: 'エリート報酬/ストック5' },
  { id: 12, name: 'ボス報酬+レリック', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 5, enemyCount: 1, hp: 70, stockCount: 0, description: '5階ボス報酬/ストック0' },
  { id: 13, name: 'ボス報酬複合', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 25, enemyCount: 1, hp: 70, stockCount: 5, description: '25階ボス報酬/ストック5' },
  { id: 14, name: '最終ボス報酬', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 50, enemyCount: 1, hp: 70, stockCount: 0, description: '50階ボス報酬' },
];

export const DebugScreen: React.FC<DebugScreenProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<DebugPhase>('menu');
  const [runState, setRunState] = useState<RunState | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showPresets, setShowPresets] = useState<boolean>(true);

  // === 設定項目 ===
  const [testMode, setTestMode] = useState<TestMode>('battle');

  // 共通設定
  const [floor, setFloor] = useState<number>(1);
  const [nodeType, setNodeType] = useState<'battle' | 'elite' | 'boss'>('battle');
  const [hp, setHp] = useState<number>(GAME_CONFIG.STARTING_HP);
  const [stockCount, setStockCount] = useState<number>(0);

  // バトル専用設定
  const [enemyCount, setEnemyCount] = useState<number>(1);

  // プリセットを適用
  const applyPreset = (preset: TestPreset) => {
    setTestMode(preset.testMode);
    setNodeType(preset.nodeType);
    setFloor(preset.floor);
    setEnemyCount(preset.enemyCount);
    setHp(preset.hp);
    setStockCount(preset.stockCount);
  };

  // ボス名を取得
  const getBossName = (bossFloor: number): string => {
    const template = getBossForFloor(bossFloor);
    return template?.name || '不明';
  };

  // デバッグ用RunState生成
  const createDebugRunState = async (): Promise<RunState> => {
    const baseRun = await startNewRun();

    // ストックカードを生成
    const stockCards: Card[] = [];
    for (let i = 0; i < stockCount; i++) {
      stockCards.push(getRandomCard());
    }

    // ノードタイプに合わせたマップを作成
    const nodeId = `debug-${nodeType}-${floor}`;
    const node = {
      id: nodeId,
      floor: floor,
      type: nodeType === 'battle' ? 'battle' : nodeType === 'elite' ? 'elite' : 'boss',
      x: 0,
      connections: [],
      completed: false,
    };

    const debugRunState: RunState = {
      ...baseRun,
      floor,
      hp,
      maxHp: GAME_CONFIG.STARTING_HP,
      gold: 100,
      stockCards,
      map: [node as any],
      currentNodeId: nodeId,
    };

    // デバッグ用RunStateをストレージに保存（useStockCard等が正しく動作するように）
    await saveRunState(debugRunState);

    return debugRunState;
  };

  // テスト開始
  const startTest = async () => {
    const run = await createDebugRunState();
    setRunState(run);

    if (testMode === 'battle') {
      setPhase('battle');
    } else {
      setPhase('reward');
    }
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

  // 階層選択肢（ボスタイプ時はボス階層のみ）
  const floorOptions = nodeType === 'boss'
    ? GAME_CONFIG.BOSS_FLOORS
    : [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  // 敵数の上限（ノードタイプによって変わる）
  const getMaxEnemyCount = () => {
    if (nodeType === 'boss') return 1;
    if (nodeType === 'elite') return 2;
    return 3;
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
            <Text style={styles.subtitle}>プリセットから選択 or カスタム設定</Text>
          </View>

          {/* プリセット選択 */}
          <View style={styles.presetSection}>
            <TouchableOpacity
              style={styles.presetHeader}
              onPress={() => setShowPresets(!showPresets)}
            >
              <Text style={styles.presetTitle}>📋 テストプリセット（{TEST_PRESETS.length}件）</Text>
              <Text style={styles.presetToggle}>{showPresets ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {showPresets && (
              <View style={styles.presetList}>
                {/* バトルテスト */}
                <Text style={styles.presetCategory}>⚔️ バトルテスト</Text>
                {TEST_PRESETS.filter(p => p.category === 'battle').map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetItem}
                    onPress={() => applyPreset(preset)}
                  >
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.id}. {preset.name}</Text>
                      <Text style={styles.presetDesc}>{preset.description}</Text>
                    </View>
                    <Text style={styles.presetArrow}>→</Text>
                  </TouchableOpacity>
                ))}

                {/* 報酬画面テスト */}
                <Text style={styles.presetCategory}>🎁 報酬画面テスト</Text>
                {TEST_PRESETS.filter(p => p.category === 'reward').map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetItem}
                    onPress={() => applyPreset(preset)}
                  >
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.id}. {preset.name}</Text>
                      <Text style={styles.presetDesc}>{preset.description}</Text>
                    </View>
                    <Text style={styles.presetArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* カスタム設定セクション */}
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>⚙️ カスタム設定</Text>
          </View>

          {/* テストモード選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 テストモード</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modeButton, testMode === 'battle' && styles.selectedMode]}
                onPress={() => setTestMode('battle')}
              >
                <Text style={styles.modeButtonText}>⚔️ バトル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, testMode === 'reward' && styles.selectedMode]}
                onPress={() => setTestMode('reward')}
              >
                <Text style={styles.modeButtonText}>🎁 報酬画面</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ノードタイプ選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 ノードタイプ</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.typeButton, nodeType === 'battle' && styles.selectedType]}
                onPress={() => {
                  setNodeType('battle');
                  if (enemyCount > 3) setEnemyCount(3);
                }}
              >
                <Text style={styles.typeButtonText}>通常</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, styles.eliteType, nodeType === 'elite' && styles.selectedType]}
                onPress={() => {
                  setNodeType('elite');
                  if (enemyCount > 2) setEnemyCount(2);
                }}
              >
                <Text style={styles.typeButtonText}>エリート</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, styles.bossType, nodeType === 'boss' && styles.selectedType]}
                onPress={() => {
                  setNodeType('boss');
                  setEnemyCount(1);
                  // 現在の階層がボス階層でない場合、最初のボス階層に変更
                  if (!(GAME_CONFIG.BOSS_FLOORS as readonly number[]).includes(floor)) {
                    setFloor(5);
                  }
                }}
              >
                <Text style={styles.typeButtonText}>ボス</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 階層選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏔️ 階層: {floor}階
              {nodeType === 'boss' && ` (${getBossName(floor)})`}
            </Text>
            <View style={styles.buttonGrid}>
              {floorOptions.map(f => {
                const isBossFloor = (GAME_CONFIG.BOSS_FLOORS as readonly number[]).includes(f);
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.floorButton,
                      floor === f && styles.selectedFloor,
                      isBossFloor && styles.bossFloorButton,
                    ]}
                    onPress={() => setFloor(f)}
                  >
                    <Text style={styles.floorButtonText}>{f}</Text>
                    {nodeType === 'boss' && isBossFloor && (
                      <Text style={styles.bossNameSmall}>{getBossName(f)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* バトル専用: 敵数選択 */}
          {testMode === 'battle' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👾 敵の数: {enemyCount}体</Text>
              <View style={styles.buttonRow}>
                {[1, 2, 3].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      enemyCount === count && styles.selectedCount,
                      count > getMaxEnemyCount() && styles.disabledButton,
                    ]}
                    onPress={() => {
                      if (count <= getMaxEnemyCount()) {
                        setEnemyCount(count);
                      }
                    }}
                    disabled={count > getMaxEnemyCount()}
                  >
                    <Text style={[
                      styles.countButtonText,
                      count > getMaxEnemyCount() && styles.disabledText,
                    ]}>
                      {count}体
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {nodeType === 'boss' && (
                <Text style={styles.noteText}>※ボスは常に1体です</Text>
              )}
              {nodeType === 'elite' && (
                <Text style={styles.noteText}>※エリートは最大2体です</Text>
              )}
            </View>
          )}

          {/* プレイヤー状態 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 プレイヤー状態</Text>

            <Text style={styles.label}>HP: {hp} / {GAME_CONFIG.STARTING_HP}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, hp === 10 && styles.selectedButton]}
                onPress={() => setHp(10)}
              >
                <Text style={styles.buttonText}>瀕死(10)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, hp === 35 && styles.selectedButton]}
                onPress={() => setHp(35)}
              >
                <Text style={styles.buttonText}>半分(35)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, hp === GAME_CONFIG.STARTING_HP && styles.selectedButton]}
                onPress={() => setHp(GAME_CONFIG.STARTING_HP)}
              >
                <Text style={styles.buttonText}>満タン({GAME_CONFIG.STARTING_HP})</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>ストックカード: {stockCount}/5</Text>
            <View style={styles.buttonRow}>
              {[0, 1, 2, 3, 4, 5].map(count => (
                <TouchableOpacity
                  key={count}
                  style={[styles.tinyButton, stockCount === count && styles.selectedButton]}
                  onPress={() => setStockCount(count)}
                >
                  <Text style={styles.buttonText}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 現在の設定サマリー */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>📋 テスト設定</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                モード: {testMode === 'battle' ? '⚔️ バトル' : '🎁 報酬画面'}
              </Text>
              <Text style={styles.summaryText}>
                タイプ: {nodeType === 'boss' ? '👑 ボス' : nodeType === 'elite' ? '⭐ エリート' : '通常'}
              </Text>
              <Text style={styles.summaryText}>
                階層: {floor}階
                {nodeType === 'boss' && ` → ${getBossName(floor)}`}
              </Text>
              {testMode === 'battle' && (
                <Text style={styles.summaryText}>敵数: {enemyCount}体</Text>
              )}
              <Text style={styles.summaryText}>HP: {hp}/{GAME_CONFIG.STARTING_HP}</Text>
              <Text style={styles.summaryText}>
                ストック: {stockCount}枚
                {stockCount === 5 && ' (満杯)'}
                {stockCount === 0 && ' (空)'}
              </Text>
            </View>
          </View>

          {/* テスト開始ボタン */}
          <TouchableOpacity style={styles.startButton} onPress={startTest}>
            <Text style={styles.startButtonText}>
              {testMode === 'battle' ? '⚔️ バトル開始' : '🎁 報酬画面を開く'}
            </Text>
          </TouchableOpacity>

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

          {/* ボス一覧 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 ボス一覧</Text>
            <View style={styles.infoBox}>
              {GAME_CONFIG.BOSS_FLOORS.map(bossFloor => (
                <Text key={bossFloor} style={styles.infoText}>
                  {bossFloor}階: {getBossName(bossFloor)}
                </Text>
              ))}
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
        nodeType={nodeType}
        enemyCount={enemyCount}
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
            設定: {floor}階 / {nodeType === 'boss' ? 'ボス' : nodeType === 'elite' ? 'エリート' : '通常'} / 敵{enemyCount}体
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
    const isBoss = nodeType === 'boss';
    const goldReward = isBoss ? 80 : nodeType === 'elite' ? 40 : 20;

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
  // プリセット選択
  presetSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(100, 200, 150, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 200, 150, 0.3)',
    overflow: 'hidden',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(100, 200, 150, 0.15)',
  },
  presetTitle: {
    color: '#8fdfb0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  presetToggle: {
    color: '#8fdfb0',
    fontSize: 14,
  },
  presetList: {
    padding: 8,
  },
  presetCategory: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  presetDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  presetArrow: {
    color: '#6a8',
    fontSize: 18,
    marginLeft: 8,
  },
  // カスタム設定
  customSection: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  customTitle: {
    color: '#aaccff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // テストモードボタン
  modeButton: {
    flex: 1,
    backgroundColor: '#2a3a4a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMode: {
    backgroundColor: '#3a5a7a',
    borderColor: '#5a8aba',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ノードタイプボタン
  typeButton: {
    flex: 1,
    backgroundColor: '#2a4a6a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  eliteType: {
    backgroundColor: '#5a4a2a',
  },
  bossType: {
    backgroundColor: '#5a2a4a',
  },
  selectedType: {
    borderColor: '#fff',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 階層ボタン
  floorButton: {
    backgroundColor: '#2a3a4a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 55,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bossFloorButton: {
    backgroundColor: '#4a2a3a',
  },
  selectedFloor: {
    borderColor: '#fff',
    backgroundColor: '#4a6a8a',
  },
  floorButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bossNameSmall: {
    color: '#ffcc88',
    fontSize: 8,
    marginTop: 2,
  },
  // 敵数ボタン
  countButton: {
    flex: 1,
    backgroundColor: '#2a4a6a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCount: {
    borderColor: '#fff',
    backgroundColor: '#4a6a8a',
  },
  disabledButton: {
    backgroundColor: '#1a1a2a',
    opacity: 0.5,
  },
  countButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  noteText: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  // プレイヤー設定ボタン
  smallButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tinyButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedButton: {
    backgroundColor: '#4a6a8a',
    borderColor: '#6a8aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // サマリーセクション
  summarySection: {
    marginBottom: 16,
    backgroundColor: 'rgba(100, 150, 200, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 150, 200, 0.3)',
  },
  summaryTitle: {
    color: '#aaccff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryBox: {
    gap: 4,
  },
  summaryText: {
    color: '#ddeeff',
    fontSize: 14,
  },
  // 開始ボタン
  startButton: {
    backgroundColor: '#2a8a4a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // 情報ボックス
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
