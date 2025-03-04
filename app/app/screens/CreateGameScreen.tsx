import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '../services/api';

export default function CreateGameScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [game, setGame] = useState<{ room_code: string; host_id: string } | null>(null);

  const createGame = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating game...');
      const newGame = await api.createGame(playerName);
      console.log('Game created:', newGame);
      setGame({
        room_code: newGame.room_code,
        host_id: newGame.host_id,
      });
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert(
        'Error',
        `Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startGame = () => {
    if (game) {
      router.push({
        pathname: "/lobby",
        params: { 
          roomCode: game.room_code, 
          isHost: "true",
          playerId: game.host_id 
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Game</Text>
      
      {!game ? (
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Enter your name:</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Your name"
            placeholderTextColor="#666666"
            maxLength={20}
          />
          <TouchableOpacity 
            style={[styles.button, !playerName.trim() && styles.buttonDisabled]}
            onPress={createGame}
            disabled={isCreating || !playerName.trim()}
          >
            {isCreating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Game</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.codeContainer}>
          <Text style={styles.subtitle}>Your Room Code:</Text>
          <Text style={styles.roomCode}>{game.room_code}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#3a3a3a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  codeContainer: {
    alignItems: 'center',
    gap: 20,
  },
  roomCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 8,
    marginBottom: 20,
  },
}); 