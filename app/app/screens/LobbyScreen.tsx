import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, Game, Player } from '../services/api';

export default function LobbyScreen() {
  const { roomCode, isHost, playerId } = useLocalSearchParams<{ roomCode: string; isHost: string; playerId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${api.API_URL}/games/${roomCode}`);
        if (!response.ok) throw new Error('Failed to fetch game state');
        const updatedGame = await response.json();
        setGame(updatedGame);

        // If the game has started but we're not the host, we need to fetch the current round
        if (updatedGame.game_status === 'in_progress' && isHost !== 'true' && updatedGame.round_id) {
          router.push({
            pathname: "/game",
            params: { 
              roomCode,
              playerId,
              roundId: updatedGame.round_id
            }
          });
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [roomCode]);

  const startGame = async () => {
    if (!isHost || !game) return;

    setIsStarting(true);
    try {
      const response = await api.startGame(roomCode, playerId);
      const { game: updatedGame, round } = response;
      
      router.push({
        pathname: "/game",
        params: { 
          roomCode,
          playerId,
          roundId: round.id
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
      setIsStarting(false);
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerCard}>
      <Text style={styles.playerName}>{item.name}</Text>
      {item.is_host && <Text style={styles.hostBadge}>Host</Text>}
    </View>
  );

  if (!game) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Lobby</Text>
      <Text style={styles.roomCode}>Room Code: {roomCode}</Text>
      
      <View style={styles.playersContainer}>
        <Text style={styles.subtitle}>Players ({game.players.length}):</Text>
        <FlatList
          data={game.players}
          renderItem={renderPlayer}
          keyExtractor={(player) => player.id}
          style={styles.playersList}
        />
      </View>

      {isHost === 'true' && (
        <TouchableOpacity 
          style={[styles.button, game.players.length < 2 && styles.buttonDisabled]}
          onPress={startGame}
          disabled={isStarting || game.players.length < 2}
        >
          {isStarting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {game.players.length < 2 
                ? 'Waiting for Players...' 
                : 'Start Game'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 30,
  },
  playersContainer: {
    width: '100%',
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 10,
  },
  playersList: {
    width: '100%',
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
  playerName: {
    color: '#ffffff',
    fontSize: 18,
  },
  hostBadge: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#3a3a3a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 