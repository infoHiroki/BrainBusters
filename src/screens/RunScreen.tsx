// ラン画面（統括）
// 冒険全体の流れを管理

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, Relic, GAME_CONFIG } from '../types/game';
import { BattleScreen } from './BattleScreen';
import { RewardScreen } from './RewardScreen';
import {
  startNewRun,
  loadRunState,
  clearRunState,
  advanceFloor,
  addCardToDeck,
  addRelic,
  updateGold,
  healPlayer,
} from '../store/runStore';
import { GameStats, loadStats, updateStatsAfterRun } from '../store/statsStore';

type RunPhase = 'loading' | 'map' | 'battle' | 'reward' | 'shop' | 'rest' | 'result';

interface RunScreenProps {
  onExit: () => void;
  onStatsUpdate?: (stats: GameStats) => void;
}

export const RunScreen: React.FC<RunScreenProps> = ({ onExit, onStatsUpdate }) => {
  const [runState, setRunState] = useState<RunState | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [phase, setPhase] = useState<RunPhase>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [goldReward, setGoldReward] = useState(0);
  const [isBossReward, setIsBossReward] = useState(false);
  const [enemiesDefeatedThisRun, setEnemiesDefeatedThisRun] = useState(0);

  // 初期化
  useEffect(() => {
    initRun();
  }, []);

  const initRun = async () => {
    setIsLoading(true);

    // 統計データ読み込み
    const loadedStats = await loadStats();
    setStats(loadedStats);

    // 既存のランがあれば継続、なければ新規作成
    let run = await loadRunState();
    if (!run) {
      run = await startNewRun();
    }

    setRunState(run);
    setIsLoading(false);

    // 現在のノードタイプに応じてフェーズを設定
    const currentNode = run.map.find(n => n.id === run.currentNodeId);
    if (currentNode && !currentNode.completed) {
      switch (currentNode.type) {
        case 'battle':
        case 'elite':
        case 'boss':
          setPhase('battle');
          break;
        case 'shop':
          setPhase('shop');
          break;
        case 'rest':
          setPhase('rest');
          break;
        default:
          setPhase('map');
      }
    } else {
      setPhase('map');
    }
  };

  // バトル終了処理
  const handleBattleEnd = async (victory: boolean, updatedRunState: RunState, enemiesDefeated: number = 0) => {
    // 倒した敵数をカウント
    setEnemiesDefeatedThisRun(prev => prev + enemiesDefeated);

    if (!victory) {
      // 敗北
      await handleRunEnd(false, updatedRunState);
      return;
    }

    // 勝利 - 報酬画面へ
    const currentNode = updatedRunState.map.find(n => n.id === updatedRunState.currentNodeId);
    const isBoss = currentNode?.type === 'boss';
    const isElite = currentNode?.type === 'elite';

    // ゴールド報酬計算
    let gold = 10 + Math.floor(Math.random() * 10);
    if (isElite) gold += 15;
    if (isBoss) gold += 30;

    setGoldReward(gold);
    setIsBossReward(isBoss);
    setRunState(updatedRunState);
    setPhase('reward');
  };

  // カード選択
  const handleSelectCard = async (card: Card) => {
    if (!runState) return;

    const updated = await addCardToDeck(runState, card);
    setRunState(updated);
  };

  // レリック選択
  const handleSelectRelic = async (relic: Relic) => {
    if (!runState) return;

    const updated = await addRelic(runState, relic);
    setRunState(updated);
  };

  // ゴールド獲得
  const handleTakeGold = async () => {
    if (!runState) return;
    const updated = await updateGold(runState, goldReward);
    setRunState(updated);
  };

  // 次のフロアへ
  const handleProceed = async () => {
    if (!runState) return;

    // 最終フロアクリア
    if (runState.floor >= GAME_CONFIG.MAX_FLOOR) {
      await handleRunEnd(true, runState);
      return;
    }

    // 次の階へ
    const updated = await advanceFloor(runState);
    setRunState(updated);

    // 次のノードタイプに応じてフェーズを設定
    const nextNode = updated.map.find(n => n.id === updated.currentNodeId);
    if (nextNode) {
      switch (nextNode.type) {
        case 'battle':
        case 'elite':
        case 'boss':
          setPhase('battle');
          break;
        case 'shop':
          setPhase('shop');
          break;
        case 'rest':
          setPhase('rest');
          break;
        default:
          setPhase('map');
      }
    }
  };

  // 休憩（HP回復）
  const handleRest = async () => {
    if (!runState) return;

    const healAmount = Math.floor(runState.maxHp * 0.3);
    const updated = await healPlayer(runState, healAmount);
    setRunState(updated);

    // 次の階へ
    handleProceed();
  };

  // ラン終了処理
  const handleRunEnd = async (victory: boolean, finalRunState: RunState) => {
    if (!stats) return;

    // 統計データを更新
    const newStats = await updateStatsAfterRun(
      stats,
      finalRunState.floor,
      victory,
      enemiesDefeatedThisRun
    );
    setStats(newStats);

    // 親コンポーネントに統計更新を通知
    if (onStatsUpdate) {
      onStatsUpdate(newStats);
    }

    // ランデータをクリア
    await clearRunState();

    setPhase('result');
  };

  // ローディング
  if (isLoading || !runState) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>冒険の準備中...</Text>
      </View>
    );
  }

  // バトル画面
  if (phase === 'battle') {
    return (
      <BattleScreen
        runState={runState}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  // 報酬画面
  if (phase === 'reward') {
    return (
      <RewardScreen
        runState={runState}
        isBossReward={isBossReward}
        goldReward={goldReward}
        onSelectCard={handleSelectCard}
        onSelectRelic={handleSelectRelic}
        onSkip={handleProceed}
        onTakeGold={handleTakeGold}
      />
    );
  }

  // 休憩画面
  if (phase === 'rest') {
    const healAmount = Math.floor(runState.maxHp * 0.3);
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.centerContent}>
          <Text style={styles.phaseTitle}>休憩所</Text>
          <Text style={styles.floorText}>{runState.floor}F</Text>
          <View style={styles.restInfo}>
            <Text style={styles.restText}>
              焚き火で休息を取り、体力を回復できます
            </Text>
            <Text style={styles.healText}>
              🔥 回復量: {healAmount} HP
            </Text>
            <Text style={styles.currentHpText}>
              現在のHP: {runState.hp}/{runState.maxHp}
            </Text>
          </View>
          <TouchableOpacity style={styles.restButton} onPress={handleRest}>
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>休憩する</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleProceed}>
            <Text style={styles.skipText}>休憩せずに進む</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ショップ画面（簡易版）
  if (phase === 'shop') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.centerContent}>
          <Text style={styles.phaseTitle}>ショップ</Text>
          <Text style={styles.floorText}>{runState.floor}F</Text>
          <View style={styles.shopInfo}>
            <Text style={styles.goldDisplay}>💰 {runState.gold} ゴールド</Text>
            <Text style={styles.shopText}>
              （ショップ機能は開発中です）
            </Text>
          </View>
          <TouchableOpacity style={styles.restButton} onPress={handleProceed}>
            <LinearGradient
              colors={['#6C5CE7', '#5849BE']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>次の階へ進む</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 結果画面
  if (phase === 'result') {
    const victory = runState.floor >= GAME_CONFIG.MAX_FLOOR && runState.hp > 0;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={victory ? ['#1a3a1a', '#0a2a0a', '#1a3a1a'] : ['#3a1a1a', '#2a0a0a', '#3a1a1a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.centerContent}>
          <Text style={[styles.resultTitle, { color: victory ? '#2ecc71' : '#e74c3c' }]}>
            {victory ? '勝利！' : '敗北...'}
          </Text>
          <View style={styles.resultStats}>
            <Text style={styles.statRow}>到達階: {runState.floor}F</Text>
            <Text style={styles.statRow}>獲得ゴールド: {runState.gold}</Text>
            <Text style={styles.statRow}>デッキ枚数: {runState.deck.length}</Text>
            <Text style={styles.statRow}>レリック数: {runState.relics.length}</Text>
          </View>
          <TouchableOpacity style={styles.exitButton} onPress={onExit}>
            <LinearGradient
              colors={['#6C5CE7', '#5849BE']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>タイトルに戻る</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // マップ画面（フォールバック）
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>冒険中</Text>
        <Text style={styles.floorText}>{runState.floor}F</Text>
      </View>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>❤️ {runState.hp}/{runState.maxHp}</Text>
        <Text style={styles.statusText}>💰 {runState.gold}</Text>
      </View>
      <View style={styles.centerContent}>
        <TouchableOpacity style={styles.restButton} onPress={handleProceed}>
          <LinearGradient
            colors={['#6C5CE7', '#5849BE']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>次のノードへ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  floorText: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    right: 20,
    alignItems: 'flex-end',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  centerContent: {
    alignItems: 'center',
    padding: 20,
  },
  phaseTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  restInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  restText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  healText: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentHpText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  shopInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  goldDisplay: {
    color: '#f1c40f',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  shopText: {
    color: '#888',
    fontSize: 14,
  },
  restButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  resultStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
    minWidth: 200,
  },
  statRow: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 4,
  },
  exitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
