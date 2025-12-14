// デバッグ画面
// 開発用：全ての画面とパターンをテスト可能

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, GAME_CONFIG } from '../types/game';
import { BattleScreen } from './BattleScreen';
import { RewardScreen } from './RewardScreen';
import { startNewRun, saveRunState } from '../store/runStore';
import { getEliteEnemies, getNormalEnemies, getBossForFloor } from '../data/enemies';
import { getRandomCard } from '../data/cards';
import { DamageEffect, DefeatEffect, PsychedelicEffect } from '../components/effects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 180;

type DebugPhase = 'menu' | 'battle' | 'reward' | 'result' | 'effects';
type TestMode = 'battle' | 'reward' | 'effects';
type EffectType = 'damage' | 'defeat_normal' | 'defeat_elite' | 'defeat_boss' | 'psychedelic_normal' | 'psychedelic_boss';

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
  category: 'battle' | 'reward' | 'effects';
  testMode: TestMode;
  nodeType: 'battle' | 'elite' | 'boss';
  floor: number;
  enemyCount: number;
  hp: number;
  stockCount: number;
  description: string;
  effectType?: EffectType;
}

// プリセットシナリオ一覧
const TEST_PRESETS: TestPreset[] = [
  // バトルテスト
  { id: 1, name: '通常1体', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '1階/敵1体' },
  { id: 2, name: '通常3体', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 25, enemyCount: 3, hp: 70, stockCount: 0, description: '25階/敵3体' },
  { id: 3, name: '高難度', category: 'battle', testMode: 'battle', nodeType: 'battle', floor: 45, enemyCount: 3, hp: 10, stockCount: 5, description: '45階/瀕死' },
  { id: 4, name: 'エリート', category: 'battle', testMode: 'battle', nodeType: 'elite', floor: 20, enemyCount: 2, hp: 35, stockCount: 3, description: '20階/敵2体' },
  { id: 5, name: '序盤ボス', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 5, enemyCount: 1, hp: 70, stockCount: 0, description: '5階ボス' },
  { id: 6, name: '中盤ボス', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 25, enemyCount: 1, hp: 35, stockCount: 3, description: '25階ボス' },
  { id: 7, name: '最終ボス', category: 'battle', testMode: 'battle', nodeType: 'boss', floor: 50, enemyCount: 1, hp: 10, stockCount: 5, description: '50階/瀕死' },
  // 報酬画面テスト
  { id: 8, name: 'ストック空', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 0, description: '通常報酬' },
  { id: 9, name: 'ストック半分', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 3, description: 'ストック3' },
  { id: 10, name: 'ストック満杯', category: 'reward', testMode: 'reward', nodeType: 'battle', floor: 10, enemyCount: 1, hp: 70, stockCount: 5, description: '入替テスト' },
  { id: 11, name: 'エリート報酬', category: 'reward', testMode: 'reward', nodeType: 'elite', floor: 15, enemyCount: 1, hp: 70, stockCount: 5, description: 'ストック満杯' },
  { id: 12, name: 'ボス報酬', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 5, enemyCount: 1, hp: 70, stockCount: 0, description: 'レリック獲得' },
  { id: 13, name: 'ボス+満杯', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 25, enemyCount: 1, hp: 70, stockCount: 5, description: '25階ボス' },
  { id: 14, name: '最終報酬', category: 'reward', testMode: 'reward', nodeType: 'boss', floor: 50, enemyCount: 1, hp: 70, stockCount: 0, description: '50階ボス' },
  // エフェクトテスト
  { id: 15, name: 'ダメージ', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '150ダメージ', effectType: 'damage' },
  { id: 16, name: '撃破:通常', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '通常敵撃破', effectType: 'defeat_normal' },
  { id: 17, name: '撃破:エリート', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'エリート撃破', effectType: 'defeat_elite' },
  { id: 18, name: '撃破:ボス', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'ボス撃破', effectType: 'defeat_boss' },
  { id: 19, name: '報酬:通常', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'サイケデリック', effectType: 'psychedelic_normal' },
  { id: 20, name: '報酬:ボス', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'ボス用演出', effectType: 'psychedelic_boss' },
];

