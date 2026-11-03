import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { createDeck, shuffle, cardLabel, Card } from '../engine/deck';
import {
  HandPartition,
  validatePartition,
} from '../engine/partition';

export default function PartitionScreen() {
  const hand = useMemo(() => {
    const deck = shuffle(createDeck());
    return deck.slice(0, 13);
  }, []);

  const [groups, setGroups] = useState<HandPartition>([
    [],
    [],
    [],
    [],
  ]);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const groupSizes = [3, 3, 3, 4];

  // Remaining cards in the player's hand
  const remainingCards = hand.filter(
    card => !groups.flat().some(
      assigned => assigned.id === card.id
    )
  );

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <Text className="text-3xl font-bold text-center mb-5">
        Larra Game
      </Text>

      {/* Player's remaining cards */}
      <Text className="text-xl font-bold mb-3">
        Your Cards ({remainingCards.length})
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-6">
        {remainingCards.map(card => (
          <Pressable
            key={card.id}
            onPress={() => setSelectedCard(card)}
            className={`p-3 rounded-lg border ${
              selectedCard?.id === card.id
                ? 'bg-blue-500 border-blue-700'
                : 'bg-white border-slate-300'
            }`}
          >
            <Text className="font-bold text-lg">
              {cardLabel(card)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Four groups */}
      <Text className="text-xl font-bold mb-3">
        Groups
      </Text>

      {groups.map((group, index) => (
        <View
          key={index}
          className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-base text-slate-700">
              Group {index + 1} (Max: {groupSizes[index]})
            </Text>
            
            <Pressable
              disabled={
                !selectedCard ||
                group.length >= groupSizes[index]
              }
              onPress={() => {
                if (!selectedCard) return;

                setGroups(previous => {
                  const updated = previous.map(
                    cards => [...cards]
                  ) as HandPartition;

                  updated[index].push(selectedCard);

                  return updated;
                });

                setSelectedCard(null);
              }}
              className={`rounded-lg px-3 py-2 ${
                !selectedCard || group.length >= groupSizes[index]
                  ? 'bg-slate-300'
                  : 'bg-blue-600'
              }`}
            >
              <Text className="text-white font-bold text-sm">
                Add Card
              </Text>
            </Pressable>
          </View>

          {/* Cards currently in this group */}
          <View className="flex-row flex-wrap gap-2">
            {group.length === 0 ? (
              <Text className="text-slate-400 italic text-sm">
                Empty group
              </Text>
            ) : (
              group.map(card => (
                <Pressable
                  key={card.id}
                  onPress={() => {
                    setGroups(previous => {
                      const updated = previous.map(
                        cards => [...cards]
                      ) as HandPartition;

                      updated[index] = updated[index].filter(
                        item => item.id !== card.id
                      );

                      return updated;
                    });
                  }}
                  className="bg-blue-100 p-2 rounded border border-blue-300"
                >
                  <Text className="font-bold text-base text-blue-900">
                    {cardLabel(card)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      ))}

      <Text className="text-center font-bold mt-2 text-slate-700">
        Assigned: {groups.flat().length}/13
      </Text>

      <Text className={`text-center font-bold mt-2 mb-8 text-lg ${
        validatePartition(hand, groups) ? 'text-green-600' : 'text-amber-600'
      }`}>
        {validatePartition(hand, groups)
          ? 'Partition Complete!'
          : 'Partition Incomplete'}
      </Text>
    </ScrollView>
  );
}