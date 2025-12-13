// ヘルプ画面
// ゲームルールと操作説明

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
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
        <Text style={styles.title}>ゲームルール</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* バトルの基本 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>バトルの基本</Text>
          <Text style={styles.text}>
            • 毎ターン手札5枚、エネルギー3を獲得{'\n'}
            • カードを使って敵を倒す{'\n'}
            • 敵のHPを0にすれば勝利{'\n'}
            • 自分のHPが0になると敗北
          </Text>
        </View>

        {/* カードタイプ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カードタイプ</Text>

          <View style={styles.cardTypeRow}>
            <View style={[styles.cardTypeBadge, { backgroundColor: '#E74C3C' }]}>
              <Text style={styles.badgeText}>攻撃</Text>
            </View>
            <Text style={styles.typeDesc}>敵にダメージを与える</Text>
          </View>

          <View style={styles.cardTypeRow}>
            <View style={[styles.cardTypeBadge, { backgroundColor: '#3498DB' }]}>
              <Text style={styles.badgeText}>防御</Text>
            </View>
            <Text style={styles.typeDesc}>ブロックを獲得する</Text>
          </View>

          <View style={styles.cardTypeRow}>
            <View style={[styles.cardTypeBadge, { backgroundColor: '#2ECC71' }]}>
              <Text style={styles.badgeText}>スキル</Text>
            </View>
            <Text style={styles.typeDesc}>ドロー、バフ、回復など</Text>
          </View>
        </View>

        {/* ブロックと防御 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ブロックの仕組み</Text>
          <Text style={styles.text}>
            • 防御カードで「ブロック」を獲得{'\n'}
            • ブロックはダメージを肩代わり{'\n'}
            • ブロックは毎ターン終了時にリセット{'\n'}
            • 例: ブロック5、被ダメージ8 → HP-3
          </Text>
        </View>

        {/* ダメージ計算 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ダメージ計算</Text>
          <Text style={styles.text}>
            基本ダメージ + 筋力 = 最終ダメージ{'\n'}
            {'\n'}
            敵が「脆弱」状態: 被ダメージ+50%{'\n'}
            自分が「弱体」状態: 与ダメージ-25%
          </Text>
        </View>

        {/* ステータス効果 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ステータス効果</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusName}>筋力</Text>
            <Text style={styles.statusDesc}>攻撃ダメージ +スタック数</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusName}>敏捷</Text>
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
            <Text style={[styles.statusName, { color: '#E74C3C' }]}>毒</Text>
            <Text style={styles.statusDesc}>ターン終了時にダメージ</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusName, { color: '#2ECC71' }]}>再生</Text>
            <Text style={styles.statusDesc}>ターン開始時にHP回復</Text>
          </View>
        </View>

        {/* ダンジョン構造 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ダンジョン構造</Text>
          <Text style={styles.text}>
            • 全15階層{'\n'}
            • 5F, 10F, 15F: ボス戦{'\n'}
            • 休憩所: 最大HPの30%回復{'\n'}
            • 勝利するとカード報酬を獲得
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>攻略のコツ</Text>
          <Text style={styles.text}>
            • 防御は大事！ブロックでダメージを防ごう{'\n'}
            • デッキは太らせすぎない（15-20枚が目安）{'\n'}
            • 敵の行動（意図）を見て対応しよう{'\n'}
            • 回復カードを入手したらうまく使おう
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeDesc: {
    color: '#ccc',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusName: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: 'bold',
    width: 50,
    marginRight: 12,
  },
  statusDesc: {
    color: '#ccc',
    fontSize: 14,
  },
  bottomPadding: {
    height: 40,
  },
});
