from db.crud.games import create_game, set_game_phrase, update_game_properties
from db.models import Game
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from v1.endpoints import valid_game_id

router = APIRouter()

class PostNewGame(BaseModel):
    name: str


@router.post("/games/")
async def post_game(new_game: PostNewGame):
    """Returns a new game"""
    return await create_game(new_game.name)


@router.get(
    "/games/{game_id}",
    response_model=Game,
    status_code=status.HTTP_200_OK,
)
async def get_game(game: Game = Depends(valid_game_id)):
    """Returns existing game details"""
    return game


class PostGamePhrase(BaseModel):
   phrase: str


@router.post(
    "/games/{game_id}",
    response_model=Game,
    status_code=status.HTTP_200_OK
)
async def update_phrase(phrase: PostGamePhrase, game: Game = Depends(valid_game_id)):
    return await set_game_phrase(game.id, phrase.phrase)


class UpdateGame(BaseModel):
    host_id: str | None = None
    judge_player_id: str | None = None
    game_status: str | None = None


@router.patch(
    "/games/{game_id}",
    response_model=Game,
    status_code=status.HTTP_200_OK
)
async def update_game(updates: UpdateGame, game: Game = Depends(valid_game_id)):
    """Update game properties"""
    game_dict = game.dict()
    update_data = updates.dict(exclude_unset=True)
    game_dict.update(update_data)
    return await update_game_properties(game.id, update_data)
