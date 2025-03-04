import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function WaitingScreen() {
  const { roomCode } = useLocalSearchParams();
  const [waitingMessage, setWaitingMessage] = useState('Waiting for other players...');
  const [submittedCount, setSubmittedCount] = useState(2);
  const [totalPlayers, setTotalPlayers] = useState(4);
  
  // Animation for the loading dots
  const dotAnimation = new Animated.Value(0);

  useEffect(() => {
    // Animate the loading dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Mock checking for game state updates
    const interval = setInterval(() => {
      // TODO: Replace with real API call to check game state
      if (submittedCount < totalPlayers) {
        setSubmittedCount(prev => Math.min(prev + 1, totalPlayers));
      } else {
        router.replace({
          pathname: "/results",
          params: { roomCode }
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [submittedCount]);

  const dots = [0, 1, 2].map(i => (
    <Animated.Text
      key={i}
      style={[
        styles.dot,
        {
          opacity: dotAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
          transform: [{
            scale: dotAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.2],
            }),
          }],
        },
      ]}
    >
      •
    </Animated.Text>
  ));

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" style={styles.spinner} />
      
      <Text style={styles.message}>{waitingMessage}</Text>
      
      <View style={styles.dotsContainer}>
        {dots}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {submittedCount} of {totalPlayers} players have submitted
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${(submittedCount / totalPlayers) * 100}%` }
            ]} 
          />
        </View>
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
  spinner: {
    marginBottom: 30,
  },
  message: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    color: '#6200ee',
    fontSize: 40,
    marginHorizontal: 5,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
  },
  progressText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
}); 