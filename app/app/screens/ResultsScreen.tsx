import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, Game, Player } from '../services/api';

export default function ResultsScreen() {
  const { roomCode, playerId } = useLocalSearchParams<{ roomCode: string; playerId: string }>();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`${api.API_URL}/games/${roomCode}`);
        if (!response.ok) throw new Error('Failed to fetch game');
        const gameData = await response.json();
        setGame(gameData);
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };

    fetchGame();
  }, [roomCode]);

  const startNewGame = () => {
    router.push('/');
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={[
      styles.playerCard,
      game?.winner_id === item.id && styles.winnerCard
    ]}>
      <Text style={styles.playerName}>{item.name}</Text>
      <Text style={styles.playerScore}>{item.score} points</Text>
      {game?.winner_id === item.id && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerBadgeText}>Winner!</Text>
        </View>
      )}
    </View>
  );

  if (!game) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const winner = game.players.find(p => p.id === game.winner_id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Over!</Text>
      
      {winner && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>
            {winner.id === playerId ? 'You won!' : `${winner.name} won!`}
          </Text>
        </View>
      )}

      <View style={styles.scoreContainer}>
        <Text style={styles.subtitle}>Final Scores:</Text>
        <FlatList
          data={[...game.players].sort((a, b) => b.score - a.score)}
          renderItem={renderPlayer}
          keyExtractor={(player) => player.id}
          style={styles.playersList}
        />
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={startNewGame}
      >
        <Text style={styles.buttonText}>Start New Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  winnerContainer: {
    backgroundColor: '#6200ee',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  winnerText: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scoreContainer: {
    flex: 1,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 10,
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winnerCard: {
    backgroundColor: '#3700b3',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 18,
    flex: 1,
  },
  playerScore: {
    color: '#cccccc',
    fontSize: 18,
    marginRight: 10,
  },
  winnerBadge: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  winnerBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 