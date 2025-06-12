# Voice WebSocket Tester

A comprehensive web UI for testing Voice WebSocket connections created for **abubasith456**.

## 🚀 Live Demo

Visit: https://abubasith456.github.io/voice-websocket-tester

## Features

- 🎤 **Voice Recording**: Record and send voice data via WebSocket
- 💬 **Multiple Input Types**: Text, JSON, Bytes, and Voice
- 📊 **Real-time Statistics**: Connection stats and message counters
- 🎨 **Modern UI**: Responsive design with gradient themes
- 📱 **Mobile Friendly**: Works on all devices
- 🔄 **Live Updates**: Real-time message logging

## Usage

1. **Set Base URL**: Enter your WebSocket server URL (e.g., `ws://localhost:8000`)
2. **Set Endpoint**: Enter the WebSocket endpoint (e.g., `/voice/connect`)
3. **Connect**: Click "Connect" to establish WebSocket connection
4. **Select Input Type**: Choose Text, JSON, Bytes, or Voice
5. **Send Messages**: Use the appropriate input method and send messages
6. **Monitor**: Watch real-time messages and statistics

## Development

### Local Testing
```bash
# Clone repository
git clone git@github.com:abubasith456/voice-websocket-tester.git
cd voice-websocket-tester

# Serve locally
python -m http.server 3000
# Or
npx http-server