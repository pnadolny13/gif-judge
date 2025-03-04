from fastapi import Depends, HTTPException, status
from db.crud.games import get_game
from db.crud.players import read_players
from db.models import Game, Player
from db.crud.players import read_player


async def valid_game_id(game_id: str) -> Game:
    """
    Dependency that validates game_id and returns the game with its players.
    Raises 404 if game not found.
    """
    game = await get_game(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {game_id} not found"
        )
    
    # Get players for this game
    players = await read_players(game_id)
    
    # Add players to game object
    game_dict = game.dict()
    game_dict['players'] = players
    return Game(**game_dict)


async def valid_player_id(
    player_id: str,
    game: Game = Depends(valid_game_id)
) -> Player:
    player = await read_player(player_id)
    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )
    elif player.game_id != game.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player found but game mismatch",
        )
    return player