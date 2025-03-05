from typing import List
from uuid import UUID, uuid4

from boto3.dynamodb.conditions import Attr
from db.dynamo import DynamoDB
from db.models import Game, Player


async def create_player(game_id: str, name: str, is_host: bool = False, is_judge: bool = False) -> Player:
    """Create a new player"""
    player = Player(
        id=str(uuid4()),
        game_id=game_id,
        name=name,
        is_host=is_host,
        is_judge=is_judge,
        game_score=0
    )
    DynamoDB().put_item(
        "players",
        player.dict()
    )
    return player

async def set_player_game_score(game_id: UUID) -> Player:
    return None

async def read_player(player_id: str) -> Player:
    """Get a player by ID"""
    resp = DynamoDB().get_item(
        "players",
        {"id": player_id}
    )
    if resp:
        return Player(**resp)
    return None

async def read_players(game_id: str) -> List[Player]:
    """Get all players in a game"""
    resp = DynamoDB().get_items(
        "players",
        {"FilterExpression": Attr("game_id").eq(game_id)}
    )
    if resp:
        return [Player(**player) for player in resp]
    return []

async def increment_score(player_id: str) -> Player:
    """Increment a player's game score"""
    resp = DynamoDB().update_item(
        "players",
        {"id": player_id},
        "SET game_score = if_not_exists(game_score, :zero) + :one",
        {
            ":zero": 0,
            ":one": 1
        }
    )
    if resp:
        return Player(**resp.get("Attributes"))
    return None

