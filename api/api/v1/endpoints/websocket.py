import time
from typing import List

from db.crud.games import get_game
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@router.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    await manager.connect(websocket)
    # 2 mins Timeout
    count = 0
    timeout = 200
    try:
        data_cache = None
        while True:
            if data_cache:
                potentially_new_data = await get_game(game_id)
                if data_cache != potentially_new_data:
                    data_cache = potentially_new_data
                    await manager.broadcast(data_cache.json())
            else:
                data_cache = await get_game(game_id)
                await manager.broadcast(data_cache.json())
            if count >= timeout:
                raise WebSocketDisconnect("Timed out.")
            count += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
