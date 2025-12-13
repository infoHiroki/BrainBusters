// BrainBusters - ローグライクカードゲーム
// シンプルなルーター

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { RunScreen } from './src/screens/RunScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadStats, GameStats } from './src/store/statsStore';

type Screen = 'home' | 'run' | 'help' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [stats, setStats] = useState<GameStats | null>(null);

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

  // ホーム画面
  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <HomeScreen
          stats={stats}
          onStartRun={() => setCurrentScreen('run')}
          onOpenHelp={() => setCurrentScreen('help')}
          onOpenSettings={() => setCurrentScreen('settings')}
        />
      </SafeAreaView>
    );
  }

  // ヘルプ画面
  if (currentScreen === 'help') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <HelpScreen onBack={() => setCurrentScreen('home')} />
      </SafeAreaView>
    );
  }

  // 設定画面
  if (currentScreen === 'settings') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <SettingsScreen
          onBack={() => setCurrentScreen('home')}
          onStatsReset={handleStatsUpdate}
        />
      </SafeAreaView>
    );
  }

  // ラン画面
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <RunScreen
        onExit={() => setCurrentScreen('home')}
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
