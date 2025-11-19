import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getRandomConcept, concepts } from './src/data/concepts';
import { battle, BattleResult } from './src/utils/battle';
import { ConceptCard } from './src/components/ConceptCard';

type GameState = 'ready' | 'battling' | 'result';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [result, setResult] = useState<BattleResult | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [streak, setStreak] = useState(0);

  const playerScale = useRef(new Animated.Value(0)).current;
  const enemyScale = useRef(new Animated.Value(0)).current;
  const vsOpacity = useRef(new Animated.Value(0)).current;
  const vsScale = useRef(new Animated.Value(0.5)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.5)).current;

  const startBattle = () => {
    setGameState('battling');

    const playerConcept = getRandomConcept();
    const enemyConcept = getRandomConcept();
    const battleResult = battle(playerConcept, enemyConcept);
    setResult(battleResult);

    // リセット
    playerScale.setValue(0);
    enemyScale.setValue(0);
    vsOpacity.setValue(0);
    vsScale.setValue(0.5);
    resultOpacity.setValue(0);
    resultScale.setValue(0.5);

    // アニメーション（自分のカードが先に表示）
    Animated.sequence([
      // プレイヤーカード (下から先に表示)
      Animated.spring(playerScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      // VS
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
      // 敵カード (上に後から表示)
      Animated.spring(enemyScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      // 結果
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
    ]).start(() => {
      setGameState('result');

      if (battleResult.winner === 'player') {
        setWins((w) => w + 1);
        setStreak((s) => s + 1);
      } else if (battleResult.winner === 'enemy') {
        setLosses((l) => l + 1);
        setStreak(0);
      }
    });
  };

  const getResultMessage = () => {
    if (!result) return '';
    switch (result.winner) {
      case 'player':
        return `勝利! +${result.powerDifference}`;
      case 'enemy':
        return `敗北 -${result.powerDifference}`;
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
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>
              <Text style={styles.winScore}>{wins}勝</Text>
              {' - '}
              <Text style={styles.loseScore}>{losses}敗</Text>
            </Text>
            {streak >= 2 && (
              <Text style={styles.streakText}>{streak}連勝中!</Text>
            )}
          </View>
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
                ボタンを押して{'\n'}概念を召喚せよ
              </Text>
              <Text style={styles.hintText}>
                {concepts.length}種の概念が戦いを待っている
              </Text>
            </View>
          ) : (
            result && (
              <View style={styles.battleContainer}>
                {/* 敵カード (上) */}
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

                {/* プレイヤーカード (下) */}
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
                  </Animated.View>
                )}
              </View>
            )
          )}
        </ScrollView>

        {/* バトルボタン */}
        <View style={styles.buttonContainer}>
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
                {gameState === 'ready' ? '概念を召喚' : 'もう一度'}
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
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  score: {
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
    marginTop: 4,
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
  buttonContainer: {
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
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
