import Constants from 'expo-constants';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY;

export interface Player {
  id: string;
  name: string;
  score: number;
  game_id: string;
}

export interface Game {
  id: string;
  game_status: 'waiting' | 'in_progress' | 'completed';
  host_id: string;
  judge_player_id: string;
  round_id?: string;
  round_num: number;
  players: Player[];
}

export interface GifSubmission {
  player_id: string;
  gif_url: string;
  prompt: string;
}

export interface Round {
  id: string;
  game_id: string;
  judge_id: string;
  prompt: string;
  submissions: Record<string, GifSubmission>;
  winner_id: string | null;
  round_status: 'waiting' | 'in_progress' | 'judging' | 'completed';
  created_at: string;
  ends_at: string | null;
}

export interface GiphyGif {
  id: string;
  url: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
  };
}

class ApiService {
  readonly API_URL = apiUrl;
  readonly GIPHY_API_KEY = GIPHY_API_KEY;

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = isJson ? JSON.stringify(data, null, 2) : data;
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return data as T;
  }

  // Game Management
  async createGame(playerName: string): Promise<Game> {
    console.log(`Creating game with player name: ${playerName}`);
    
    try {
      // First create the game with initial player as host
      const response = await fetch(`${this.API_URL}/games/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: playerName,
          game_status: 'waiting'
        }),
      });
      
      const game = await this.handleResponse<Game>(response);

      // Then create the host player in that game
      const playerResponse = await fetch(`${this.API_URL}/games/${game.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: playerName,
          is_host: true,
          is_judge: true
        }),
      });

      const player = await this.handleResponse<Player>(playerResponse);
      
      // Update the game with the host and judge player in a single update
      const updateResponse = await fetch(`${this.API_URL}/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_id: player.id,
          judge_player_id: player.id,
          players: [player]
        }),
      });

      return await this.handleResponse<Game>(updateResponse);
    } catch (error) {
      console.error('Create game error:', error);
      throw error;
    }
  }

  async joinGame(roomCode: string, playerName: string): Promise<{ player: Player }> {
    try {
      const response = await fetch(`${this.API_URL}/games/${roomCode}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName }),
      });
      
      const data = await this.handleResponse<Player>(response);
      console.log('API response data:', data);
      
      return { player: data };
    } catch (error) {
      console.error('Join game error:', error);
      throw error;
    }
  }

  async startGame(gameId: string, hostId: string): Promise<{ game: Game; round: Round }> {
    try {
      const response = await fetch(`${this.API_URL}/games/${gameId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ host_id: hostId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      
      return this.handleResponse<{ game: Game; round: Round }>(response);
    } catch (error) {
      console.error('Start game error:', error);
      throw error;
    }
  }

  // Round Management
  async submitPrompt(roomCode: string, roundId: string, judgeId: string, prompt: string): Promise<Round> {
    try {
      const response = await fetch(`${this.API_URL}/games/${roomCode}/rounds/${roundId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judge_id: judgeId, prompt }),
      });
      
      return this.handleResponse<Round>(response);
    } catch (error) {
      console.error('Submit prompt error:', error);
      throw error;
    }
  }

  async submitGif(roomCode: string, roundId: string, submission: GifSubmission): Promise<Round> {
    try {
      const response = await fetch(`${this.API_URL}/games/${roomCode}/rounds/${roundId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      
      return this.handleResponse<Round>(response);
    } catch (error) {
      console.error('Submit GIF error:', error);
      throw error;
    }
  }

  async judgeRound(roomCode: string, roundId: string, judgeId: string, winnerId: string): Promise<{ round: Round; game: Game }> {
    try {
      const response = await fetch(`${this.API_URL}/games/${roomCode}/rounds/${roundId}/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judge_id: judgeId, winner_id: winnerId }),
      });
      
      return this.handleResponse<{ round: Round; game: Game }>(response);
    } catch (error) {
      console.error('Judge round error:', error);
      throw error;
    }
  }

  // Giphy API
  async searchGifs(query: string): Promise<GiphyGif[]> {
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${this.GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`
      );
      
      const data = await this.handleResponse<{ data: GiphyGif[] }>(response);
      return data.data;
    } catch (error) {
      console.error('Search GIFs error:', error);
      throw error;
    }
  }
}

export const api = new ApiService(); 