import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

type Player = {
  id: string;
  name: string;
  score: number;
  isWinner?: boolean;
  bestGif?: {
    prompt: string;
    url: string;
  };
};

export default function GameOverScreen() {
  const { roomCode, winnerId } = useLocalSearchParams();

  // Mock data - replace with real API data
  const gameData = {
    players: [
      {
        id: '1',
        name: 'Player 1',
        score: 3,
        bestGif: {
          prompt: "When the code works on the first try",
          url: 'https://via.placeholder.com/300',
        },
      },
      {
        id: '2',
        name: 'Player 2',
        score: 5,
        isWinner: true,
        bestGif: {
          prompt: "When you finally fix that bug",
          url: 'https://via.placeholder.com/300',
        },
      },
      {
        id: '3',
        name: 'Player 3',
        score: 2,
        bestGif: {
          prompt: "Code review time",
          url: 'https://via.placeholder.com/300',
        },
      },
    ] as Player[],
    totalRounds: 7,
  };

  const winner = gameData.players.find(p => p.id === winnerId) || gameData.players.find(p => p.isWinner);

  const startNewGame = () => {
    router.push('/');
  };

  const renderPlayerStats = ({ item }: { item: Player }) => (
    <View style={[styles.playerCard, item.isWinner && styles.winnerCard]}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerScore}>Final Score: {item.score}</Text>
      </View>
      
      {item.bestGif && (
        <View style={styles.bestGifContainer}>
          <Text style={styles.bestGifLabel}>Best GIF:</Text>
          <Text style={styles.bestGifPrompt}>"{item.bestGif.prompt}"</Text>
          <Image
            source={{ uri: item.bestGif.url }}
            style={styles.bestGif}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Over!</Text>
        {winner && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>🏆 Winner 🏆</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
          </View>
        )}
      </View>

      <Text style={styles.statsTitle}>Final Stats</Text>
      <Text style={styles.totalRounds}>Total Rounds: {gameData.totalRounds}</Text>

      <FlatList
        data={gameData.players.sort((a, b) => b.score - a.score)}
        renderItem={renderPlayerStats}
        keyExtractor={item => item.id}
        style={styles.playersList}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={startNewGame}
      >
        <Text style={styles.buttonText}>Start New Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  winnerContainer: {
    alignItems: 'center',
  },
  winnerLabel: {
    fontSize: 24,
    color: '#ffd700',
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  totalRounds: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 20,
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerScore: {
    fontSize: 18,
    color: '#cccccc',
  },
  bestGifContainer: {
    marginTop: 10,
  },
  bestGifLabel: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 5,
  },
  bestGifPrompt: {
    fontSize: 16,
    color: '#ffffff',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  bestGif: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 