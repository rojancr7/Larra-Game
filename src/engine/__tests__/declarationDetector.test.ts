import { describe, it, expect } from 'vitest';
import { Card } from '../deck';
import { detectEligibleDeclaration } from '../declarationDetector';
import { HandPartition } from '../partition';

describe('Eligible Declaration Detector (THROW button trigger)', () => {
  const emptyPartition: HandPartition = [[], [], [], []];

  it('detects 20-point match victory condition', () => {
    const cards: Card[] = [];
    const dec = detectEligibleDeclaration(cards, emptyPartition, 20);
    expect(dec).not.toBeNull();
    expect(dec?.type).toBe('WIN_20');
  });

  it('detects Round 4 Instant Win sequence (A-2-3-4)', () => {
    const r4Cards: Card[] = [
      { id: 'A_hearts', suit: 'hearts', rank: 'A' },
      { id: '2_hearts', suit: 'hearts', rank: '2' },
      { id: '3_hearts', suit: 'hearts', rank: '3' },
      { id: '4_hearts', suit: 'hearts', rank: '4' },
    ];
    const partition: HandPartition = [[], [], [], r4Cards];
    const dec = detectEligibleDeclaration(r4Cards, partition, 5);
    expect(dec).not.toBeNull();
    expect(dec?.type).toBe('INSTANT_VICTORY');
    expect(dec?.points).toBe(20);
  });

  it('detects Four of a Kind (four same cards of any rank)', () => {
    const cards: Card[] = [
      { id: 'K_hearts', suit: 'hearts', rank: 'K' },
      { id: 'K_diamonds', suit: 'diamonds', rank: 'K' },
      { id: 'K_clubs', suit: 'clubs', rank: 'K' },
      { id: 'K_spades', suit: 'spades', rank: 'K' },
      { id: '2_hearts', suit: 'hearts', rank: '2' },
    ];
    const dec = detectEligibleDeclaration(cards, emptyPartition, 0);
    expect(dec).not.toBeNull();
    expect(dec?.type).toBe('FOUR_OF_A_KIND');
    expect(dec?.title).toContain('K');
  });

  it('detects Six Jute declaration (6 pairs + 1 single)', () => {
    const sixJuteCards: Card[] = [
      { id: '2_h', suit: 'hearts', rank: '2' },
      { id: '2_d', suit: 'diamonds', rank: '2' },
      { id: '3_h', suit: 'hearts', rank: '3' },
      { id: '3_d', suit: 'diamonds', rank: '3' },
      { id: '4_h', suit: 'hearts', rank: '4' },
      { id: '4_d', suit: 'diamonds', rank: '4' },
      { id: '5_h', suit: 'hearts', rank: '5' },
      { id: '5_d', suit: 'diamonds', rank: '5' },
      { id: '6_h', suit: 'hearts', rank: '6' },
      { id: '6_d', suit: 'diamonds', rank: '6' },
      { id: '7_h', suit: 'hearts', rank: '7' },
      { id: '7_d', suit: 'diamonds', rank: '7' },
      { id: '8_h', suit: 'hearts', rank: '8' },
    ];
    const dec = detectEligibleDeclaration(sixJuteCards, emptyPartition, 0);
    expect(dec).not.toBeNull();
    expect(dec?.type).toBe('SIX_JUTE');
    expect(dec?.points).toBe(6);
  });

  it('returns null when no special declaration exists', () => {
    const normalCards: Card[] = [
      { id: '2_h', suit: 'hearts', rank: '2' },
      { id: '5_d', suit: 'diamonds', rank: '5' },
      { id: '8_c', suit: 'clubs', rank: '8' },
    ];
    const dec = detectEligibleDeclaration(normalCards, emptyPartition, 5);
    expect(dec).toBeNull();
  });
});

