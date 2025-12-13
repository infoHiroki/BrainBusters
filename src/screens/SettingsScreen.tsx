// 設定画面
// ゲーム設定とデータ管理

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resetStats, GameStats } from '../store/statsStore';
import { clearRunState } from '../store/runStore';

interface SettingsScreenProps {
  onBack: () => void;
  onStatsReset: (newStats: GameStats) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onStatsReset,
}) => {
  const [isResetting, setIsResetting] = useState(false);

  // 統計リセット
  const handleResetStats = () => {
    Alert.alert(
      '統計をリセット',
      'すべての統計データ（プレイ回数、クリア回数など）がリセットされます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            const newStats = await resetStats();
            onStatsReset(newStats);
            setIsResetting(false);
            Alert.alert('完了', '統計データをリセットしました。');
          },
        },
      ]
    );
  };

  // 現在のランを放棄
  const handleAbandonRun = () => {
    Alert.alert(
      '冒険を放棄',
      '現在進行中の冒険データを削除します。次回は新しい冒険から始まります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '放棄する',
          style: 'destructive',
          onPress: async () => {
            await clearRunState();
            Alert.alert('完了', '冒険データを削除しました。');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
      </View>

      <View style={styles.content}>
        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleAbandonRun}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>冒険を放棄</Text>
              <Text style={styles.settingDesc}>
                進行中の冒険データを削除
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.dangerButton]}
            onPress={handleResetStats}
            disabled={isResetting}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, styles.dangerText]}>
                統計をリセット
              </Text>
              <Text style={styles.settingDesc}>
                すべての統計データを初期化
              </Text>
            </View>
            <Text style={[styles.arrow, styles.dangerText]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ゲーム情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ゲーム情報</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>バージョン</Text>
            <Text style={styles.infoValue}>2.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>カード総数</Text>
            <Text style={styles.infoValue}>500枚</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>最大フロア</Text>
            <Text style={styles.infoValue}>15F</Text>
          </View>
        </View>

        {/* クレジット */}
        <View style={styles.creditSection}>
          <Text style={styles.creditText}>
            Brain Busters - 概念カードローグライク
          </Text>
          <Text style={styles.creditSubText}>
            Powered by React Native & Expo
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backText: {
    color: '#6C5CE7',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  settingDesc: {
    color: '#888',
    fontSize: 12,
  },
  dangerText: {
    color: '#E74C3C',
  },
  arrow: {
    color: '#888',
    fontSize: 18,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
  },
  creditSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  creditText: {
    color: '#666',
    fontSize: 12,
  },
  creditSubText: {
    color: '#444',
    fontSize: 10,
    marginTop: 4,
  },
});
