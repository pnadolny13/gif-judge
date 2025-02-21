import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from api.v1.routers.game import router as game_router

app = FastAPI(title="GIF Judge API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(game_router, prefix="/v1", tags=["game"])

@app.get("/")
async def root():
    return {"message": "Welcome to GIF Judge API"}

# to make it work with Amazon Lambda, we create a handler object
handler = Mangum(app=app)
