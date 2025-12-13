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

        {/* 名前（中央に表示） */}
        <Text style={[styles.enemyName, isDead && styles.deadText]}>
          {enemy.name}
        </Text>
      </LinearGradient>

      {/* ブロックとステータスを敵の下に別行で表示 */}
      {!isDead && (enemy.block > 0 || enemy.statuses.length > 0) && (
        <View style={styles.statusRow}>
          {enemy.block > 0 && (
            <View style={styles.blockBadge}>
              <Text style={styles.blockBadgeText}>🛡️{enemy.block}</Text>
            </View>
          )}
          {enemy.statuses.map((status, i) => (
            <View key={i} style={[styles.statusBadge, {
              backgroundColor: ['strength', 'dexterity', 'regeneration'].includes(status.type)
                ? 'rgba(46, 204, 113, 0.9)'
                : 'rgba(231, 76, 60, 0.9)'
            }]}>
              <Text style={styles.statusBadgeText}>
                {status.type === 'strength' ? '💪' :
                 status.type === 'vulnerable' ? '💔' :
                 status.type === 'weak' ? '😵' :
                 status.type === 'poison' ? '☠️' : '✨'}{status.stacks}
              </Text>
            </View>
          ))}
        </View>
      )}

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
  // ブロックとステータスの行
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
    maxWidth: 140,
  },
  blockBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  blockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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
