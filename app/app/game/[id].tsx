import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { GameScreen } from '../../components/game/GameScreen';
import { GifSearch } from '../../components/game/GifSearch';
import { useGame } from '../../components/game/GameContext';

export default function GamePage() {
  const { id, playerId, isJudge } = useLocalSearchParams();
  const { gameState } = useGame();

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText style={styles.gameId}>Game ID: {id}</ThemedText>
          <ThemedText style={styles.role}>
            You are the {isJudge === 'true' ? 'Judge' : 'Player'}
          </ThemedText>
        </View>

        <View style={styles.playerList}>
          <ThemedText style={styles.sectionTitle}>Players:</ThemedText>
          {gameState.players.map((player) => (
            <View key={player.id} style={styles.playerItem}>
              <ThemedText style={styles.playerName}>
                {player.name} {player.id === gameState.judgePlayerId && '(Judge)'}
              </ThemedText>
              <ThemedText style={styles.playerScore}>
                Score: {player.score}
              </ThemedText>
            </View>
          ))}
        </View>

        <GameScreen />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  gameId: {
    fontSize: 16,
    marginBottom: 8,
  },
  role: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerList: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    fontSize: 16,
  },
  playerScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 