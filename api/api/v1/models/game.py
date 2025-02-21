from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

class Player(BaseModel):
    id: str
    name: str
    score: int = 0

class GifSubmission(BaseModel):
    player_id: str
    gif_url: str
    submitted_at: datetime

class Game(BaseModel):
    id: str = str(uuid.uuid4())
    judge_player_id: str
    current_phrase: Optional[str] = None
    players: List[Player] = []
    submissions: List[GifSubmission] = []
    round_start_time: Optional[datetime] = None
    round_duration_seconds: int = 900  # 15 minutes
    round_active: bool = False
    winner_id: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

class GameState(BaseModel):
    game_id: str
    is_judge: bool
    current_phrase: Optional[str]
    players: List[Player]
    submissions: List[GifSubmission]
    time_remaining: Optional[int]
    round_active: bool
    winner_id: Optional[str]

class CreateGameRequest(BaseModel):
    judge_name: str

class JoinGameRequest(BaseModel):
    player_name: str

class SubmitPhraseRequest(BaseModel):
    phrase: str

class SubmitGifRequest(BaseModel):
    gif_url: str

class SelectWinnerRequest(BaseModel):
    player_id: str 