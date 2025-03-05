from db.dynamo import DynamoDB
from db.models import Game, Round, GifSubmission
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import HTTPException
from typing import Optional

async def create_game(name: str) -> Game:
    """Create a new game with empty player_ids list"""
    game = Game(
        id=str(uuid4()),
        name=name,
        player_ids=[]  # Initialize empty player_ids list
    )
    DynamoDB().put_item(
        "games",
        game.dict()
    )
    return game

async def create_round(game_id: str, judge_id: str) -> Round:
    """Create a new round for a game and update game's round_id"""
    now = datetime.utcnow()
    round = Round(
        id=str(uuid4()),
        game_id=game_id,
        judge_id=judge_id,
        round_status='waiting',
        created_at=str(now.isoformat()) + 'Z'
    )
    # Create the round
    DynamoDB().put_item(
        "rounds",
        round.dict()
    )
    
    # Update the game's round_id
    await update_game_properties(game_id, {
        "round_id": round.id
    })
    
    return round

async def get_round(game_id: str, round_id: str) -> Round:
    """Get a round by ID"""
    resp = DynamoDB().get_item(
        "rounds",
        {"id": round_id, "game_id": game_id}
    )
    if resp:
        return Round(**resp)
    return None

async def update_round_prompt(game_id: str, round_id: str, judge_id: str, prompt: str) -> Round:
    """Update a round's prompt and change round_status to in_progress"""
    now = datetime.utcnow()
    end = now + timedelta(minutes=2)  # 2 minutes to submit GIFs
    
    resp = DynamoDB().update_item(
        "rounds",
        {"id": round_id, "game_id": game_id},
        "set prompt=:p, round_status=:s, ends_at=:e",
        {
            ":p": prompt,
            ":s": "in_progress",
            ":e": str(end.isoformat()) + 'Z'
        }
    )
    if resp:
        return Round(**resp.get("Attributes"))
    return None

async def submit_gif(game_id: str, round_id: str, submission: GifSubmission) -> Round:
    """Submit a GIF for a round"""
    update_expr = "set submissions.#pid = :sub"
    expr_values = {":sub": submission.dict()}
    expr_attr_names = {"#pid": submission.player_id}
    
    resp = DynamoDB().update_item(
        "rounds",
        {"id": round_id, "game_id": game_id},
        update_expr,
        expr_values,
        expr_attr_names
    )
    
    if resp:
        round = Round(**resp.get("Attributes"))
        # If all non-judge players have submitted, change status to judging
        game = await get_game(game_id)
        # TODO: theres still a bug here. Game and Game response should be different
        if game and len(round.submissions) >= len(game.player_ids) - 1:
            round = await update_round_status(game_id, round_id, "judging")
        return round
    return None

async def update_round_status(game_id: str, round_id: str, status: str) -> Round:
    """Update a round's status"""
    resp = DynamoDB().update_item(
        "rounds",
        {"id": round_id, "game_id": game_id},
        "set round_status=:s",
        {":s": status}
    )
    if resp:
        return Round(**resp.get("Attributes"))
    return None

async def select_winner(game_id: str, round_id: str, judge_id: str, winner_id: str) -> Round:
    """Select a winner for a round"""
    resp = DynamoDB().update_item(
        "rounds",
        {"id": round_id, "game_id": game_id},
        "set winner_id=:w, round_status=:s",
        {
            ":w": winner_id,
            ":s": "completed"
        }
    )
    if resp:
        return Round(**resp.get("Attributes"))
    return None

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
        game = Game(**resp)
        # Don't populate players here - let the route handler do it
        return game
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

async def add_player_to_game(game_id: str, player_id: str) -> Game:
    """Add a player ID to the game's player_ids list"""
    resp = DynamoDB().update_item(
        "games",
        {"id": game_id},
        "SET player_ids = list_append(if_not_exists(player_ids, :empty), :pid)",
        {
            ":pid": [player_id],
            ":empty": []
        }
    )
    if resp:
        return Game(**resp.get("Attributes"))
    return None

async def get_latest_round(game_id: str) -> Optional[Round]:
    """Get the most recent round for a game"""
    # First get the game to get the current round number
    game = await get_game(game_id)
    if not game or not game.round_num:
        return None
        
    # Get the round using game_id and round_num
    resp = DynamoDB().get_item(
        "rounds",
        {
            "game_id": game_id,
            "round_num": game.round_num
        }
    )
    
    if resp:
        return Round(**resp)
    return None
