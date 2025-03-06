import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, Game, Round, GiphyGif } from '../services/api';

export default function GameScreen() {
  const params = useLocalSearchParams<{ roomCode: string; playerId: string; roundId: string }>();
  const roomCode = params?.roomCode || '';
  const playerId = params?.playerId || '';
  const roundId = params?.roundId || '';

  useEffect(() => {
    if (!roomCode || !playerId || !roundId) {
      console.error('Missing required parameters:', { roomCode, playerId, roundId });
      Alert.alert('Error', 'Missing required game parameters');
      router.back();
      return;
    }
  }, [roomCode, playerId, roundId]);

  const [game, setGame] = useState<Game | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [prompt, setPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GiphyGif[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!roomCode || !roundId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const [gameResponse, roundResponse] = await Promise.all([
          fetch(`${api.API_URL}/games/${roomCode}`),
          fetch(`${api.API_URL}/games/${roomCode}/rounds/${roundId}`)
        ]);

        if (!gameResponse.ok || !roundResponse.ok) {
          throw new Error('Failed to fetch game state');
        }

        const [gameData, roundData] = await Promise.all([
          gameResponse.json(),
          roundResponse.json()
        ]);

        setGame(gameData);
        setRound(roundData);

        if (gameData.game_status === 'completed') {
          router.push({
            pathname: "/results",
            params: { roomCode, playerId }
          });
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [roomCode, roundId]);

  const searchGifs = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await api.searchGifs(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search GIFs. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const submitPrompt = async () => {
    if (!prompt.trim() || !round) return;

    setIsSubmitting(true);
    try {
      const updatedRound = await api.submitPrompt(roomCode, roundId, playerId, prompt);
      setRound(updatedRound);
      setPrompt('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGif = async (gif: GiphyGif) => {
    if (!round) return;

    setIsSubmitting(true);
    try {
      const submission = {
        player_id: playerId,
        gif_url: gif.images.original.url,
        prompt: round.prompt
      };
      const updatedRound = await api.submitGif(roomCode, roundId, submission);
      setRound(updatedRound);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit GIF. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectWinner = async (winnerId: string) => {
    if (!round) return;

    setIsSubmitting(true);
    try {
      const { round: updatedRound, game: updatedGame } = await api.judgeRound(roomCode, roundId, playerId, winnerId);
      setGame(updatedGame);
      setRound(updatedRound);
    } catch (error) {
      console.error('Error selecting winner:', error);
      Alert.alert('Error', 'Failed to select winner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNextRound = async () => {
    if (!round?.winner_id) {
      console.error('No winner selected for current round');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRound = await api.startNextRound(roomCode, round.winner_id);
      router.push({
        pathname: "/game",
        params: { 
          roomCode, 
          playerId, 
          roundId: newRound.id 
        }
      });
    } catch (error) {
      console.error('Error starting next round:', error);
      Alert.alert('Error', 'Failed to start next round. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGif = ({ item }: { item: GiphyGif }) => (
    <TouchableOpacity 
      style={styles.gifContainer}
      onPress={() => submitGif(item)}
      disabled={isSubmitting}
    >
      <Image
        source={{ uri: item.images.fixed_height.url }}
        style={styles.gif}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderSubmission = ({ item }: { item: [string, GiphyGif] }) => {
    const [submitterId, submission] = item;
    const player = game?.players.find(p => p.id === submitterId);

    return (
      <View style={styles.submissionContainer}>
        <Text style={styles.playerName}>{player?.name || 'Unknown Player'}</Text>
        <Image
          source={{ uri: submission.gif_url }}
          style={styles.submittedGif}
          resizeMode="cover"
        />
        {round?.judge_id === playerId && round.round_status === 'judging' && (
          <TouchableOpacity
            style={styles.selectWinnerButton}
            onPress={() => selectWinner(submitterId)}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>Select Winner</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!game || !round) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const isJudge = round.judge_id === playerId;
  const hasSubmitted = round.submissions[playerId] !== undefined;
  const allPlayersSubmitted = Object.keys(round.submissions).length === game.players.length - 1;
  const submissions = Object.entries(round.submissions);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Round {game.round_num}</Text>
        <Text style={styles.subtitle}>
          Judge: {game.players.find(p => p.id === round.judge_id)?.name}
        </Text>
      </View>

      {round.round_status === 'waiting' && isJudge && (
        <View style={styles.promptContainer}>
          <Text style={styles.subtitle}>Enter a prompt for players:</Text>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Enter your prompt..."
            placeholderTextColor="#666666"
            multiline
          />
          <TouchableOpacity
            style={[styles.button, !prompt.trim() && styles.buttonDisabled]}
            onPress={submitPrompt}
            disabled={isSubmitting || !prompt.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Submit Prompt</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {round.round_status === 'in_progress' && round.prompt && !isJudge && (
        <View style={styles.gameplayContainer}>
          <Text style={styles.prompt}>{round.prompt}</Text>
          
          {!hasSubmitted ? (
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.input}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for a GIF..."
                  placeholderTextColor="#666666"
                  onSubmitEditing={searchGifs}
                />
                <TouchableOpacity
                  style={[styles.button, !searchQuery.trim() && styles.buttonDisabled]}
                  onPress={searchGifs}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={searchResults}
                renderItem={renderGif}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gifGrid}
              />
            </>
          ) : (
            <Text style={styles.waitingText}>
              Waiting for other players to submit...
            </Text>
          )}
        </View>
      )}

      {((round.round_status === 'judging' && isJudge) || 
        (round.round_status === 'completed' && round.winner_id)) && (
        <View style={styles.submissionsContainer}>
          <Text style={styles.prompt}>{round.prompt}</Text>
          <FlatList
            data={submissions}
            renderItem={renderSubmission}
            keyExtractor={([playerId]) => playerId}
          />
        </View>
      )}

      {round.round_status === 'in_progress' && isJudge && (
        <View style={styles.judgeWaitingContainer}>
          <Text style={styles.prompt}>{round.prompt}</Text>
          <Text style={styles.waitingText}>
            {allPlayersSubmitted
              ? 'All players have submitted! Judging will begin soon...'
              : 'Waiting for players to submit their GIFs...'}
          </Text>
        </View>
      )}

      {round.round_status === 'completed' && (
        <View style={styles.winnerContainer}>
          <Text style={styles.prompt}>{round.prompt}</Text>
          <Text style={styles.winnerText}>
            Winner: {game.players.find(p => p.id === round.winner_id)?.name || 'Unknown Player'}
          </Text>
          
          <View style={styles.scoresContainer}>
            <Text style={styles.scoresTitle}>Current Scores:</Text>
            {game.players.sort((a, b) => b.score - a.score).map(player => (
              <Text key={player.id} style={styles.scoreItem}>
                {player.name}: {player.score} {player.id === round.winner_id && '🏆'}
              </Text>
            ))}
          </View>
          
          {isJudge && game.game_status !== 'completed' && (
            <TouchableOpacity
              style={styles.button}
              onPress={startNextRound}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Start Next Round</Text>
              )}
            </TouchableOpacity>
          )}
          
          {game.game_status === 'completed' && (
            <TouchableOpacity
              style={[styles.button, styles.resultsButton]}
              onPress={() => router.push({
                pathname: "/results",
                params: { roomCode, playerId }
              })}
            >
              <Text style={styles.buttonText}>View Final Results</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const gifWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 10,
  },
  promptContainer: {
    marginBottom: 20,
  },
  gameplayContainer: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
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
  prompt: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  gifGrid: {
    justifyContent: 'space-between',
  },
  gifContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
  submissionsContainer: {
    flex: 1,
  },
  submissionContainer: {
    marginBottom: 20,
  },
  playerName: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
  },
  submittedGif: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectWinnerButton: {
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  judgeWaitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
  },
  winnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
  },
  scoresContainer: {
    marginBottom: 20,
  },
  scoresTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 10,
  },
  scoreItem: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 5,
  },
  resultsButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
}); 