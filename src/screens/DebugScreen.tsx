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
import { PsychedelicEffect, DamageEffectSvg, DefeatEffectSvg } from '../components/effects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 220;

type DebugPhase = 'menu' | 'battle' | 'reward' | 'result' | 'effects';
type TestMode = 'battle' | 'reward' | 'effects';
type EffectType = 'psychedelic_normal' | 'psychedelic_boss' | 'damage_10' | 'damage_25' | 'damage_50' | 'damage_80' | 'defeat_normal' | 'defeat_elite' | 'defeat_boss';

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
  // エフェクトテスト（ダメージ）- ゲームバランスに合わせた値
  { id: 15, name: 'DMG 10', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '小ダメージ', effectType: 'damage_10' },
  { id: 16, name: 'DMG 25', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '中ダメージ', effectType: 'damage_25' },
  { id: 17, name: 'DMG 50', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '大ダメージ', effectType: 'damage_50' },
  { id: 18, name: 'DMG 80', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '極大ダメージ', effectType: 'damage_80' },
  // エフェクトテスト（撃破）
  { id: 19, name: '撃破:通常', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: '通常敵撃破', effectType: 'defeat_normal' },
  { id: 20, name: '撃破:エリート', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'エリート撃破', effectType: 'defeat_elite' },
  { id: 21, name: '撃破:ボス', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'ボス撃破', effectType: 'defeat_boss' },
  // エフェクトテスト（報酬演出）
  { id: 22, name: '報酬:通常', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'サイケデリック', effectType: 'psychedelic_normal' },
  { id: 23, name: '報酬:ボス', category: 'effects', testMode: 'effects', nodeType: 'battle', floor: 1, enemyCount: 1, hp: 70, stockCount: 0, description: 'ボス用演出', effectType: 'psychedelic_boss' },
];

