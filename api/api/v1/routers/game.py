from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import asyncio
import json

from ..models.game import (
    Game,
    GameState,
    Player,
    GifSubmission,
    CreateGameRequest,
    JoinGameRequest,
    SubmitPhraseRequest,
    SubmitGifRequest,
    SelectWinnerRequest,
)

router = APIRouter()

# In-memory storage (replace with database in production)
games: Dict[str, Game] = {}
active_connections: Dict[str, List[WebSocket]] = {}

async def broadcast_game_state(game_id: str):
    if game_id not in active_connections:
        return
    
    game = games[game_id]
    
    for websocket in active_connections[game_id]:
        try:
            # Calculate time remaining if round is active
            time_remaining = None
            if game.round_active and game.round_start_time:
                elapsed = (datetime.now() - game.round_start_time).total_seconds()
                time_remaining = max(0, game.round_duration_seconds - int(elapsed))
                
                # Auto-end round if time is up
                if time_remaining == 0:
                    game.round_active = False

            await websocket.send_json({
                "game_id": game.id,
                "current_phrase": game.current_phrase,
                "players": [player.dict() for player in game.players],
                "submissions": [submission.dict() for submission in game.submissions],
                "time_remaining": time_remaining,
                "round_active": game.round_active,
                "winner_id": game.winner_id
            })
        except WebSocketDisconnect:
            active_connections[game_id].remove(websocket)

@router.post("/game")
async def create_game(request: CreateGameRequest):
    player = Player(id=str(uuid.uuid4()), name=request.judge_name)
    game = Game(judge_player_id=player.id)
    game.players.append(player)
    games[game.id] = game
    active_connections[game.id] = []
    return {"game_id": game.id, "player_id": player.id}

@router.post("/game/{game_id}/join")
async def join_game(game_id: str, request: JoinGameRequest):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    player = Player(id=str(uuid.uuid4()), name=request.player_name)
    game.players.append(player)
    
    await broadcast_game_state(game_id)
    return {"player_id": player.id}

@router.post("/game/{game_id}/phrase")
async def submit_phrase(game_id: str, request: SubmitPhraseRequest):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    game.current_phrase = request.phrase
    game.round_active = True
    game.round_start_time = datetime.now()
    game.submissions = []  # Clear previous submissions
    game.winner_id = None
    
    await broadcast_game_state(game_id)
    return {"status": "success"}

@router.post("/game/{game_id}/submit")
async def submit_gif(game_id: str, player_id: str, request: SubmitGifRequest):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if not game.round_active:
        raise HTTPException(status_code=400, detail="Round is not active")
    
    if player_id == game.judge_player_id:
        raise HTTPException(status_code=400, detail="Judge cannot submit gifs")
    
    # Check if player already submitted
    if any(s.player_id == player_id for s in game.submissions):
        raise HTTPException(status_code=400, detail="Player already submitted")
    
    submission = GifSubmission(
        player_id=player_id,
        gif_url=request.gif_url,
        submitted_at=datetime.now()
    )
    game.submissions.append(submission)
    
    await broadcast_game_state(game_id)
    return {"status": "success"}

@router.post("/game/{game_id}/winner")
async def select_winner(game_id: str, request: SelectWinnerRequest):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if not game.round_active:
        raise HTTPException(status_code=400, detail="Round is not active")
    
    # Update winner and their score
    game.winner_id = request.player_id
    game.round_active = False
    for player in game.players:
        if player.id == request.player_id:
            player.score += 1
            break
    
    await broadcast_game_state(game_id)
    return {"status": "success"}

@router.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    await websocket.accept()
    
    if game_id not in games:
        await websocket.close(code=4004, reason="Game not found")
        return
    
    if game_id not in active_connections:
        active_connections[game_id] = []
    active_connections[game_id].append(websocket)
    
    try:
        # Send initial game state
        game = games[game_id]
        await websocket.send_json({
            "game_id": game.id,
            "current_phrase": game.current_phrase,
            "players": [player.dict() for player in game.players],
            "submissions": [submission.dict() for submission in game.submissions],
            "time_remaining": None,
            "round_active": game.round_active,
            "winner_id": game.winner_id,
            "judge_player_id": game.judge_player_id
        })
        
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # You can handle any incoming WebSocket messages here if needed
    except WebSocketDisconnect:
        active_connections[game_id].remove(websocket)
    finally:
        if websocket in active_connections.get(game_id, []):
            active_connections[game_id].remove(websocket) 