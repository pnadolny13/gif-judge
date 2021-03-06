from typing import List
from uuid import UUID, uuid4

from boto3.dynamodb.conditions import Attr
from db.dynamo import DynamoDB
from db.models import Game, Player


async def create_player(game: Game, name: str) -> Player:
    
    player = Player(
        id=str(uuid4()),
        game_id=str(game.id),
        name=name
    )
    DynamoDB().put_item(
        "players",
        player.dict()
    )
    return player

async def set_player_game_score(game_id: UUID) -> Player:
    return None

async def read_player(player_id: str) -> Player:
    resp = DynamoDB().get_item(
        "players",
        {"id": player_id}
    )
    if resp:
        return Player(**resp)
    return None

async def read_players(game_id: str) -> List[Player]:
    resp = DynamoDB().get_items(
        "players",
        {"FilterExpression": Attr("game_id").eq(game_id)}
    )
    if resp:
        return [Player(**player) for player in resp]
