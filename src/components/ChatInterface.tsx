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
    text: 'Welcome to Voice Tutor! Please enter the access code to continue',
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
    const verified = localStorage.getItem('voice_tutor_verified');
    const storedAccessCode = localStorage.getItem('voice_tutor_access_code');
    const storedMessages = localStorage.getItem('voice_tutor_messages');
    
    if (verified === 'true' && storedAccessCode) {
      setIsVerified(true);
      setAccessCode(storedAccessCode);
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        } catch (e) {
          console.error('Error parsing stored messages:', e);
          setMessages([...INITIAL_MESSAGES]);
        }
      } else {
        setMessages([...INITIAL_MESSAGES]);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isVerified) {
      localStorage.setItem('voice_tutor_messages', JSON.stringify(messages));
    }
  }, [messages, isVerified]);

  useEffect(() => {
    // Handle page refresh/unload
    const handleBeforeUnload = () => {
      localStorage.removeItem('voice_tutor_verified');
      localStorage.removeItem('voice_tutor_access_code');
      localStorage.removeItem('voice_tutor_messages');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
      const isValid = await verifyAccessCode(code).catch(error => {
        console.error('Verification fetch error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        throw new Error('Failed to connect to the verification server. Please check your internet connection and try again.');
      });
      console.log('Verification response:', isValid);
      
      if (isValid) {
        console.log('Verification successful');
        setIsVerified(true);
        setAccessCode(code);
        localStorage.setItem('voice_tutor_verified', 'true');
        localStorage.setItem('voice_tutor_access_code', code);
        setMessages([...INITIAL_MESSAGES]);
        localStorage.setItem('voice_tutor_messages', JSON.stringify(INITIAL_MESSAGES));
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
            text: 'Invalid code. Please try again',
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
          text: error instanceof Error ? error.message : 'Network error during verification. Please check your internet connection and try again.',
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
      // Get complete chat history excluding the temporary message
      const chatHistory: ChatMessage[] = messages
        .filter(msg => !msg.id.startsWith('temp-')) // Exclude temporary messages
        .map(msg => ({
          role: msg.type,
          content: msg.text
        }))
        .concat({
          role: userMessage.type,
          content: userMessage.text
        });

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
      }).catch(error => {
        console.error('Chat API fetch error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          response: error.response
        });
        // Check if error is a JSON parse error
        if (error.message?.includes('JSON')) {
          throw new Error('Received invalid response from server. Please try again.');
        }
        throw new Error('Failed to connect to the chat server. Please check your internet connection and try again.');
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
        }).catch(error => {
          console.error('TTS API fetch error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          // Don't throw error for TTS failures, just log it
          return { data: undefined };
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
                text: error instanceof Error ? error.message : 'Connection error. Please check your internet and try again.'
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
    // Reset all state variables
    setMessages(VERIFICATION_MESSAGES);
    setIsVerified(false);
    setAccessCode(null);
    setInputText('');
    setIsProcessing(false);
    setIsRecording(false);

    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    // Clear all storage
    localStorage.removeItem('voice_tutor_verified');
    localStorage.removeItem('voice_tutor_access_code');
    localStorage.removeItem('voice_tutor_messages');

    // Force scroll to top
    window.scrollTo(0, 0);
  };

  // Helper function to check if a message is verification-related
  const isVerificationMessage = (message: Message) => {
    const verificationTexts = [
      'Invalid code. Please try again',
      'Network error during verification',
      'Failed to connect to the verification server',
      'Welcome to Voice Tutor',
      'Please enter the access code'
    ];
    return message.id === 'welcome' || 
           VERIFICATION_MESSAGES.some(m => m.id === message.id) ||
           verificationTexts.some(text => message.text.includes(text));
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
                {message.type === 'assistant' && !message.id.startsWith('temp-') && 
                 !isVerificationMessage(message) && (
                  <button
                    onClick={() => {
                      // Find the user message that triggered this response
                      const messageIndex = messages.findIndex(msg => msg.id === message.id);
                      if (messageIndex > 0 && messages[messageIndex - 1].type === 'user') {
                        const userMessage = messages[messageIndex - 1];
                        // Remove this and all subsequent messages
                        setMessages(messages.slice(0, messageIndex));
                        // Regenerate response
                        handleUserMessage(userMessage.text);
                      }
                    }}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Regenerate response
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
    </div>
  );
} 