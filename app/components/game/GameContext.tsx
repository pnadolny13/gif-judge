import React, { createContext, useContext, useState, useEffect } from 'react';
import Constants from 'expo-constants';

interface GameState {
  gameId: string | null;
  isJudge: boolean;
  currentPhrase: string;
  players: Array<{id: string; name: string; score: number}>;
  submissions: Array<{playerId: string; gifUrl: string}>;
  timeRemaining: number;
  roundActive: boolean;
  judgePlayerId: string | null;
}

interface GameContextType {
  gameState: GameState;
  createGame: () => Promise<void>;
  joinGame: (gameId: string) => Promise<void>;
  submitGif: (gifUrl: string) => Promise<void>;
  submitPhrase: (phrase: string) => Promise<void>;
  selectWinner: (playerId: string) => Promise<void>;
}

const defaultGameState: GameState = {
  gameId: null,
  isJudge: false,
  currentPhrase: '',
  players: [],
  submissions: [],
  timeRemaining: 0,
  roundActive: false,
  judgePlayerId: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    let websocket: WebSocket | null = null;
    
    const connectWebSocket = () => {
      // Initialize WebSocket connection
      const wsUrl = Constants.expoConfig?.extra?.REACT_APP_WS_API_URL || 'ws://127.0.0.1:8000';
      const baseWsUrl = wsUrl.endsWith('/') ? wsUrl.slice(0, -1) : wsUrl;
        
      websocket = new WebSocket(`${baseWsUrl}v1/ws/${gameState.gameId || ''}`);
      
      websocket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        updateGameState(data);
      };

      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        // Only try to reconnect if we have a game ID
        if (gameState.gameId) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        websocket?.close();
      };

      setWs(websocket);
    };

    // Only connect if we have a game ID
    if (gameState.gameId) {
      connectWebSocket();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [gameState.gameId]); // Reconnect when game ID changes

  const updateGameState = (data: any) => {
    setGameState(prevState => ({
      ...prevState,
      ...data,
      judgePlayerId: data.judge_player_id || prevState.judgePlayerId,
    }));
  };

  const createGame = async () => {
    try {
      const baseUrl = Constants.expoConfig?.extra?.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${baseUrl}v1/game`, {
        method: 'POST',
      });
      const data = await response.json();
      setGameState(prevState => ({
        ...prevState,
        gameId: data.gameId,
        isJudge: true,
      }));
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      const baseUrl = Constants.expoConfig?.extra?.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${baseUrl}v1/game/${gameId}/join`, {
        method: 'POST',
      });
      const data = await response.json();
      setGameState(prevState => ({
        ...prevState,
        gameId,
        isJudge: false,
      }));
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const submitGif = async (gifUrl: string) => {
    if (!gameState.gameId) return;
    try {
      const baseUrl = Constants.expoConfig?.extra?.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000';
      await fetch(`${baseUrl}v1/game/${gameState.gameId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gifUrl }),
      });
    } catch (error) {
      console.error('Error submitting gif:', error);
    }
  };

  const submitPhrase = async (phrase: string) => {
    if (!gameState.gameId || !gameState.isJudge) return;
    try {
      const baseUrl = Constants.expoConfig?.extra?.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000';
      await fetch(`${baseUrl}v1/game/${gameState.gameId}/phrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrase }),
      });
    } catch (error) {
      console.error('Error submitting phrase:', error);
    }
  };

  const selectWinner = async (playerId: string) => {
    if (!gameState.gameId || !gameState.isJudge) return;
    try {
      const baseUrl = Constants.expoConfig?.extra?.REACT_APP_REST_API_URL || 'http://127.0.0.1:8000';
      await fetch(`${baseUrl}v1/game/${gameState.gameId}/winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });
    } catch (error) {
      console.error('Error selecting winner:', error);
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      createGame,
      joinGame,
      submitGif,
      submitPhrase,
      selectWinner,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 