from db.crud.players import create_player, read_players
from db.models import Game, Player
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from v1.endpoints import valid_game_id, valid_player_id
from db.crud import games

router = APIRouter()

class PostNewPlayer(BaseModel):
    name: str

class PlayerGameResponse(BaseModel):
    game: Game
    player: Player

class CreatePlayer(BaseModel):
    name: str
    is_host: bool = False
    is_judge: bool = False

@router.post("/games/{game_id}/players", response_model=Player)
async def post_player(game_id: str, player: CreatePlayer):
    """Create a new player in a game"""
    # Create player in players table
    new_player = await create_player(
        game_id=game_id,
        name=player.name,
        is_host=player.is_host,
        is_judge=player.is_judge
    )
    
    # Add player reference to game
    await games.add_player_to_game(game_id, new_player.id)
    
    return new_player

@router.get("/games/{game_id}/players")
async def get_players(game: Game = Depends(valid_game_id)):
    """Returns all players for a game"""
    return await read_players(game.id)

@router.get("/games/{game_id}/players/{player_id}")
async def get_player(player: Player = Depends(valid_player_id)):
    """Returns player"""
    return player
