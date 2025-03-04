# GIF Battle Game

A multiplayer party game where players compete to find the best GIF that matches a given prompt.

## Features

- Create and join games with room codes
- Real-time game state updates
- Giphy API integration for GIF search
- Judge rotation system
- Score tracking and game progression
- Beautiful, modern UI design

## Project Structure

```
gif-battle/
├── app/                    # React Native (Expo) frontend
│   ├── screens/           # Screen components
│   └── components/        # Reusable components
├── backend/               # FastAPI backend
│   ├── infrastructure/    # AWS CDK infrastructure
│   └── lambda/           # Lambda function code
└── README.md
```

## Prerequisites

- Node.js 16+
- Python 3.9+
- AWS CLI configured with appropriate credentials
- Expo CLI
- AWS CDK CLI

## Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   GIPHY_API_KEY=your_giphy_api_key
   API_URL=your_api_gateway_url
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

## Backend Setup

1. Create a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Deploy the infrastructure:
   ```bash
   cd infrastructure
   cdk deploy
   ```

## AWS Infrastructure

The backend uses the following AWS services:

- API Gateway: REST API endpoints
- Lambda: Serverless function execution
- DynamoDB: Game state storage
  - Tables:
    - gif_battle_games
    - gif_battle_players
    - gif_battle_rounds

## Game Flow

1. Host creates a game and receives a room code
2. Players join using the room code
3. Host starts the game when ready
4. Each round:
   - Judge creates a prompt
   - Players have 5 minutes to find and submit GIFs
   - Judge has 1 minute to select a winner
   - Winner gets a point and becomes the next judge
5. First player to reach 5 points wins

## Development

### Frontend Development

The frontend is built with React Native using Expo. Key files:

- `app/screens/`: Main screen components
- `app/_layout.tsx`: Navigation configuration
- `app/index.tsx`: Entry point

### Backend Development

The backend is built with FastAPI and deployed as a Lambda function:

- `backend/app.py`: Main FastAPI application
- `backend/infrastructure/`: AWS CDK infrastructure code
- `backend/lambda/`: Lambda function handler

## Deployment

1. Deploy the backend:
   ```bash
   cd backend/infrastructure
   cdk deploy
   ```

2. Update the frontend `.env` file with the new API Gateway URL

3. Build and deploy the frontend:
   ```bash
   eas build
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
