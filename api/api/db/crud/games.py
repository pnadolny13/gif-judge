from db.dynamo import DynamoDB
from db.models import Game
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import HTTPException

async def create_game(name: str) -> Game:
    game = Game(
        id=str(uuid4()),
        name=name
    )
    DynamoDB().put_item(
        "games",
        game.dict()
    )
    return game

async def set_game_round(game_id: UUID) -> Game:
    return None

async def set_judge(game_id: UUID) -> Game:
    return None

async def set_game_phrase(game_id: str, phrase: str) -> Game:
    now = datetime.utcnow()
    start = now + timedelta(seconds=20)
    end = now + timedelta(seconds=80)

    resp = DynamoDB().update_item(
        "games",
        {
            "id": game_id
        },
        "set phrase=:p, round_start_ts=:s, round_end_ts=:e",
        {
            ":p": phrase,
            ":s": str(start.isoformat()) + 'Z',
            ":e": str(end.isoformat()) + 'Z',
        }
    )
    if resp:
        return Game(**resp.get("Attributes"))
    return None

async def get_game(game_id: str) -> Game:
    """Get a game by ID"""
    resp = DynamoDB().get_item(
        "games",
        {"id": game_id}
    )
    if resp:
        return Game(**resp)
    return None

async def update_game_properties(game_id: str, updates: dict) -> Game:
    """Update game properties"""
    # Ensure we're using the correct field names
    if 'status' in updates:
        updates['game_status'] = updates.pop('status')
        
    update_expr = "set " + ", ".join(f"{k}=:{k}" for k in updates.keys())
    expr_values = {f":{k}": v for k, v in updates.items()}
    
    print(f"Updating game {game_id} with expression: {update_expr}")
    print(f"Values: {expr_values}")
    
    resp = DynamoDB().update_item(
        "games",
        {"id": game_id},
        update_expr,
        expr_values
    )
    
    if not resp:
        raise HTTPException(status_code=404, detail="Game not found")
    
    print(f"Update response: {resp}")
    return Game(**resp.get("Attributes"))
