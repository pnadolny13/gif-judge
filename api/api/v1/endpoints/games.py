from fastapi import APIRouter, HTTPException, status
from db.models import Game, Player, Round, GifSubmission
from db.crud import games, players
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(
    prefix="/games",
    tags=["games"],
)

class PostNewGame(BaseModel):
    name: str

class PostGamePhrase(BaseModel):
    phrase: str

class StartGameRequest(BaseModel):
    host_id: str

class SubmitRoundPromptRequest(BaseModel):
    judge_id: str
    prompt: str

class JudgeRoundRequest(BaseModel):
    judge_id: str
    winner_id: str

@router.post("/", response_model=Game)
async def post_game(new_game: PostNewGame):
    """Returns a new game"""
    game = await games.create_game(new_game.name)
    game.players = []
    return game

@router.get("/{game_id}", response_model=Game)
async def get_game(game_id: str):
    """Returns existing game details with all player data"""
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_players = await players.read_players(game_id)
    game.players = game_players
    
    return game

@router.post("/{game_id}", response_model=Game)
async def update_phrase(game_id: str, phrase: PostGamePhrase):
    """Update game phrase"""
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return await games.set_game_phrase(game.id, phrase.phrase)

@router.patch("/{game_id}", response_model=Game)
async def update_game(game_id: str, updates: dict):
    """Update game properties"""
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if "players" in updates:
        del updates["players"]
    
    updated_game = await games.update_game_properties(game_id, updates)
    
    game_players = await players.read_players(game_id)
    updated_game.players = game_players
    
    return updated_game

# Round-related endpoints
@router.post("/{game_id}/rounds", response_model=Round)
async def create_game_round(game_id: str, judge_id: str):
    """Create a new round for a game"""
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return await games.create_round(game_id, judge_id)

@router.get("/{game_id}/rounds/{round_id}", response_model=Round)
async def get_round(game_id: str, round_id: str):
    """Get a specific round"""
    round = await games.get_round(game_id, round_id)
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    return round

@router.post("/{game_id}/rounds/{round_id}/prompt", response_model=Round)
async def submit_round_prompt(game_id: str, round_id: str, request: SubmitRoundPromptRequest):
    """Submit a prompt for a round"""
    round = await games.update_round_prompt(game_id, round_id, request.judge_id, request.prompt)
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    return round

@router.post("/{game_id}/rounds/{round_id}/submit", response_model=Round)
async def submit_gif(game_id: str, round_id: str, submission: GifSubmission):
    """Submit a GIF for a round"""
    round = await games.submit_gif(game_id, round_id, submission)
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    return round

@router.post("/{game_id}/rounds/{round_id}/judge", response_model=dict)
async def judge_round(game_id: str, round_id: str, request: JudgeRoundRequest):
    """Judge a round by selecting a winner"""
    round = await games.select_winner(game_id, round_id, request.judge_id, request.winner_id)
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    await players.increment_score(request.winner_id)
    
    game = await games.get_game(game_id)
    game_players = await players.read_players(game_id)
    game.players = game_players
    
    return {"round": round, "game": game}

@router.post("/{game_id}/start", response_model=dict)
async def start_game(game_id: str, request: StartGameRequest):
    """Start a game and create the first round"""
    # Get game and verify host
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.host_id != request.host_id:
        raise HTTPException(status_code=403, detail="Only the host can start the game")

    # Update game status
    game = await games.update_game_properties(game_id, {
        "game_status": "in_progress",
        "round_num": 1
    })

    # Create first round with current judge
    round = await games.create_round(game_id, game.judge_player_id)

    # Get all players for the response
    game_players = await players.read_players(game_id)
    game.players = game_players

    return {
        "game": game,
        "round": round
    }