export const DebugScreen: React.FC<DebugScreenProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<DebugPhase>('menu');
  const [runState, setRunState] = useState<RunState | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);

  // === 設定項目 ===
  const [testMode, setTestMode] = useState<TestMode>('battle');

  // エフェクトテスト用
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType>('damage_10');
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
    const mainAreaWidth = SCREEN_WIDTH - SIDEBAR_WIDTH;
    const mainAreaHeight = SCREEN_HEIGHT;
    // エフェクトはmainPreview内に配置されるため、相対座標を使用
    const effectCenterX = mainAreaWidth / 2;
    const effectCenterY = mainAreaHeight / 2 - 50;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.layout}>
          {/* サイドバー（全設定） */}
          <View style={styles.sidebar}>
            {/* ヘッダー */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={onExit} style={styles.sidebarBack}>
                <Text style={styles.sidebarBackText}>← 戻る</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>🛠️ デバッグ</Text>
            </View>

            <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
              {/* テストモード選択 */}
              <View style={styles.sidebarSection}>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeTab, testMode === 'battle' && styles.modeTabActive]}
                    onPress={() => setTestMode('battle')}
                  >
                    <Text style={[styles.modeTabText, testMode === 'battle' && styles.modeTabTextActive]}>⚔️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeTab, testMode === 'reward' && styles.modeTabActive]}
                    onPress={() => setTestMode('reward')}
                  >
                    <Text style={[styles.modeTabText, testMode === 'reward' && styles.modeTabTextActive]}>🎁</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeTab, testMode === 'effects' && styles.modeTabActive]}
                    onPress={() => setTestMode('effects')}
                  >
                    <Text style={[styles.modeTabText, testMode === 'effects' && styles.modeTabTextActive]}>✨</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* バトル/報酬用設定 */}
              {testMode !== 'effects' && (
                <>
                  {/* ノードタイプ */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.sidebarLabel}>ノード</Text>
                    <View style={styles.compactRow}>
                      <TouchableOpacity
                        style={[styles.compactBtn, nodeType === 'battle' && styles.compactBtnActive]}
                        onPress={() => { setNodeType('battle'); setSelectedPresetId(null); }}
                      >
                        <Text style={styles.compactBtnText}>通常</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.compactBtn, styles.eliteBtn, nodeType === 'elite' && styles.compactBtnActive]}
                        onPress={() => { setNodeType('elite'); setSelectedPresetId(null); if (enemyCount > 2) setEnemyCount(2); }}
                      >
                        <Text style={styles.compactBtnText}>E</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.compactBtn, styles.bossBtn, nodeType === 'boss' && styles.compactBtnActive]}
                        onPress={() => { setNodeType('boss'); setSelectedPresetId(null); setEnemyCount(1); if (!(GAME_CONFIG.BOSS_FLOORS as readonly number[]).includes(floor)) setFloor(5); }}
                      >
                        <Text style={styles.compactBtnText}>B</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 階層 */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.sidebarLabel}>階層: {floor}F</Text>
                    <View style={styles.floorGrid}>
                      {floorOptions.map(f => (
                        <TouchableOpacity
                          key={f}
                          style={[styles.floorChip, floor === f && styles.floorChipActive]}
                          onPress={() => { setFloor(f); setSelectedPresetId(null); }}
                        >
                          <Text style={[styles.floorChipText, floor === f && styles.floorChipTextActive]}>{f}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 敵数（バトルのみ） */}
                  {testMode === 'battle' && (
                    <View style={styles.sidebarSection}>
                      <Text style={styles.sidebarLabel}>敵数</Text>
                      <View style={styles.compactRow}>
                        {[1, 2, 3].map(c => (
                          <TouchableOpacity
                            key={c}
                            style={[styles.compactBtn, enemyCount === c && styles.compactBtnActive, c > getMaxEnemyCount() && styles.compactBtnDisabled]}
                            onPress={() => { if (c <= getMaxEnemyCount()) { setEnemyCount(c); setSelectedPresetId(null); } }}
                            disabled={c > getMaxEnemyCount()}
                          >
                            <Text style={[styles.compactBtnText, c > getMaxEnemyCount() && styles.compactBtnTextDisabled]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* HP */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.sidebarLabel}>HP: {hp}</Text>
                    <View style={styles.compactRow}>
                      <TouchableOpacity style={[styles.compactBtn, hp === 10 && styles.compactBtnActive]} onPress={() => { setHp(10); setSelectedPresetId(null); }}>
                        <Text style={styles.compactBtnText}>10</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.compactBtn, hp === 35 && styles.compactBtnActive]} onPress={() => { setHp(35); setSelectedPresetId(null); }}>
                        <Text style={styles.compactBtnText}>35</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.compactBtn, hp === 70 && styles.compactBtnActive]} onPress={() => { setHp(70); setSelectedPresetId(null); }}>
                        <Text style={styles.compactBtnText}>70</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ストック */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.sidebarLabel}>ストック: {stockCount}</Text>
                    <View style={styles.compactRow}>
                      {[0, 1, 2, 3, 4, 5].map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.miniBtn, stockCount === c && styles.miniBtnActive]}
                          onPress={() => { setStockCount(c); setSelectedPresetId(null); }}
                        >
                          <Text style={styles.miniBtnText}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 開始ボタン */}
                  <TouchableOpacity style={styles.sidebarStartBtn} onPress={startTest}>
                    <Text style={styles.sidebarStartBtnText}>
                      {testMode === 'battle' ? '▶ バトル' : '▶ 報酬画面'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* エフェクト用設定 */}
              {testMode === 'effects' && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarLabel}>ダメージ</Text>
                  <View style={styles.effectGrid}>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'damage_10' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('damage_10'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'damage_25' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('damage_25'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>25</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'damage_50' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('damage_50'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>50</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'damage_80' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('damage_80'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>80</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.sidebarLabel, { marginTop: 8 }]}>撃破</Text>
                  <View style={styles.effectGrid}>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'defeat_normal' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('defeat_normal'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>通常</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'defeat_elite' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('defeat_elite'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>エリート</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'defeat_boss' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('defeat_boss'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>ボス</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.sidebarLabel, { marginTop: 8 }]}>報酬演出</Text>
                  <View style={styles.effectGrid}>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'psychedelic_normal' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('psychedelic_normal'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>通常</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.effectChip, selectedEffectType === 'psychedelic_boss' && styles.effectChipActive]}
                      onPress={() => { setSelectedEffectType('psychedelic_boss'); setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                    >
                      <Text style={styles.effectChipText}>ボス</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={() => { setShowingEffect(false); setTimeout(() => { setEffectKey(k => k+1); setShowingEffect(true); }, 50); }}
                  >
                    <Text style={styles.replayBtnText}>🔄 再生</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* プリセット一覧 */}
              <View style={styles.presetSection}>
                <Text style={styles.presetHeader}>📋 プリセット</Text>

                <Text style={styles.presetCategory}>⚔️ バトル</Text>
                {TEST_PRESETS.filter(p => p.category === 'battle').map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetItem, selectedPresetId === preset.id && styles.presetItemSelected]}
                    onPress={() => applyPreset(preset)}
                  >
                    <Text style={[styles.presetName, selectedPresetId === preset.id && styles.presetNameSelected]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.presetCategory}>🎁 報酬</Text>
                {TEST_PRESETS.filter(p => p.category === 'reward').map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetItem, selectedPresetId === preset.id && styles.presetItemSelected]}
                    onPress={() => applyPreset(preset)}
                  >
                    <Text style={[styles.presetName, selectedPresetId === preset.id && styles.presetNameSelected]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.presetCategory}>✨ エフェクト</Text>
                {TEST_PRESETS.filter(p => p.category === 'effects').map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetItem, selectedPresetId === preset.id && styles.presetItemSelected]}
                    onPress={() => applyPreset(preset)}
                  >
                    <Text style={[styles.presetName, selectedPresetId === preset.id && styles.presetNameSelected]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
              </View>
            </ScrollView>
          </View>

          {/* メインプレビューエリア */}
          <View style={styles.mainPreview}>
            {/* エフェクトモード: フル画面プレビュー */}
            {testMode === 'effects' && showingEffect && (
              <>
                {/* ダメージエフェクト */}
                {selectedEffectType === 'damage_10' && (
                  <DamageEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} damage={10} onComplete={() => {}} />
                )}
                {selectedEffectType === 'damage_25' && (
                  <DamageEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} damage={25} onComplete={() => {}} />
                )}
                {selectedEffectType === 'damage_50' && (
                  <DamageEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} damage={50} onComplete={() => {}} />
                )}
                {selectedEffectType === 'damage_80' && (
                  <DamageEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} damage={80} onComplete={() => {}} />
                )}
                {/* 撃破エフェクト */}
                {selectedEffectType === 'defeat_normal' && (
                  <DefeatEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} enemyType="normal" onComplete={() => {}} />
                )}
                {selectedEffectType === 'defeat_elite' && (
                  <DefeatEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} enemyType="elite" onComplete={() => {}} />
                )}
                {selectedEffectType === 'defeat_boss' && (
                  <DefeatEffectSvg key={effectKey} x={effectCenterX} y={effectCenterY} enemyType="boss" onComplete={() => {}} />
                )}
                {/* 報酬演出 */}
                {selectedEffectType === 'psychedelic_normal' && (
                  <PsychedelicEffect key={effectKey} isBoss={false} />
                )}
                {selectedEffectType === 'psychedelic_boss' && (
                  <PsychedelicEffect key={effectKey} isBoss={true} />
                )}
              </>
            )}

            {/* 待機状態 */}
            {testMode !== 'effects' && (
              <View style={styles.waitingState}>
                <Text style={styles.waitingIcon}>{testMode === 'battle' ? '⚔️' : '🎁'}</Text>
                <Text style={styles.waitingText}>
                  {nodeType === 'boss' ? 'ボス' : nodeType === 'elite' ? 'エリート' : '通常'} | {floor}階
                </Text>
                <Text style={styles.waitingSubtext}>
                  HP:{hp} | ストック:{stockCount}{testMode === 'battle' ? ` | 敵:${enemyCount}` : ''}
                </Text>
                <TouchableOpacity style={styles.waitingStartBtn} onPress={startTest}>
                  <Text style={styles.waitingStartBtnText}>▶ 開始</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* エフェクト待機状態 */}
            {testMode === 'effects' && !showingEffect && (
              <View style={styles.waitingState}>
                <Text style={styles.waitingIcon}>✨</Text>
                <Text style={styles.waitingText}>エフェクトを選択</Text>
              </View>
            )}
          </View>
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
            {/* ダメージエフェクト */}
            {selectedEffectType === 'damage_10' && (
              <DamageEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                damage={10}
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'damage_25' && (
              <DamageEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                damage={25}
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'damage_50' && (
              <DamageEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                damage={50}
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'damage_80' && (
              <DamageEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                damage={80}
                onComplete={() => {}}
              />
            )}
            {/* 撃破エフェクト */}
            {selectedEffectType === 'defeat_normal' && (
              <DefeatEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="normal"
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'defeat_elite' && (
              <DefeatEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="elite"
                onComplete={() => {}}
              />
            )}
            {selectedEffectType === 'defeat_boss' && (
              <DefeatEffectSvg
                key={effectKey}
                x={SCREEN_WIDTH / 2}
                y={SCREEN_HEIGHT / 3}
                enemyType="boss"
                onComplete={() => {}}
              />
            )}
            {/* 報酬演出 */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(100, 200, 150, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 200, 150, 0.3)',
  },
  sidebarBack: {
    marginBottom: 4,
  },
  sidebarBackText: {
    color: '#888',
    fontSize: 11,
  },
  sidebarTitle: {
    color: '#8fdfb0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sidebarScroll: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  sidebarSection: {
    marginBottom: 10,
  },
  sidebarLabel: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 4,
  },
  // モードタブ
  modeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modeTab: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#3a5a7a',
  },
  modeTabText: {
    fontSize: 16,
  },
  modeTabTextActive: {
    fontSize: 18,
  },
  // コンパクトボタン
  compactRow: {
    flexDirection: 'row',
    gap: 4,
  },
  compactBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  compactBtnActive: {
    backgroundColor: '#4a6a8a',
  },
  compactBtnDisabled: {
    opacity: 0.3,
  },
  compactBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  compactBtnTextDisabled: {
    color: '#666',
  },
  eliteBtn: {
    backgroundColor: 'rgba(200, 150, 50, 0.3)',
  },
  bossBtn: {
    backgroundColor: 'rgba(200, 50, 100, 0.3)',
  },
  // ミニボタン
  miniBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
    borderRadius: 3,
    alignItems: 'center',
  },
  miniBtnActive: {
    backgroundColor: '#4a6a8a',
  },
  miniBtnText: {
    color: '#ccc',
    fontSize: 10,
  },
  // 階層グリッド
  floorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  floorChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  floorChipActive: {
    backgroundColor: '#4a6a8a',
  },
  floorChipText: {
    color: '#888',
    fontSize: 10,
  },
  floorChipTextActive: {
    color: '#fff',
  },
  // エフェクトグリッド
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  effectChip: {
    backgroundColor: 'rgba(138, 90, 186, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  effectChipActive: {
    backgroundColor: '#5a3a8a',
  },
  effectChipText: {
    color: '#ccc',
    fontSize: 10,
  },
  replayBtn: {
    marginTop: 8,
    backgroundColor: '#3a5a7a',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  replayBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // サイドバー開始ボタン
  sidebarStartBtn: {
    backgroundColor: '#2a8a4a',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  sidebarStartBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // プリセットセクション
  presetSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  presetHeader: {
    color: '#8fdfb0',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  presetCategory: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  presetItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  presetItemSelected: {
    backgroundColor: 'rgba(100, 200, 150, 0.25)',
  },
  presetName: {
    color: '#aaa',
    fontSize: 10,
  },
  presetNameSelected: {
    color: '#8fdfb0',
  },
  // メインプレビュー
  mainPreview: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  waitingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  waitingText: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingSubtext: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
  waitingStartBtn: {
    marginTop: 20,
    backgroundColor: '#2a8a4a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  waitingStartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
