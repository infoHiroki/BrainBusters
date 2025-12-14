// BrainBusters - ローグライクカードゲーム

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TitleScreen } from './src/screens/TitleScreen';
import { RunScreen } from './src/screens/RunScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DebugScreen } from './src/screens/DebugScreen';
import { loadStats, GameStats } from './src/store/statsStore';
import { clearRunState } from './src/store/runStore';

// 開発モードフラグ（本番リリース時はfalseに）
const DEV_MODE = __DEV__;

type Screen = 'title' | 'run' | 'settings' | 'debug';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [startNewGame, setStartNewGame] = useState(false);

  // 統計データを読み込む
  useEffect(() => {
    const init = async () => {
      const loadedStats = await loadStats();
      setStats(loadedStats);
    };
    init();
  }, []);

  // 統計を更新（ラン終了時または設定画面リセット時）
  const handleStatsUpdate = (newStats: GameStats) => {
    setStats(newStats);
  };

  // つづきから
  const handleContinue = () => {
    setStartNewGame(false);
    setCurrentScreen('run');
  };

  // はじめから（新規ゲーム）
  const handleNewGame = async () => {
    // 既存のランデータをクリア
    await clearRunState();
    setStartNewGame(true);
    setCurrentScreen('run');
  };

  // ゲーム終了時
  const handleExitRun = () => {
    setStartNewGame(false);
    setCurrentScreen('title');
  };

  // タイトル画面
  if (currentScreen === 'title') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <TitleScreen
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onSettings={() => setCurrentScreen('settings')}
          onDebug={DEV_MODE ? () => setCurrentScreen('debug') : undefined}
        />
      </SafeAreaView>
    );
  }

  // 設定画面
  if (currentScreen === 'settings') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <SettingsScreen
          onBack={() => setCurrentScreen('title')}
          onStatsReset={handleStatsUpdate}
        />
      </SafeAreaView>
    );
  }

  // デバッグ画面
  if (currentScreen === 'debug') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <DebugScreen onExit={() => setCurrentScreen('title')} />
      </SafeAreaView>
    );
  }

  // ラン画面
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <RunScreen
        onExit={handleExitRun}
        onStatsUpdate={handleStatsUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
});
