# Vatex

Vatex is a collaborative web application that converts voice and natural language to LaTeX. It provides real-time collaboration features and instant LaTeX previews.

## Features
- Voice to LaTeX conversion
- Natural language to LaTeX translation
- Real-time collaborative editing
- Live LaTeX preview
- User authentication and room management

## Setup

### Backend Setup
1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the server directory with the following:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
GROQ_API_KEY=your_groq_api_key
```

4. Start the server:
```bash
node .\src\index.js
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (Note: Force flag is required due to React version compatibility):
```bash
npm install --force
```

3. Create a .env.local file in the frontend directory:
```
NEXT_PUBLIC_BASE_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```


## Usage


- Access the application at http://localhost:3000
- Create an account or log in
- Create or join a room to start collaborating
- Use voice input or type natural language to generate LaTeX


## Technology Stack

- Frontend: Next.js, React
- Backend: Node.js, Express
- Real-time: Socket.IO
- Database: MongoDB
- LLM Integration: Groq API

## Note

Make sure to have all the necessary API keys and environment variables set up before running the application.
