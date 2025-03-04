import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../services/api';

export default function JoinGameScreen() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const joinGame = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      Alert.alert('Error', 'Please enter both room code and your name');
      return;
    }

    setIsJoining(true);
    try {
      const { game, player } = await api.joinGame(roomCode, playerName);
      router.push({
        pathname: "/lobby",
        params: { 
          roomCode: game.id, 
          isHost: false,
          playerId: player.id
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to join game. Please check the room code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Game</Text>
      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Enter Room Code:</Text>
        <TextInput
          style={styles.input}
          value={roomCode}
          onChangeText={text => setRoomCode(text)}
          placeholder="Room Code"
          placeholderTextColor="#666666"
          // maxLength={6}
          // autoCapitalize="characters"
        />
        
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
          style={[styles.button, (!roomCode.trim() || !playerName.trim()) && styles.buttonDisabled]}
          onPress={joinGame}
          disabled={isJoining || !roomCode.trim() || !playerName.trim()}
        >
          {isJoining ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Join Game</Text>
          )}
        </TouchableOpacity>
      </View>
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
}); 