# Onowl IDE Backend API

This is the secure, production-ready Node.js + Express backend for the Onowl AI Coding IDE. It proxies chat requests from the frontend to the **NVIDIA NIM DeepSeek API**, ensuring that API keys remain completely secure and hidden from the client.

## Features

- **Secure API Key Handling**: The NVIDIA NIM key is strictly stored in `.env` and never exposed.
- **NVIDIA NIM Integration**: Uses the `openai` SDK mapped to `https://integrate.api.nvidia.com/v1`.
- **Server-Sent Events (SSE)**: Streams AI responses back to the frontend chunk-by-chunk for a smooth, real-time typing effect.
- **Security & Reliability**: 
  - `cors` configured to prevent unauthorized domain access.
  - `express-rate-limit` to prevent API abuse.
  - `joi` for strict request validation (messages, temperature, max_tokens).
  - Built-in retry logic via the OpenAI SDK.
  - Global error handling and `morgan` HTTP logging.

## Getting Started

### 1. Install Dependencies
Navigate to the `backend` directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
A `.env` file has already been generated containing your API key. If deploying to production, ensure you update the `CORS_ORIGIN` variable to match your frontend domain.

Variables in `.env`:
- `NVIDIA_NIM_API_KEY`: Your secret NIM API key.
- `PORT`: The port the server runs on (default: 5000).
- `NODE_ENV`: Set to `production` or `development`.
- `CORS_ORIGIN`: The URL of your frontend (e.g., `http://localhost:3000`).

### 3. Run the Server
For development (with hot-reloading via nodemon):
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### `POST /api/chat`
Accepts a conversation array and streams the AI's response back.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Write a python script to reverse a string." }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "model": "deepseek-ai/deepseek-coder-33b-instruct"
}
```

**Response:**
Returns a `text/event-stream` stream containing the generated text chunks.

### `GET /api/health`
Standard health check endpoint to verify server status.