export const DebugScreen: React.FC<DebugScreenProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<DebugPhase>('menu');
  const [runState, setRunState] = useState<RunState | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);

  // === 設定項目 ===
  const [testMode, setTestMode] = useState<TestMode>('battle');

  // エフェクトテスト用
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType>('damage');
  const [showingEffect, setShowingEffect] = useState<boolean>(false);
  const [effectKey, setEffectKey] = useState<number>(0);

  // 共通設定
  const [floor, setFloor] = useState<number>(1);
  const [nodeType, setNodeType] = useState<'battle' | 'elite' | 'boss'>('battle');
  const [hp, setHp] = useState<number>(GAME_CONFIG.STARTING_HP);
  const [stockCount, setStockCount] = useState<number>(0);

  // バトル専用設定
  const [enemyCount, setEnemyCount] = useState<number>(1);

  // プリセットを適用
  const applyPreset = (preset: TestPreset) => {
    setSelectedPresetId(preset.id);
    setTestMode(preset.testMode);
    if (preset.effectType) {
      setSelectedEffectType(preset.effectType);
      // エフェクトプリセットを選んだら即座に再生
      setShowingEffect(false);
      setTimeout(() => {
        setEffectKey(prev => prev + 1);
        setShowingEffect(true);
      }, 50);
    }
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
    if (testMode === 'effects') {
      // エフェクトはインラインで再生
      setShowingEffect(false);
      setTimeout(() => {
        setEffectKey(prev => prev + 1);
        setShowingEffect(true);
      }, 50);
      return;
    }

    const run = await createDebugRunState();
    setRunState(run);

    if (testMode === 'battle') {
      setPhase('battle');
    } else {
      setPhase('reward');
    }
  };

  // リプレイ（同じ設定で再実行）
  const replayTest = async () => {
    setBattleResult(null);
    await startTest();
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

        <View style={styles.layout}>
          {/* サイドバー（プリセット一覧） */}
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>📋 プリセット</Text>
            </View>

            <ScrollView style={styles.sidebarScroll}>
              {/* バトルテスト */}
              <Text style={styles.presetCategory}>⚔️ バトル</Text>
              {TEST_PRESETS.filter(p => p.category === 'battle').map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetItem,
                    selectedPresetId === preset.id && styles.presetItemSelected,
                  ]}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={[
                    styles.presetName,
                    selectedPresetId === preset.id && styles.presetNameSelected,
                  ]}>
                    {preset.id}. {preset.name}
                  </Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </TouchableOpacity>
              ))}

              {/* 報酬画面テスト */}
              <Text style={styles.presetCategory}>🎁 報酬</Text>
              {TEST_PRESETS.filter(p => p.category === 'reward').map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetItem,
                    selectedPresetId === preset.id && styles.presetItemSelected,
                  ]}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={[
                    styles.presetName,
                    selectedPresetId === preset.id && styles.presetNameSelected,
                  ]}>
                    {preset.id}. {preset.name}
                  </Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </TouchableOpacity>
              ))}

              {/* エフェクトテスト */}
              <Text style={styles.presetCategory}>✨ エフェクト</Text>
              {TEST_PRESETS.filter(p => p.category === 'effects').map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetItem,
                    selectedPresetId === preset.id && styles.presetItemSelected,
                  ]}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={[
                    styles.presetName,
                    selectedPresetId === preset.id && styles.presetNameSelected,
                  ]}>
                    {preset.id}. {preset.name}
                  </Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 100 }} />
            </ScrollView>
          </View>

          {/* メインコンテンツ */}
          <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentInner}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onExit} style={styles.backButton}>
                <Text style={styles.backText}>← タイトルへ</Text>
              </TouchableOpacity>
              <Text style={styles.title}>🛠️ デバッグモード</Text>
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
                <TouchableOpacity
                  style={[styles.modeButton, testMode === 'effects' && styles.selectedMode]}
                  onPress={() => setTestMode('effects')}
                >
                  <Text style={styles.modeButtonText}>✨ エフェクト</Text>
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
                    setSelectedPresetId(null);
                    if (enemyCount > 3) setEnemyCount(3);
                  }}
                >
                  <Text style={styles.typeButtonText}>通常</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, styles.eliteType, nodeType === 'elite' && styles.selectedType]}
                  onPress={() => {
                    setNodeType('elite');
                    setSelectedPresetId(null);
                    if (enemyCount > 2) setEnemyCount(2);
                  }}
                >
                  <Text style={styles.typeButtonText}>エリート</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, styles.bossType, nodeType === 'boss' && styles.selectedType]}
                  onPress={() => {
                    setNodeType('boss');
                    setSelectedPresetId(null);
                    setEnemyCount(1);
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
                      onPress={() => {
                        setFloor(f);
                        setSelectedPresetId(null);
                      }}
                    >
                      <Text style={styles.floorButtonText}>{f}</Text>
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
                          setSelectedPresetId(null);
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
              </View>
            )}

            {/* エフェクト専用: エフェクト種類選択 */}
            {testMode === 'effects' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ エフェクト種類</Text>

                <Text style={styles.label}>ダメージエフェクト</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'damage' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('damage')}
                  >
                    <Text style={styles.effectButtonText}>💥 ダメージ</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>敵撃破エフェクト</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'defeat_normal' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('defeat_normal')}
                  >
                    <Text style={styles.effectButtonText}>💨 通常</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'defeat_elite' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('defeat_elite')}
                  >
                    <Text style={styles.effectButtonText}>💫 エリート</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'defeat_boss' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('defeat_boss')}
                  >
                    <Text style={styles.effectButtonText}>🌟 ボス</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>報酬画面エフェクト</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'psychedelic_normal' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('psychedelic_normal')}
                  >
                    <Text style={styles.effectButtonText}>🌀 通常</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.effectButton, selectedEffectType === 'psychedelic_boss' && styles.selectedEffect]}
                    onPress={() => setSelectedEffectType('psychedelic_boss')}
                  >
                    <Text style={styles.effectButtonText}>🔮 ボス</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* プレイヤー状態（エフェクトモード以外） */}
            {testMode !== 'effects' && <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 プレイヤー状態</Text>

              <Text style={styles.label}>HP: {hp} / {GAME_CONFIG.STARTING_HP}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.smallButton, hp === 10 && styles.selectedButton]}
                  onPress={() => { setHp(10); setSelectedPresetId(null); }}
                >
                  <Text style={styles.buttonText}>瀕死(10)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, hp === 35 && styles.selectedButton]}
                  onPress={() => { setHp(35); setSelectedPresetId(null); }}
                >
                  <Text style={styles.buttonText}>半分(35)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, hp === GAME_CONFIG.STARTING_HP && styles.selectedButton]}
                  onPress={() => { setHp(GAME_CONFIG.STARTING_HP); setSelectedPresetId(null); }}
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
                    onPress={() => { setStockCount(count); setSelectedPresetId(null); }}
                  >
                    <Text style={styles.buttonText}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>}

            {/* テスト開始ボタン */}
            <TouchableOpacity style={styles.startButton} onPress={startTest}>
              <Text style={styles.startButtonText}>
                {testMode === 'battle' ? '⚔️ バトル開始' :
                 testMode === 'reward' ? '🎁 報酬画面を開く' :
                 '✨ エフェクト再生'}
              </Text>
            </TouchableOpacity>

            {/* 設定サマリー */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                {testMode === 'effects' ? (
                  `✨ ${selectedEffectType.replace('_', ' ')}`
                ) : (
                  `${testMode === 'battle' ? '⚔️' : '🎁'} ${nodeType === 'boss' ? 'ボス' : nodeType === 'elite' ? 'エリート' : '通常'} | ${floor}階 | HP:${hp} | ストック:${stockCount}${testMode === 'battle' ? ` | 敵:${enemyCount}体` : ''}`
                )}
              </Text>
            </View>

            {/* エフェクトインライン表示エリア */}
            {testMode === 'effects' && (
              <View style={styles.effectPreviewArea}>
                <View style={styles.effectPreviewContainer}>
                  {showingEffect && (
                    <>
                      {selectedEffectType === 'damage' && (
                        <DamageEffect
                          key={effectKey}
                          x={140}
                          y={100}
                          damage={150}
                          onComplete={() => {}}
                        />
                      )}
                      {selectedEffectType === 'defeat_normal' && (
                        <DefeatEffect
                          key={effectKey}
                          x={140}
                          y={100}
                          enemyType="normal"
                          onComplete={() => {}}
                        />
                      )}
                      {selectedEffectType === 'defeat_elite' && (
                        <DefeatEffect
                          key={effectKey}
                          x={140}
                          y={100}
                          enemyType="elite"
                          onComplete={() => {}}
                        />
                      )}
                      {selectedEffectType === 'defeat_boss' && (
                        <DefeatEffect
                          key={effectKey}
                          x={140}
                          y={100}
                          enemyType="boss"
                          onComplete={() => {}}
                        />
                      )}
                      {selectedEffectType === 'psychedelic_normal' && (
                        <View style={styles.psychedelicPreview}>
                          <PsychedelicEffect
                            key={effectKey}
                            isBoss={false}
                          />
                        </View>
                      )}
                      {selectedEffectType === 'psychedelic_boss' && (
                        <View style={styles.psychedelicPreview}>
                          <PsychedelicEffect
                            key={effectKey}
                            isBoss={true}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.effectReplayInline}
                  onPress={() => {
                    setShowingEffect(false);
                    setTimeout(() => {
                      setEffectKey(prev => prev + 1);
                      setShowingEffect(true);
                    }, 50);
                  }}
                >
                  <Text style={styles.effectReplayInlineText}>🔄 再生</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
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
            {/* リプレイボタン（勝敗問わず表示） */}
            <TouchableOpacity
              style={[styles.resultButton, styles.replayButton]}
              onPress={replayTest}
            >
              <Text style={styles.resultButtonText}>🔄 リプレイ</Text>
            </TouchableOpacity>

            {/* メニューに戻る */}
            <TouchableOpacity
              style={[styles.resultButton, styles.menuButton]}
              onPress={() => {
                setBattleResult(null);
                setPhase('menu');
              }}
            >
              <Text style={styles.resultButtonText}>🛠️ メニューへ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.resultNote}>
            ※報酬画面は左メニューから個別にテスト
          </Text>
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

  // エフェクトテスト画面
  if (phase === 'effects') {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

    return (
      <View style={styles.effectsContainer}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3a', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />

        {/* 戻るボタン */}
        <TouchableOpacity
          style={styles.effectsExitButton}
          onPress={() => {
            setShowingEffect(false);
            setPhase('menu');
          }}
        >
          <Text style={styles.rewardExitText}>← 戻る</Text>
        </TouchableOpacity>

        {/* エフェクト情報 */}
        <View style={styles.effectsInfo}>
          <Text style={styles.effectsInfoText}>
            {selectedEffectType.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* 再生ボタン */}
        <TouchableOpacity
          style={styles.effectsReplayButton}
          onPress={() => {
            setShowingEffect(false);
            setTimeout(() => {
              setEffectKey(prev => prev + 1);
              setShowingEffect(true);
            }, 100);
          }}
        >
          <Text style={styles.effectsReplayText}>🔄 再生</Text>
        </TouchableOpacity>

        {/* エフェクト表示 */}
        {showingEffect && (
          <>
            {selectedEffectType === 'damage' && (
              <DamageEffect
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                damage={150}
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'defeat_normal' && (
              <DefeatEffect
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="normal"
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'defeat_elite' && (
              <DefeatEffect
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="elite"
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'defeat_boss' && (
              <DefeatEffect
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="boss"
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'psychedelic_normal' && (
              <PsychedelicEffect
                key={effectKey}
                isBoss={false}
              />
            )}
            {selectedEffectType === 'psychedelic_boss' && (
              <PsychedelicEffect
                key={effectKey}
                isBoss={true}
              />
            )}
          </>
        )}
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
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  // サイドバー
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(100, 200, 150, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 200, 150, 0.3)',
  },
  sidebarTitle: {
    color: '#8fdfb0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sidebarScroll: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  presetCategory: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  presetItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    backgroundColor: 'rgba(100, 200, 150, 0.2)',
    borderColor: '#6a8',
  },
  presetName: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  presetNameSelected: {
    color: '#8fdfb0',
  },
  presetDesc: {
    color: '#666',
    fontSize: 9,
    marginTop: 2,
  },
  // メインコンテンツ
  mainContent: {
    flex: 1,
  },
  mainContentInner: {
    padding: 16,
    paddingTop: 40,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#888',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  // テストモードボタン
  modeButton: {
    flex: 1,
    backgroundColor: '#2a3a4a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  // ノードタイプボタン
  typeButton: {
    flex: 1,
    backgroundColor: '#2a4a6a',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 階層ボタン
  floorButton: {
    backgroundColor: '#2a3a4a',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    minWidth: 40,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  // 敵数ボタン
  countButton: {
    flex: 1,
    backgroundColor: '#2a4a6a',
    paddingVertical: 10,
    borderRadius: 6,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  // プレイヤー設定ボタン
  smallButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tinyButton: {
    backgroundColor: '#2a4a6a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  // 開始ボタン
  startButton: {
    backgroundColor: '#2a8a4a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // サマリー
  summaryBox: {
    backgroundColor: 'rgba(100, 150, 200, 0.15)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  summaryText: {
    color: '#aaccff',
    fontSize: 12,
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
    gap: 12,
  },
  resultButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  replayButton: {
    backgroundColor: '#4a6a8a',
  },
  menuButton: {
    backgroundColor: '#5a4a6a',
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultNote: {
    color: '#888',
    fontSize: 12,
    marginTop: 24,
    fontStyle: 'italic',
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
  // エフェクトタイプ選択ボタン
  effectButton: {
    backgroundColor: '#3a2a5a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEffect: {
    backgroundColor: '#5a3a8a',
    borderColor: '#8a5aba',
  },
  effectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // エフェクトテスト画面
  effectsContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  effectsExitButton: {
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
  effectsInfo: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  effectsInfoText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  effectsReplayButton: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  effectsReplayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#3a6a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // インラインエフェクトプレビュー
  effectPreviewArea: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(138, 90, 186, 0.3)',
  },
  effectPreviewContainer: {
    height: 250,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0a0a1a',
  },
  psychedelicPreview: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 0.5 }],
  },
  effectReplayInline: {
    backgroundColor: '#3a5a7a',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  effectReplayInlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
