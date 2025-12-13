// 設定画面
// ルール説明・統計・データ管理を統合

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resetStats, loadStats, GameStats } from '../store/statsStore';
import { clearRunState } from '../store/runStore';

interface SettingsScreenProps {
  onBack: () => void;
  onStatsReset: (newStats: GameStats) => void;
}

type ExpandedSection = 'rules' | 'stats' | 'data' | 'about' | null;

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onStatsReset,
}) => {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [stats, setStats] = useState<GameStats | null>(null);

  // 統計データ読み込み
  useEffect(() => {
    const load = async () => {
      const loadedStats = await loadStats();
      setStats(loadedStats);
    };
    load();
  }, []);

  // セクション展開切り替え
  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // 統計リセット
  const handleResetStats = () => {
    Alert.alert(
      'すべてリセット',
      '統計データと進行中の冒険がすべて削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await clearRunState();
            const newStats = await resetStats();
            setStats(newStats);
            onStatsReset(newStats);
            Alert.alert('完了', 'すべてのデータをリセットしました。');
          },
        },
      ]
    );
  };

  // 冒険放棄
  const handleAbandonRun = () => {
    Alert.alert(
      '冒険を放棄',
      '現在進行中の冒険データを削除します。',
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
          <Text style={styles.backText}>← もどる</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* あそびかた */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('rules')}
        >
          <Text style={styles.sectionTitle}>あそびかた</Text>
          <Text style={styles.arrow}>{expandedSection === 'rules' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedSection === 'rules' && (
          <View style={styles.sectionContent}>
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>バトルの基本</Text>
              <Text style={styles.ruleText}>
                • 毎ターン手札5枚、エネルギー3を獲得{'\n'}
                • カードを使って敵を倒す{'\n'}
                • 敵のHPを0にすれば勝利{'\n'}
                • 自分のHPが0になると敗北
              </Text>
            </View>

            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>手札とドロー</Text>
              <Text style={styles.ruleText}>
                • ターン開始時に手札を全て捨て、5枚ドロー{'\n'}
                • ドローカードで引いた手札は{'\n'}
                　そのターン中すぐに使用可能！{'\n'}
                • 1ターンで多くのカードを使うチャンス
              </Text>
            </View>

            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>カードタイプ</Text>
              <View style={styles.cardTypeRow}>
                <View style={[styles.badge, { backgroundColor: '#E74C3C' }]}>
                  <Text style={styles.badgeText}>攻撃</Text>
                </View>
                <Text style={styles.typeDesc}>敵にダメージを与える</Text>
              </View>
              <View style={styles.cardTypeRow}>
                <View style={[styles.badge, { backgroundColor: '#3498DB' }]}>
                  <Text style={styles.badgeText}>防御</Text>
                </View>
                <Text style={styles.typeDesc}>ブロックを獲得する</Text>
              </View>
              <View style={styles.cardTypeRow}>
                <View style={[styles.badge, { backgroundColor: '#2ECC71' }]}>
                  <Text style={styles.badgeText}>スキル</Text>
                </View>
                <Text style={styles.typeDesc}>ドロー、バフ、回復など</Text>
              </View>
            </View>

            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>ブロックの仕組み</Text>
              <Text style={styles.ruleText}>
                • 防御カードで「ブロック」を獲得{'\n'}
                • ブロックはダメージを肩代わり{'\n'}
                • ブロックは毎ターン終了時にリセット{'\n'}
                • 例: ブロック5、被ダメージ8 → HP-3
              </Text>
            </View>

            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>ステータス効果</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusName, { color: '#2ECC71' }]}>筋力</Text>
                <Text style={styles.statusDesc}>攻撃ダメージ +スタック数</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusName, { color: '#2ECC71' }]}>敏捷</Text>
                <Text style={styles.statusDesc}>ブロック +スタック数</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusName, { color: '#E74C3C' }]}>脆弱</Text>
                <Text style={styles.statusDesc}>被ダメージ +50%</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusName, { color: '#E74C3C' }]}>弱体</Text>
                <Text style={styles.statusDesc}>与ダメージ -25%</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusName, { color: '#2ECC71' }]}>再生</Text>
                <Text style={styles.statusDesc}>ターン開始時にHP回復</Text>
              </View>
            </View>

            <View style={styles.ruleBlock}>
              <Text style={styles.ruleTitle}>ダンジョン構造</Text>
              <Text style={styles.ruleText}>
                • 全15階層{'\n'}
                • 5F, 10F, 15F: ボス戦{'\n'}
                • 休憩所: 最大HPの30%回復{'\n'}
                • 勝利するとカード報酬を獲得
              </Text>
            </View>
          </View>
        )}

        {/* 記録 */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('stats')}
        >
          <Text style={styles.sectionTitle}>記録</Text>
          <Text style={styles.arrow}>{expandedSection === 'stats' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedSection === 'stats' && stats && (
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>総プレイ回数</Text>
              <Text style={styles.statValue}>{stats.totalRuns} 回</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>クリア回数</Text>
              <Text style={[styles.statValue, { color: '#2ECC71' }]}>
                {stats.victories} 回
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>最高到達階</Text>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                {stats.bestFloor}F
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>総撃破数</Text>
              <Text style={styles.statValue}>{stats.totalEnemiesDefeated} 体</Text>
            </View>
          </View>
        )}

        {/* データ管理 */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('data')}
        >
          <Text style={styles.sectionTitle}>データ管理</Text>
          <Text style={styles.arrow}>{expandedSection === 'data' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedSection === 'data' && (
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleAbandonRun}>
              <Text style={styles.dangerButtonText}>冒険を放棄</Text>
              <Text style={styles.dangerButtonDesc}>進行中の冒険データを削除</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResetStats}>
              <Text style={[styles.dangerButtonText, { color: '#E74C3C' }]}>
                すべてリセット
              </Text>
              <Text style={styles.dangerButtonDesc}>統計データと冒険データを全削除</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* このゲームについて */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('about')}
        >
          <Text style={styles.sectionTitle}>このゲームについて</Text>
          <Text style={styles.arrow}>{expandedSection === 'about' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expandedSection === 'about' && (
          <View style={styles.sectionContent}>
            <Text style={styles.aboutTitle}>Brain Busters</Text>
            <Text style={styles.aboutText}>概念カードローグライク</Text>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>バージョン</Text>
              <Text style={styles.aboutValue}>2.1.0</Text>
            </View>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>カード総数</Text>
              <Text style={styles.aboutValue}>500枚</Text>
            </View>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutLabel}>最大フロア</Text>
              <Text style={styles.aboutValue}>15F</Text>
            </View>
            <Text style={styles.creditText}>
              Powered by React Native & Expo
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 500,
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
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#888',
    fontSize: 14,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  // ルール関連
  ruleBlock: {
    marginBottom: 20,
  },
  ruleTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ruleText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  typeDesc: {
    color: '#ccc',
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusName: {
    fontSize: 13,
    fontWeight: 'bold',
    width: 45,
    marginRight: 10,
  },
  statusDesc: {
    color: '#ccc',
    fontSize: 13,
  },
  // 統計関連
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // データ管理関連
  dangerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dangerButtonDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  // About関連
  aboutTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  aboutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    color: '#888',
    fontSize: 13,
  },
  aboutValue: {
    color: '#fff',
    fontSize: 13,
  },
  creditText: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
