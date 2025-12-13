/**
 * バトルロジックのテスト
 * - 再生バフの処理
 * - ステータス効果の減少
 */

type StatusEffect = {
  type: string;
  stacks: number;
  duration?: number;
};

// 再生バフ処理のシミュレーション
const processRegenerationBuff = (
  hp: number,
  maxHp: number,
  playerStatuses: StatusEffect[]
): { newHp: number; newStatuses: StatusEffect[]; healAmount: number } => {
  const regenStatus = playerStatuses.find(s => s.type === 'regeneration');

  if (!regenStatus || regenStatus.stacks <= 0) {
    return { newHp: hp, newStatuses: playerStatuses, healAmount: 0 };
  }

  const healAmount = regenStatus.stacks;
  const newHp = Math.min(maxHp, hp + healAmount);

  // ステータスの更新
  const newStatuses = playerStatuses
    .map(s => {
      if (s.type === 'regeneration') {
        if (s.duration && s.duration > 1) {
          return { ...s, duration: s.duration - 1 };
        } else {
          return { ...s, stacks: s.stacks - 1 };
        }
      }
      return s;
    })
    .filter(s => s.stacks > 0);

  return { newHp, newStatuses, healAmount };
};

describe('再生バフの処理', () => {
  test('再生バフでHPが回復する', () => {
    const hp = 50;
    const maxHp = 100;
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 5 },
    ];

    const result = processRegenerationBuff(hp, maxHp, statuses);

    expect(result.newHp).toBe(55);
    expect(result.healAmount).toBe(5);
  });

  test('回復量はmaxHpを超えない', () => {
    const hp = 98;
    const maxHp = 100;
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 10 },
    ];

    const result = processRegenerationBuff(hp, maxHp, statuses);

    expect(result.newHp).toBe(100);
    expect(result.healAmount).toBe(10);
  });

  test('再生バフがない場合は何もしない', () => {
    const hp = 50;
    const maxHp = 100;
    const statuses: StatusEffect[] = [
      { type: 'strength', stacks: 3 },
    ];

    const result = processRegenerationBuff(hp, maxHp, statuses);

    expect(result.newHp).toBe(50);
    expect(result.healAmount).toBe(0);
  });

  test('再生バフのスタックが減少する', () => {
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 3 },
    ];

    const result = processRegenerationBuff(50, 100, statuses);

    expect(result.newStatuses).toHaveLength(1);
    expect(result.newStatuses[0].stacks).toBe(2);
  });

  test('スタックが0になると再生バフが消える', () => {
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 1 },
    ];

    const result = processRegenerationBuff(50, 100, statuses);

    expect(result.newStatuses).toHaveLength(0);
  });

  test('durationがある場合はdurationが減少する', () => {
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 5, duration: 3 },
    ];

    const result = processRegenerationBuff(50, 100, statuses);

    expect(result.newStatuses).toHaveLength(1);
    expect(result.newStatuses[0].stacks).toBe(5);
    expect(result.newStatuses[0].duration).toBe(2);
  });

  test('他のステータスは影響を受けない', () => {
    const statuses: StatusEffect[] = [
      { type: 'regeneration', stacks: 2 },
      { type: 'strength', stacks: 3 },
      { type: 'dexterity', stacks: 1 },
    ];

    const result = processRegenerationBuff(50, 100, statuses);

    const strength = result.newStatuses.find(s => s.type === 'strength');
    const dexterity = result.newStatuses.find(s => s.type === 'dexterity');

    expect(strength?.stacks).toBe(3);
    expect(dexterity?.stacks).toBe(1);
  });
});

describe('ダメージ計算', () => {
  // 筋力によるダメージ増加
  const calculateDamage = (baseDamage: number, strength: number): number => {
    return baseDamage + strength;
  };

  // 脆弱によるダメージ増加
  const applyVulnerable = (damage: number, isVulnerable: boolean): number => {
    return isVulnerable ? Math.floor(damage * 1.5) : damage;
  };

  // 弱体によるダメージ減少
  const applyWeak = (damage: number, isWeak: boolean): number => {
    return isWeak ? Math.floor(damage * 0.75) : damage;
  };

  test('筋力でダメージが増加する', () => {
    expect(calculateDamage(10, 3)).toBe(13);
    expect(calculateDamage(10, 0)).toBe(10);
  });

  test('脆弱で被ダメージが50%増加する', () => {
    expect(applyVulnerable(10, true)).toBe(15);
    expect(applyVulnerable(10, false)).toBe(10);
  });

  test('弱体で与ダメージが25%減少する', () => {
    expect(applyWeak(10, true)).toBe(7);
    expect(applyWeak(10, false)).toBe(10);
  });
});

describe('ブロック計算', () => {
  // 敏捷によるブロック増加
  const calculateBlock = (baseBlock: number, dexterity: number): number => {
    return baseBlock + dexterity;
  };

  // 衰弱によるブロック減少
  const applyFrail = (block: number, isFrail: boolean): number => {
    return isFrail ? Math.floor(block * 0.75) : block;
  };

  test('敏捷でブロックが増加する', () => {
    expect(calculateBlock(10, 2)).toBe(12);
  });

  test('衰弱でブロックが25%減少する', () => {
    expect(applyFrail(10, true)).toBe(7);
    expect(applyFrail(10, false)).toBe(10);
  });
});
