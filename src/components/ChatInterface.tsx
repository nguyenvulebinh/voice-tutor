import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio } from '@/services/stt';
import { getChatResponse, Message as ChatMessage, verifyAccessCode } from '@/services/llm';
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

const VERIFICATION_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Welcome to Voice Tutor! Please enter the access code to continue:',
    type: 'assistant'
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    text: 'Willkommen! I am your German language tutor. How can I help you today?',
    type: 'assistant'
  }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(VERIFICATION_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
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

  // Check for existing verification and access code on component mount
  useEffect(() => {
    const verified = sessionStorage.getItem('voice_tutor_verified');
    const accessCode = sessionStorage.getItem('voice_tutor_access_code');
    if (verified === 'true' && accessCode) {
      setIsVerified(true);
      setMessages([...INITIAL_MESSAGES]);
    }
  }, []);

  const startRecording = async () => {
    if (!isVerified) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true  // Better for speech recognition
        } 
      });

      // Check supported MIME types
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/mp3',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000  // Higher bitrate for better quality
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('Received audio chunk:', { size: e.data.size, type: e.data.type });
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('Audio recording completed:', { 
            chunks: chunksRef.current.length,
            totalSize: audioBlob.size, 
            type: audioBlob.type 
          });
          
          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded');
          }
          
          await handleAudioInput(audioBlob);
        } catch (error) {
          console.error('Error in onstop handler:', error);
          alert('Error processing the recording. Please try again.');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Error during recording. Please try again.');
      };

      // Request data every second to ensure we don't lose data
      mediaRecorder.start(1000);
      console.log('Started recording');
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped audio track:', track.label);
        });
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        alert('Error stopping the recording. Please refresh the page and try again.');
      }
    }
  };

  const handleAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      console.log('Processing audio...', { 
        size: audioBlob.size, 
        type: audioBlob.type,
        valid: audioBlob.size > 0 
      });

      if (!accessCode) {
        throw new Error('Access code not found. Please try logging in again.');
      }

      const sttResult = await transcribeAudio(audioBlob, accessCode);
      
      if (sttResult.error) {
        console.error('STT service error:', sttResult.error);
        throw new Error(sttResult.error);
      }
      
      if (!sttResult.data) {
        throw new Error('No transcription received');
      }

      console.log('Transcription received:', sttResult.data);
      await handleUserMessage(sttResult.data);
    } catch (error) {
      console.error('Error processing audio:', error);
      // If access code is invalid, revert to verification state
      if (error instanceof Error && error.message === 'Invalid access code') {
        setIsVerified(false);
        setAccessCode(null);
        localStorage.removeItem('voice_tutor_verified');
        localStorage.removeItem('voice_tutor_access_code');
        setMessages(VERIFICATION_MESSAGES);
      }
      alert(error instanceof Error ? error.message : 'Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerification = async (code: string) => {
    setIsProcessing(true);
    try {
      console.log('Attempting verification...');
      const isValid = await verifyAccessCode(code);
      console.log('Verification response:', isValid);
      
      if (isValid) {
        console.log('Verification successful');
        setIsVerified(true);
        setAccessCode(code);
        localStorage.setItem('voice_tutor_verified', 'true');
        localStorage.setItem('voice_tutor_access_code', code);
        setMessages([...INITIAL_MESSAGES]);
      } else {
        console.log('Verification failed');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: code,
            type: 'user'
          },
          {
            id: (Date.now() + 1).toString(),
            text: 'Invalid code. Please try again:',
            type: 'assistant'
          }
        ]);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: 'Network error during verification. Please check your internet connection and try again:',
          type: 'assistant'
        }
      ]);
    } finally {
      setInputText('');
      setIsProcessing(false);
    }
  };

  const handleUserMessage = async (text: string) => {
    if (!isVerified || !accessCode) {
      await handleVerification(text);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user'
    };
    
    // Add user message to chat history
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Create and immediately show the typing indicator
    const assistantMessage: Message = {
      id: 'temp-' + Date.now().toString(),
      text: '',  // Empty text to show only typing indicator
      type: 'assistant'
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Include all previous messages in the chat history
      const systemMessage = {
        role: 'system' as const,
        content: 'You are a German language tutor. When users make mistakes in German, provide corrections in this format:\nOriginal: "incorrect text"\nCorrection: "correct text"\nExplanation: why the correction was needed\n\nAlways respond in German first, then provide an English translation. Be encouraging and helpful.'
      };

      // Get complete chat history excluding the temporary message
      const chatHistory: ChatMessage[] = [
        systemMessage,
        ...messages
          .filter(msg => !msg.id.startsWith('temp-')) // Exclude temporary messages
          .map(msg => ({
            role: msg.type,
            content: msg.text
          })),
        {
          role: userMessage.type,
          content: userMessage.text
        }
      ];

      // Get streaming response from LLM
      const llmResponse = await getChatResponse(chatHistory, accessCode, (update) => {
        // Only update if we have actual content
        if (!update.text?.trim()) return;

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? {
                  ...msg,
                  text: update.text,
                  corrections: update.corrections
                }
              : msg
          )
        );
      });

      if (llmResponse.error) {
        // If access code is invalid, revert to verification state
        if (llmResponse.error === 'Invalid access code') {
          setIsVerified(false);
          setAccessCode(null);
          localStorage.removeItem('voice_tutor_verified');
          localStorage.removeItem('voice_tutor_access_code');
          setMessages(VERIFICATION_MESSAGES);
          throw new Error('Your session has expired. Please enter the access code again.');
        }
        throw new Error(llmResponse.error);
      }

      // Generate audio from the final response
      const responseData = llmResponse.data;
      if (responseData?.text) {
        const ttsResponse = await synthesizeSpeech({
          text: responseData.text,
          language: responseData.language || 'de'
        });

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? {
                  ...msg,
                  text: responseData.text,
                  corrections: responseData.corrections,
                  audio: ttsResponse.data
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error in conversation:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? {
                ...msg,
                text: error instanceof Error ? error.message : 'I apologize, but I encountered an error. Please try again.'
              }
            : msg
        )
      );
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

  const resetChat = () => {
    setMessages(VERIFICATION_MESSAGES);
    setIsVerified(false);
    setAccessCode(null);
    localStorage.removeItem('voice_tutor_verified');
    localStorage.removeItem('voice_tutor_access_code');
  };

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
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                  {message.type === 'assistant' && message.id.startsWith('temp-') && message.text === '' && (
                    <span className="inline-flex items-center">
                      <span className="typing-dot">.</span>
                      <span className="typing-dot">.</span>
                      <span className="typing-dot">.</span>
                    </span>
                  )}
                </p>
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
                  placeholder={isVerified ? "Type your message..." : "Enter access code..."}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-700 disabled:opacity-50"
                />
                <div className="flex items-center gap-2">
                  {isVerified && (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isProcessing}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Start recording"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className={isProcessing ? 'text-gray-300' : 'text-blue-500'} />
                        <circle cx="12" cy="12" r="4" fill={isProcessing ? '#D1D5DB' : '#3B82F6'} />
                      </svg>
                    </button>
                  )}
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

      <button onClick={resetChat} className="p-2 text-red-500 hover:text-red-600">
        Reset Chat
      </button>
    </div>
  );
} 