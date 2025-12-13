// ラン画面（統括）
// 冒険全体の流れを管理

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RunState, Card, Relic, CardInstance, GAME_CONFIG } from '../types/game';
import { BattleScreen } from './BattleScreen';
import { RewardScreen } from './RewardScreen';
import { BattleCard } from '../components/BattleCard';
import {
  startNewRun,
  loadRunState,
  clearRunState,
  advanceFloor,
  addCardToDeck,
  addRelic,
  updateGold,
  healPlayer,
  upgradeCardInDeck,
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCardForUpgrade, setSelectedCardForUpgrade] = useState<CardInstance | null>(null);

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
    // AsyncStorageから最新状態を取得（競合状態を防ぐ）
    const latestState = await loadRunState();
    if (!latestState) return;

    // 最終フロアクリア
    if (latestState.floor >= GAME_CONFIG.MAX_FLOOR) {
      await handleRunEnd(true, latestState);
      return;
    }

    // 次の階へ
    const updated = await advanceFloor(latestState);
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
    // AsyncStorageから最新状態を取得
    const latestState = await loadRunState();
    if (!latestState) return;

    const healAmount = Math.floor(latestState.maxHp * 0.3);
    const updated = await healPlayer(latestState, healAmount);
    setRunState(updated);

    // 次の階へ（updated状態は既にAsyncStorageに保存済み）
    await handleProceed();
  };

  // カード強化を選択
  const handleUpgradeSelect = (cardInstance: CardInstance) => {
    setSelectedCardForUpgrade(cardInstance);
  };

  // カード強化を確定
  const handleUpgradeConfirm = async () => {
    if (!runState || !selectedCardForUpgrade) return;

    const updated = await upgradeCardInDeck(runState, selectedCardForUpgrade.instanceId);
    setRunState(updated);
    setShowUpgradeModal(false);
    setSelectedCardForUpgrade(null);

    // 次の階へ
    await handleProceed();
  };

  // 強化モーダルを閉じる
  const handleUpgradeCancel = () => {
    setShowUpgradeModal(false);
    setSelectedCardForUpgrade(null);
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
    const upgradableCards = runState.deck.filter(c => !c.card.upgraded);
    const hasUpgradableCards = upgradableCards.length > 0;

    return (
      <View style={styles.screenContainer}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />
        {/* ヘッダー */}
        <View style={styles.screenHeader}>
          <Text style={styles.phaseTitle}>休憩所</Text>
          <Text style={styles.floorBadge}>{runState.floor}F</Text>
          <Text style={styles.hpDisplay}>❤️ {runState.hp}/{runState.maxHp}</Text>
        </View>
        {/* コンテンツ */}
        <View style={styles.screenContent}>
          <Text style={styles.restEmoji}>🔥</Text>
          <Text style={styles.restChoiceTitle}>どちらを選びますか？</Text>

          {/* 選択肢カード */}
          <View style={styles.restChoices}>
            {/* 回復選択 */}
            <TouchableOpacity style={styles.restChoiceCard} onPress={handleRest}>
              <Text style={styles.choiceEmoji}>💤</Text>
              <Text style={styles.choiceTitle}>休息</Text>
              <Text style={styles.choiceDescription}>
                HPを{Math.floor(runState.maxHp * 0.3)}回復
              </Text>
              <Text style={styles.choiceHint}>
                ({runState.hp} → {Math.min(runState.maxHp, runState.hp + healAmount)})
              </Text>
            </TouchableOpacity>

            {/* 強化選択 */}
            <TouchableOpacity
              style={[styles.restChoiceCard, !hasUpgradableCards && styles.choiceDisabled]}
              onPress={() => hasUpgradableCards && setShowUpgradeModal(true)}
              disabled={!hasUpgradableCards}
            >
              <Text style={styles.choiceEmoji}>⚒️</Text>
              <Text style={styles.choiceTitle}>鍛錬</Text>
              <Text style={styles.choiceDescription}>
                カードを1枚強化
              </Text>
              <Text style={styles.choiceHint}>
                {hasUpgradableCards
                  ? `(${upgradableCards.length}枚強化可)`
                  : '(強化可能なカードなし)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* フッター */}
        <View style={styles.screenFooter}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleProceed}>
            <Text style={styles.secondaryButtonText}>何もせずに進む</Text>
          </TouchableOpacity>
        </View>

        {/* カード強化モーダル */}
        <Modal
          visible={showUpgradeModal}
          transparent
          animationType="fade"
          onRequestClose={handleUpgradeCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upgradeModal}>
              <Text style={styles.modalTitle}>⚒️ 強化するカードを選択</Text>
              <Text style={styles.modalSubtitle}>
                カードをタップして選択 → 「強化する」で確定
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.upgradeCardList}
              >
                {upgradableCards.map((cardInstance) => (
                  <TouchableOpacity
                    key={cardInstance.instanceId}
                    style={[
                      styles.upgradeCardWrapper,
                      selectedCardForUpgrade?.instanceId === cardInstance.instanceId && styles.upgradeCardSelected,
                    ]}
                    onPress={() => handleUpgradeSelect(cardInstance)}
                  >
                    <BattleCard
                      card={cardInstance.card}
                      selected={selectedCardForUpgrade?.instanceId === cardInstance.instanceId}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 選択中のカードの強化プレビュー */}
              {selectedCardForUpgrade && (
                <View style={styles.upgradePreview}>
                  <Text style={styles.previewTitle}>強化後</Text>
                  <Text style={styles.previewName}>
                    {selectedCardForUpgrade.card.name} → {selectedCardForUpgrade.card.name}+
                  </Text>
                  <Text style={styles.previewEffect}>
                    効果値 +25%、稀にコスト-1
                  </Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={handleUpgradeCancel}>
                  <Text style={styles.modalCancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, !selectedCardForUpgrade && styles.buttonDisabled]}
                  onPress={handleUpgradeConfirm}
                  disabled={!selectedCardForUpgrade}
                >
                  <LinearGradient
                    colors={selectedCardForUpgrade ? ['#f39c12', '#e67e22'] : ['#444', '#333']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalConfirmText}>強化する</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ショップ画面（簡易版）
  if (phase === 'shop') {
    return (
      <View style={styles.screenContainer}>
        <LinearGradient
          colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
          style={StyleSheet.absoluteFill}
        />
        {/* ヘッダー */}
        <View style={styles.screenHeader}>
          <Text style={styles.phaseTitle}>ショップ</Text>
          <Text style={styles.floorBadge}>{runState.floor}F</Text>
        </View>
        {/* コンテンツ */}
        <View style={styles.screenContent}>
          <Text style={styles.shopEmoji}>🏪</Text>
          <View style={styles.shopInfo}>
            <Text style={styles.goldDisplay}>💰 {runState.gold} ゴールド</Text>
            <Text style={styles.shopText}>
              （ショップ機能は開発中です）
            </Text>
          </View>
        </View>
        {/* フッター */}
        <View style={styles.screenFooter}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleProceed}>
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
      <View style={styles.screenContainer}>
        <LinearGradient
          colors={victory ? ['#1a3a1a', '#0a2a0a', '#1a3a1a'] : ['#3a1a1a', '#2a0a0a', '#3a1a1a']}
          style={StyleSheet.absoluteFill}
        />
        {/* ヘッダー */}
        <View style={styles.screenHeader}>
          <Text style={[styles.resultTitle, { color: victory ? '#2ecc71' : '#e74c3c' }]}>
            {victory ? '🎉 勝利！' : '💀 敗北...'}
          </Text>
        </View>
        {/* コンテンツ */}
        <View style={styles.screenContent}>
          <View style={styles.resultStats}>
            <Text style={styles.statRow}>📍 到達階: {runState.floor}F</Text>
            <Text style={styles.statRow}>💰 獲得ゴールド: {runState.gold}</Text>
            <Text style={styles.statRow}>🃏 デッキ枚数: {runState.deck.length}</Text>
            <Text style={styles.statRow}>🏆 レリック数: {runState.relics.length}</Text>
          </View>
        </View>
        {/* フッター */}
        <View style={styles.screenFooter}>
          <TouchableOpacity style={styles.primaryButton} onPress={onExit}>
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
  // 統一レイアウト用スタイル
  screenContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  screenHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  screenFooter: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
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
  floorBadge: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
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
  },
  restEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  shopEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  restInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  restText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  healText: {
    color: '#e74c3c',
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentHpText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  hpDisplay: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  restChoiceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  restChoices: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  restChoiceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 140,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  choiceEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  choiceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  choiceDescription: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  choiceHint: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeModal: {
    backgroundColor: '#1a1a3e',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  upgradeCardList: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  upgradeCardWrapper: {
    marginHorizontal: 4,
  },
  upgradeCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  upgradePreview: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  previewTitle: {
    color: '#f39c12',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewEffect: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  shopInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  goldDisplay: {
    color: '#f1c40f',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  shopText: {
    color: '#888',
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
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
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  resultStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 16,
    minWidth: 250,
  },
  statRow: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 6,
  },
  exitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
