// ホーム画面
// シンプルなスタート画面 + 統計表示

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameStats } from '../store/statsStore';

interface HomeScreenProps {
  stats: GameStats | null;
  onStartRun: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  onStartRun,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* タイトル */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Brain Busters</Text>
        <Text style={styles.subtitle}>概念カードローグライク</Text>
      </View>

      {/* 統計 */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalRuns}</Text>
              <Text style={styles.statLabel}>総プレイ</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.victoryValue]}>{stats.victories}</Text>
              <Text style={styles.statLabel}>クリア</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.bestFloor}F</Text>
              <Text style={styles.statLabel}>最高到達</Text>
            </View>
          </View>
        </View>
      )}

      {/* スタートボタン */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartRun}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>冒険開始</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hintText}>
          15階層のダンジョンに挑戦しよう
        </Text>
      </View>

      {/* バージョン */}
      <Text style={styles.versionText}>v2.0 - Roguelike Edition</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#6C5CE7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  statsContainer: {
    marginBottom: 60,
  },
  statRow: {
    flexDirection: 'row',
    gap: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  victoryValue: {
    color: '#2ecc71',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  startButtonGradient: {
    paddingHorizontal: 80,
    paddingVertical: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    marginTop: 16,
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    color: '#444',
    fontSize: 10,
  },
});
