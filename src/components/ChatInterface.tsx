import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from '@/services/stt';
import { getChatResponse, Message as ChatMessage } from '@/services/llm';
import { synthesizeSpeech } from '@/services/tts';
import { getMockAudio } from '@/services/api';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  audio?: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hi! I want to practice my English. Can you help me?',
    type: 'user'
  },
  {
    id: '2',
    text: "Hello! I'd be happy to help you practice English. You can either type your messages or use the microphone button to speak. I'll provide corrections and feedback to help you improve.",
    type: 'assistant',
    audio: getMockAudio()
  }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        handleAudioInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const sttResult = await transcribeAudio(audioBlob);
      if (sttResult.error) {
        throw new Error(sttResult.error);
      }
      await handleUserMessage(sttResult.data);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Convert messages to the format expected by the LLM service
      const chatHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.type,
        content: msg.text
      }));
      chatHistory.push({ role: 'user', content: text });

      // Get response from LLM
      const llmResponse = await getChatResponse(chatHistory);
      if (llmResponse.error) {
        throw new Error(llmResponse.error);
      }

      // Generate audio from the response
      const ttsResponse = await synthesizeSpeech({
        text: llmResponse.data.text,
        language: llmResponse.data.language
      });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: llmResponse.data.text,
        type: 'assistant',
        audio: ttsResponse.data,
        corrections: llmResponse.data.corrections
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in conversation:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'I apologize, but I encountered an error. Please try again.',
        type: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      handleUserMessage(inputText.trim());
    }
  };

  const playAudio = useCallback((audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] max-w-4xl mx-auto relative">
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-[76px]">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {message.corrections && message.corrections.length > 0 && (
                  <div className="mt-3 text-sm border-t border-opacity-20 border-gray-200 pt-2">
                    <p className="font-semibold mb-2">Corrections:</p>
                    {message.corrections.map((correction, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <p className="line-through text-red-500 opacity-75">{correction.original}</p>
                        <p className="text-green-500 font-medium">{correction.corrected}</p>
                        <p className="text-gray-600 text-xs mt-1">{correction.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
                {message.type === 'assistant' && message.audio && (
                  <button
                    onClick={() => playAudio(message.audio!)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    🔊 Play
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="p-4">
            {isRecording ? (
              <div className="flex items-center justify-between px-6 py-3 rounded-full bg-blue-50">
                <span className="text-gray-600">Listening...</span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-700 disabled:opacity-50"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Start recording"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className={isProcessing ? 'text-gray-300' : 'text-blue-500'} />
                      <circle cx="12" cy="12" r="4" fill={isProcessing ? '#D1D5DB' : '#3B82F6'} />
                    </svg>
                  </button>
                  {inputText.trim() && (
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 12l-6-6v3.5C7 10 4 13 4 18c2.5-3.5 6-4 10-4v3.5l6-6z" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
} 