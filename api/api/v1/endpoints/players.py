from db.crud.players import create_player, read_players, read_player
from db.models import Game, Player
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from v1.endpoints import valid_game_id, valid_player_id

router = APIRouter()

class PostNewPlayer(BaseModel):
    name: str

class PlayerGameResponse(BaseModel):
    game: Game
    player: Player

@router.post("/games/{game_id}/players", response_model=PlayerGameResponse)
async def post_player(new_player: PostNewPlayer, game: Game = Depends(valid_game_id)):
    """Returns a new player and the updated game"""
    player = await create_player(game, new_player.name)
    return {"game": game, "player": player}

@router.get("/games/{game_id}/players")
async def get_players(game: Game = Depends(valid_game_id), name: str = None):
    """Returns all players"""
    return await read_players(game.id)

@router.get("/games/{game_id}/players/{player_id}")
async def get_player(player: Player = Depends(valid_player_id)):
    """Returns player"""
    return player
