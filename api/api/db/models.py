from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

class Player(BaseModel):
    id: str
    game_id: str
    name: str
    game_score: Optional[int] = 0

class Game(BaseModel):
    id: str
    name: Optional[str] = None
    round_num: Optional[int] = 0
    judge_player_id: Optional[str] = None
    phrase: Optional[str] = None
    round_start_ts: Optional[str] = None
    round_end_ts: Optional[str] = None
    players: list[Player] = Field(default_factory=list)
    game_status: Optional[str] = None
    host_id: Optional[str] = None


class Selection(BaseModel):
    id: str
    game_id: str
    player_id: str
    url: str
