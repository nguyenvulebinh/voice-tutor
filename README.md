# Voice Tutor

A static web application for language learning with voice interaction capabilities. This application provides a chat interface where users can practice their language skills by speaking or typing, and receive responses both in text and audio format.

## Features

- Voice input support with real-time recording
- Text input for typing messages
- Chat interface with message history
- Text-to-Speech playback for assistant responses
- Modern, responsive UI design
- Ready for integration with external STT, TTS, and LLM services

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voice-tutor.git
cd voice-tutor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To create a production build:

```bash
npm run build
```

The static files will be generated in the `out` directory, ready to be deployed to GitHub Pages or any static hosting service.

## Integration Points

The application is designed to work with external services. To integrate with your services:

1. Speech-to-Text (STT):
   - Modify the `simulateSTT` function in `src/components/ChatInterface.tsx`
   - Replace the simulation with actual API calls to your STT service

2. Language Model (LLM):
   - Update the `handleUserMessage` function in `src/components/ChatInterface.tsx`
   - Implement the actual API call to your LLM service

3. Text-to-Speech (TTS):
   - In the `handleUserMessage` function, replace the simulated audio URL
   - Implement the actual API call to your TTS service

## License

MIT
