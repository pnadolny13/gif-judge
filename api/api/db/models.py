from datetime import datetime
from typing import Any, Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

class Player(BaseModel):
    id: str
    game_id: str
    name: str
    game_score: Optional[int] = 0
    is_host: Optional[bool] = False
    is_judge: Optional[bool] = False

class GifSubmission(BaseModel):
    player_id: str
    gif_url: str
    prompt: str

class Round(BaseModel):
    id: str
    game_id: str
    judge_id: str
    prompt: Optional[str] = None
    submissions: dict[str, GifSubmission] = Field(default_factory=dict)
    winner_id: Optional[str] = None
    status: str = 'waiting'  # waiting, in_progress, judging, completed
    created_at: str
    ends_at: Optional[str] = None

class Game(BaseModel):
    id: str
    name: Optional[str] = None
    round_num: Optional[int] = 0
    judge_player_id: Optional[str] = None
    phrase: Optional[str] = None
    round_start_ts: Optional[str] = None
    round_end_ts: Optional[str] = None
    player_ids: List[str] = []
    players: Optional[List[Player]] = None
    game_status: Optional[str] = None
    host_id: Optional[str] = None


class Selection(BaseModel):
    id: str
    game_id: str
    player_id: str
    url: str
