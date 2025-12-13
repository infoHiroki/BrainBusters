// 敵表示コンポーネント
// バトル中の敵を表示

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Enemy } from '../types/game';
import { getIntentDescription, getStatusName } from '../utils/cardEffects';

interface EnemyDisplayProps {
  enemy: Enemy;
  index: number;
  isTargeted?: boolean;
  onPress?: () => void;
  shakeAnim?: Animated.Value;
}

export const EnemyDisplay: React.FC<EnemyDisplayProps> = ({
  enemy,
  index,
  isTargeted = false,
  onPress,
  shakeAnim,
}) => {
  const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
  const isDead = enemy.hp <= 0;

  const getIntentIcon = () => {
    switch (enemy.intent.type) {
      case 'attack':
        return '⚔️';
      case 'defend':
        return '🛡️';
      case 'buff':
        return '⬆️';
      case 'debuff':
        return '⬇️';
      default:
        return '❓';
    }
  };

  const getHpBarColor = (): [string, string] => {
    if (hpPercentage > 60) return ['#27ae60', '#2ecc71'];
    if (hpPercentage > 30) return ['#f39c12', '#f1c40f'];
    return ['#c0392b', '#e74c3c'];
  };

  const content = (
    <View style={[
      styles.container,
      isDead && styles.containerDead,
    ]}>
      {/* ターゲット選択中の表示 */}
      {isTargeted && !isDead && (
        <View style={styles.targetIndicator}>
          <Text style={styles.targetText}>▼ タップで攻撃</Text>
        </View>
      )}

      {/* 行動予告 */}
      {!isDead && !isTargeted && (
        <View style={styles.intentContainer}>
          <Text style={styles.intentIcon}>{getIntentIcon()}</Text>
          <Text style={styles.intentText}>
            {getIntentDescription(enemy.intent)}
          </Text>
        </View>
      )}

      {/* 敵本体 */}
      <LinearGradient
        colors={isDead ? ['#333', '#222'] : enemy.isBoss ? ['#4a1a4a', '#2a0a2a'] : ['#3a2a2a', '#1a1a1a']}
        style={[
          styles.enemyBody,
          isTargeted && !isDead && styles.enemyBodyTargeted,
        ]}
      >
        {/* ボスマーク */}
        {enemy.isBoss && !isDead && (
          <View style={styles.bossMarker}>
            <Text style={styles.bossText}>BOSS</Text>
          </View>
        )}

        {/* エリートマーク */}
        {enemy.isElite && !isDead && (
          <View style={styles.eliteMarker}>
            <Text style={styles.eliteText}>ELITE</Text>
          </View>
        )}

        {/* 名前 */}
        <Text style={[styles.enemyName, isDead && styles.deadText]}>
          {enemy.name}
        </Text>

        {/* ブロック */}
        {enemy.block > 0 && !isDead && (
          <View style={styles.blockContainer}>
            <Text style={styles.blockText}>🛡️ {enemy.block}</Text>
          </View>
        )}

        {/* ステータス効果 */}
        {enemy.statuses.length > 0 && !isDead && (
          <View style={styles.statusContainer}>
            {enemy.statuses.slice(0, 3).map((status, i) => (
              <View key={i} style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {getStatusName(status.type)} {status.stacks}
                </Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* HPバー */}
      <View style={styles.hpBarContainer}>
        <View style={styles.hpBarBackground}>
          <LinearGradient
            colors={isDead ? ['#333', '#333'] : getHpBarColor()}
            style={[styles.hpBarFill, { width: `${hpPercentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.hpText}>
          {enemy.hp} / {enemy.maxHp}
        </Text>
      </View>
    </View>
  );

  if (shakeAnim) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDead || !onPress}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [
              {
                translateX: shakeAnim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -5, 5, -5, 0],
                }),
              },
            ],
          }}
        >
          {content}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDead || !onPress}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  containerDead: {
    opacity: 0.4,
  },
  targetIndicator: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  targetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  intentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  intentIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  intentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  enemyBody: {
    width: 140,
    height: 100,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#666',
  },
  enemyBodyTargeted: {
    borderColor: '#e74c3c',
    borderWidth: 4,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  bossMarker: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#8B0000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bossText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eliteMarker: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#DAA520',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eliteText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  enemyName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deadText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  blockContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  statusBadge: {
    backgroundColor: 'rgba(155, 89, 182, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    margin: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
  },
  hpBarContainer: {
    width: 140,
    marginTop: 6,
    alignItems: 'center',
  },
  hpBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
});
