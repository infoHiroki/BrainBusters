import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getRandomConcept, Concept } from './src/data/concepts';
import { battle, BattleResult } from './src/utils/battle';
import { ConceptCard } from './src/components/ConceptCard';
import { GachaScreen } from './src/screens/GachaScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import {
  PlayerData,
  loadPlayerData,
  updateAfterBattle,
  getRandomOwnedConcept,
  getLevelBonus,
  getCollectionRate,
} from './src/store/playerStore';

type Screen = 'home' | 'gacha' | 'collection';
type GameState = 'ready' | 'battling' | 'result';

// レベルボーナスを適用したバトル
const battleWithLevel = (
  playerConcept: Concept,
  playerLevel: number,
  enemyConcept: Concept
): BattleResult => {
  const result = battle(playerConcept, enemyConcept);

  // プレイヤーにレベルボーナスを適用
  const levelBonus = getLevelBonus(playerLevel);
  const adjustedPlayerPower = Math.min(100, result.playerPower + levelBonus);

  // 勝敗を再計算
  let winner: 'player' | 'enemy' | 'draw';
  if (adjustedPlayerPower > result.enemyPower) {
    winner = 'player';
  } else if (result.enemyPower > adjustedPlayerPower) {
    winner = 'enemy';
  } else {
    winner = 'draw';
  }

  return {
    ...result,
    playerPower: adjustedPlayerPower,
    winner,
    powerDifference: Math.abs(adjustedPlayerPower - result.enemyPower),
  };
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [gameState, setGameState] = useState<GameState>('ready');
  const [result, setResult] = useState<BattleResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const playerScale = useRef(new Animated.Value(0)).current;
  const enemyScale = useRef(new Animated.Value(0)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0.5)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.5)).current;

  // プレイヤーデータを読み込む
  useEffect(() => {
    const init = async () => {
      const data = await loadPlayerData();
      setPlayerData(data);
      setIsLoading(false);
    };
    init();
  }, []);

  const startBattle = async () => {
    if (!playerData) return;

    setGameState('battling');
    setEarnedPoints(null);

    // プレイヤーの概念をランダムに選択
    let playerConcept: Concept;
    let playerLevel = 1;

    const random = getRandomOwnedConcept(playerData);
    if (random) {
      playerConcept = random.concept;
      playerLevel = random.owned.level;
    } else {
      playerConcept = getRandomConcept();
    }

    const enemyConcept = getRandomConcept();
    const battleResult = battleWithLevel(playerConcept, playerLevel, enemyConcept);
    setResult(battleResult);

    // アニメーションリセット
    playerScale.setValue(0);
    enemyScale.setValue(0);
    vsOpacity.setValue(0);
    vsScale.setValue(0.5);
    resultOpacity.setValue(0);
    resultScale.setValue(0.5);

    // アニメーション
    Animated.sequence([
      Animated.spring(playerScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(vsOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(vsScale, {
          toValue: 1,
          friction: 4,
          tension: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(enemyScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(resultScale, {
          toValue: 1,
          friction: 4,
          tension: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      setGameState('result');

      const won = battleResult.winner === 'player';
      const newStreak = won ? streak + 1 : 0;
      setStreak(newStreak);

      // ポイント計算
      const points = won ? 10 + newStreak * 2 : 3;
      setEarnedPoints(points);

      // プレイヤーデータを更新
      const newData = await updateAfterBattle(
        playerData,
        won,
        newStreak,
        playerConcept.id
      );
      setPlayerData(newData);
    });
  };

  const getResultMessage = () => {
    if (!result) return '';
    switch (result.winner) {
      case 'player':
        return `勝利!`;
      case 'enemy':
        return `敗北`;
      case 'draw':
        return '引き分け';
    }
  };

  const getResultColor = () => {
    if (!result) return '#fff';
    switch (result.winner) {
      case 'player':
        return '#4CAF50';
      case 'enemy':
        return '#f44336';
      case 'draw':
        return '#FFC107';
    }
  };

  // ローディング中
  if (isLoading || !playerData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // ガチャ画面
  if (currentScreen === 'gacha') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <GachaScreen
          playerData={playerData}
          onGachaPulled={setPlayerData}
          onBack={() => setCurrentScreen('home')}
        />
      </SafeAreaView>
    );
  }

  // 図鑑画面
  if (currentScreen === 'collection') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <CollectionScreen
          playerData={playerData}
          onBack={() => setCurrentScreen('home')}
        />
      </SafeAreaView>
    );
  }

  // ホーム画面（バトル）
  const collectionRate = getCollectionRate(playerData);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>概念バトル</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ポイント</Text>
              <Text style={styles.statValue}>{playerData.points}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>戦績</Text>
              <Text style={styles.statValue}>
                <Text style={styles.winScore}>{playerData.totalWins}</Text>
                {' - '}
                <Text style={styles.loseScore}>{playerData.totalLosses}</Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>収集</Text>
              <Text style={styles.statValue}>{collectionRate.percentage}%</Text>
            </View>
          </View>
          {streak >= 2 && (
            <Text style={styles.streakText}>{streak}連勝中!</Text>
          )}
        </View>

        {/* メインエリア */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {gameState === 'ready' ? (
            <View style={styles.readyContainer}>
              <Text style={styles.readyText}>
                ボタンを押して{'\n'}バトル開始
              </Text>
              <Text style={styles.hintText}>
                {playerData.ownedConcepts.length}種の概念を所持
              </Text>
            </View>
          ) : (
            result && (
              <View style={styles.battleContainer}>
                {/* 敵カード */}
                <View style={styles.cardSection}>
                  <Text style={styles.playerLabel}>ENEMY</Text>
                  <ConceptCard
                    concept={result.enemyConcept}
                    power={result.enemyPower}
                    isWinner={result.winner === 'enemy'}
                    isLoser={result.winner === 'player'}
                    showResult={gameState === 'result'}
                    scale={enemyScale}
                  />
                </View>

                {/* VS */}
                <Animated.View
                  style={[
                    styles.vsContainer,
                    {
                      opacity: vsOpacity,
                      transform: [{ scale: vsScale }],
                    },
                  ]}
                >
                  <Text style={styles.vsText}>VS</Text>
                </Animated.View>

                {/* プレイヤーカード */}
                <View style={styles.cardSection}>
                  <Text style={styles.playerLabel}>YOU</Text>
                  <ConceptCard
                    concept={result.playerConcept}
                    power={result.playerPower}
                    isWinner={result.winner === 'player'}
                    isLoser={result.winner === 'enemy'}
                    showResult={gameState === 'result'}
                    scale={playerScale}
                  />
                </View>

                {/* 結果表示 */}
                {gameState === 'result' && (
                  <Animated.View
                    style={[
                      styles.resultContainer,
                      {
                        opacity: resultOpacity,
                        transform: [{ scale: resultScale }],
                      },
                    ]}
                  >
                    <Text style={[styles.resultText, { color: getResultColor() }]}>
                      {getResultMessage()}
                    </Text>
                    {earnedPoints && (
                      <Text style={styles.pointsEarned}>+{earnedPoints} pt</Text>
                    )}
                  </Animated.View>
                )}
              </View>
            )
          )}
        </ScrollView>

        {/* ボタン群 */}
        <View style={styles.buttonContainer}>
          {/* メニューボタン */}
          <View style={styles.menuButtons}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setCurrentScreen('gacha')}
            >
              <Text style={styles.menuButtonText}>召喚</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setCurrentScreen('collection')}
            >
              <Text style={styles.menuButtonText}>図鑑</Text>
            </TouchableOpacity>
          </View>

          {/* バトルボタン */}
          <TouchableOpacity
            style={[
              styles.battleButton,
              gameState === 'battling' && styles.buttonDisabled,
            ]}
            onPress={startBattle}
            disabled={gameState === 'battling'}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                gameState === 'battling'
                  ? ['#444', '#333']
                  : ['#6C5CE7', '#5849BE']
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>
                {gameState === 'ready' ? 'バトル開始' : 'もう一度'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  winScore: {
    color: '#4CAF50',
  },
  loseScore: {
    color: '#f44336',
  },
  streakText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyText: {
    color: '#888',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 34,
  },
  hintText: {
    color: '#444',
    fontSize: 12,
    marginTop: 16,
  },
  battleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  cardSection: {
    alignItems: 'center',
  },
  playerLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 3,
  },
  vsContainer: {
    marginVertical: 12,
  },
  vsText: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsEarned: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  buttonContainer: {
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  menuButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  menuButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C5CE7',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  battleButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 16,
  },
  buttonDisabled: {
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
