import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useGame } from './GameContext';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { GifSearch } from './GifSearch';

export const GameScreen: React.FC = () => {
  const { gameState, submitPhrase, submitGif, selectWinner } = useGame();
  const [phraseInput, setPhraseInput] = React.useState('');
  const [selectedGif, setSelectedGif] = React.useState('');

  const renderJudgeView = () => (
    <View style={styles.container}>
      {!gameState.currentPhrase ? (
        <View style={styles.phraseInputContainer}>
          <ThemedText style={styles.title}>Enter a phrase for players to match</ThemedText>
          <TextInput
            style={styles.input}
            value={phraseInput}
            onChangeText={setPhraseInput}
            placeholder="Enter a phrase..."
          />
          <TouchableOpacity 
            style={styles.button}
            onPress={() => submitPhrase(phraseInput)}
          >
            <ThemedText style={styles.buttonText}>Submit Phrase</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.submissionsContainer}>
          <ThemedText style={styles.title}>Current Phrase: {gameState.currentPhrase}</ThemedText>
          <ThemedText style={styles.subtitle}>
            Waiting for submissions... ({gameState.submissions.length} / {gameState.players.length - 1})
          </ThemedText>
          {gameState.submissions.map((submission) => (
            <TouchableOpacity
              key={submission.playerId}
              style={styles.submissionCard}
              onPress={() => selectWinner(submission.playerId)}
            >
              <Image 
                source={{ uri: submission.gifUrl }}
                style={styles.gifImage}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderPlayerView = () => (
    <View style={styles.container}>
      {gameState.currentPhrase ? (
        <View style={styles.playerSubmissionContainer}>
          <ThemedText style={styles.title}>Current Phrase: {gameState.currentPhrase}</ThemedText>
          <ThemedText style={styles.subtitle}>
            Time Remaining: {Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}
          </ThemedText>
          <GifSearch onSelect={setSelectedGif} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => submitGif(selectedGif)}
            disabled={!selectedGif}
          >
            <ThemedText style={styles.buttonText}>Submit GIF</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.waitingContainer}>
          <ThemedText style={styles.title}>Waiting for judge to set phrase...</ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {gameState.isJudge ? renderJudgeView() : renderPlayerView()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  phraseInputContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submissionsContainer: {
    flex: 1,
  },
  submissionCard: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  playerSubmissionContainer: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 