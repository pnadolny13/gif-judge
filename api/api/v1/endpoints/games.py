from fastapi import APIRouter, HTTPException, status
from db.models import Game, Player, Round, GifSubmission
from db.crud import games
from typing import Optional
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

@router.post("/", response_model=Game)
async def post_game(new_game: PostNewGame):
    """Returns a new game"""
    return await games.create_game(new_game.name)

@router.get("/{game_id}", response_model=Game)
async def get_game(game_id: str):
    """Returns existing game details"""
    game = await games.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
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
    return await games.update_game_properties(game_id, updates)

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
async def submit_round_prompt(game_id: str, round_id: str, judge_id: str, prompt: str):
    """Submit a prompt for a round"""
    round = await games.update_round_prompt(game_id, round_id, judge_id, prompt)
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
async def judge_round(game_id: str, round_id: str, judge_id: str, winner_id: str):
    """Judge a round by selecting a winner"""
    round = await games.select_winner(game_id, round_id, judge_id, winner_id)
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    # Update game score for the winner
    game = await games.get_game(game_id)
    if game:
        for player in game.players:
            if player.id == winner_id:
                player.game_score = (player.game_score or 0) + 1
                break
        game = await games.update_game_properties(game_id, {"players": game.players})
    
    return {"round": round, "game": game}
