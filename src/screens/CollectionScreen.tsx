import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlayerData,
  getCollectionRate,
  getRequiredExp,
  getLevelBonus,
} from '../store/playerStore';
import { Concept, concepts, getRarityColor } from '../data/concepts';
import { ConceptCard } from '../components/ConceptCard';
import { getCategoryGradient, getCategoryName } from '../utils/battle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 50) / 4; // 4列に変更

interface CollectionScreenProps {
  playerData: PlayerData;
  onBack: () => void;
}

type CategoryType = 'all' | Concept['category'];

const categories: { key: CategoryType; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: 'quote', label: '発言' },
  { key: 'abstract', label: '抽象' },
  { key: 'emotion', label: '感情' },
  { key: 'action', label: '行動' },
  { key: 'philosophy', label: '哲学' },
  { key: 'science', label: '科学' },
  { key: 'culture', label: '文化' },
  { key: 'modern', label: '現代' },
  { key: 'person', label: '人物' },
  { key: 'mythology', label: '神話' },
  { key: 'psychology', label: '心理' },
  { key: 'society', label: '社会' },
  { key: 'literature', label: '文学' },
];

export const CollectionScreen: React.FC<CollectionScreenProps> = ({
  playerData,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedConcept, setSelectedConcept] = useState<{
    concept: Concept;
    level: number;
    exp: number;
  } | null>(null);

  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const collectionRate = getCollectionRate(playerData);

  // 所持概念のIDセット
  const ownedIds = new Set(playerData.ownedConcepts.map(oc => oc.conceptId));

  // フィルタリングされた概念
  const filteredConcepts = selectedCategory === 'all'
    ? concepts
    : concepts.filter(c => c.category === selectedCategory);

  // カテゴリ内の所持数
  const getCategoryOwnedCount = (category: CategoryType) => {
    if (category === 'all') {
      return playerData.ownedConcepts.length;
    }
    return concepts.filter(c => c.category === category && ownedIds.has(c.id)).length;
  };

  const getCategoryTotalCount = (category: CategoryType) => {
    if (category === 'all') {
      return concepts.length;
    }
    return concepts.filter(c => c.category === category).length;
  };

  const handleCardPress = (concept: Concept) => {
    const owned = playerData.ownedConcepts.find(oc => oc.conceptId === concept.id);
    if (owned) {
      setSelectedConcept({
        concept,
        level: owned.level,
        exp: owned.exp,
      });

      // アニメーション
      modalScale.setValue(0.8);
      modalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedConcept(null);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3e', '#0a0a1a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>概念図鑑</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {collectionRate.owned}/{collectionRate.total} ({collectionRate.percentage}%)
          </Text>
        </View>
      </View>

      {/* カテゴリタブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.key;
          const ownedCount = getCategoryOwnedCount(cat.key);
          const totalCount = getCategoryTotalCount(cat.key);

          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tab, isSelected && styles.tabSelected]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {cat.label}
              </Text>
              <Text style={[styles.tabCount, isSelected && styles.tabCountSelected]}>
                {ownedCount}/{totalCount}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* コレクションリスト */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsGrid}>
          {filteredConcepts.map(concept => {
            const isOwned = ownedIds.has(concept.id);
            const owned = playerData.ownedConcepts.find(
              oc => oc.conceptId === concept.id
            );

            return (
              <TouchableOpacity
                key={concept.id}
                style={[
                  styles.miniCard,
                  !isOwned && styles.lockedCard,
                ]}
                onPress={() => isOwned && handleCardPress(concept)}
                disabled={!isOwned}
                activeOpacity={0.7}
              >
                {isOwned ? (
                  <LinearGradient
                    colors={getCategoryGradient(concept.category)}
                    style={styles.miniCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.miniCardName} numberOfLines={2}>
                      {concept.name}
                    </Text>
                    <Text style={[styles.miniCardLevel, { color: getRarityColor(concept.rarity) }]}>
                      {owned?.level || 1}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.lockedContent}>
                    <Text style={styles.lockIcon}>?</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 詳細モーダル */}
      {selectedConcept && (
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: modalOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={closeModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.detailModal,
              { transform: [{ scale: modalScale }] },
            ]}
          >
            {/* バトルと同じConceptCard */}
            <ConceptCard
              concept={selectedConcept.concept}
              power={selectedConcept.concept.basePower + getLevelBonus(selectedConcept.level)}
            />

            {/* レベル情報 */}
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>
                Lv.{selectedConcept.level} ({selectedConcept.exp}/{getRequiredExp(selectedConcept.level)} EXP)
              </Text>
            </View>

            {/* 閉じるボタン */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statsText: {
    color: '#888',
    fontSize: 14,
  },
  tabContainer: {
    maxHeight: 50,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextSelected: {
    color: '#fff',
  },
  tabCount: {
    color: '#555',
    fontSize: 9,
    marginTop: 2,
  },
  tabCountSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  miniCardGradient: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardName: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  miniCardLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedCard: {
    backgroundColor: '#1a1a1a',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  detailModal: {
    alignItems: 'center',
  },
  levelInfo: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  closeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
