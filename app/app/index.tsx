import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { GameProvider } from '../components/game/GameContext';

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_REST_API_URL}/v1/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judge_name: playerName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push({
          pathname: '/game/[id]',
          params: { 
            id: data.game_id,
            playerId: data.player_id,
            isJudge: 'true',
          },
        });
      } else {
        setError('Failed to create game');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim() || !gameId.trim()) {
      setError('Please enter your name and game ID');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_REST_API_URL}/v1/game/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_name: playerName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push({
          pathname: '/game/[id]',
          params: { 
            id: gameId,
            playerId: data.player_id,
            isJudge: 'false',
          },
        });
      } else {
        setError('Failed to join game');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  return (
    <GameProvider>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>GIF Judge</ThemedText>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateGame}
          >
            <ThemedText style={styles.buttonText}>Create New Game</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.orText}>- OR -</ThemedText>

          <TextInput
            style={styles.input}
            value={gameId}
            onChangeText={setGameId}
            placeholder="Enter game ID"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleJoinGame}
          >
            <ThemedText style={styles.buttonText}>Join Game</ThemedText>
          </TouchableOpacity>

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 10,
  },
}); 