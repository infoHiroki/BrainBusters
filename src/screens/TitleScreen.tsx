// タイトル画面
// ゲーム起動時の最初の画面

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loadRunState } from '../store/runStore';

interface TitleScreenProps {
  onContinue: () => void;
  onNewGame: () => void;
  onSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onContinue,
  onNewGame,
  onSettings,
}) => {
  const [hasSaveData, setHasSaveData] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  // セーブデータの確認
  useEffect(() => {
    const checkSaveData = async () => {
      const runState = await loadRunState();
      setHasSaveData(runState !== null);
      // セーブデータがなければ「はじめから」を選択状態に
      if (!runState) {
        setSelectedIndex(0);
      }
    };
    checkSaveData();
  }, []);

  // フェードインアニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // メニュー項目
  const menuItems = hasSaveData
    ? [
        { label: 'つづきから', action: onContinue },
        { label: 'はじめから', action: onNewGame },
        { label: '設定', action: onSettings },
      ]
    : [
        { label: 'はじめから', action: onNewGame },
        { label: '設定', action: onSettings },
      ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* タイトルロゴ */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>BRAIN</Text>
          <Text style={styles.title}>BUSTERS</Text>
          <Text style={styles.subtitle}>概念カードローグライク</Text>
        </View>

        {/* メニュー */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.action}
              onPressIn={() => setSelectedIndex(index)}
            >
              <Text style={styles.cursor}>
                {selectedIndex === index ? '▶' : '　'}
              </Text>
              <Text
                style={[
                  styles.menuText,
                  selectedIndex === index && styles.menuTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Brain Busters</Text>
          <Text style={styles.versionText}>v2.1</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
    textShadowColor: '#6C5CE7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
    letterSpacing: 2,
  },
  menuContainer: {
    alignItems: 'flex-start',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cursor: {
    color: '#FFD700',
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuText: {
    color: '#888',
    fontSize: 20,
    letterSpacing: 2,
  },
  menuTextSelected: {
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#444',
    fontSize: 10,
  },
  versionText: {
    color: '#333',
    fontSize: 10,
    marginTop: 4,
  },
});
