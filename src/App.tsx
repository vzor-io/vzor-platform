import { useState, useEffect, useRef } from 'react';
import './index.css';

// Type the Bridge
declare global {
  interface Window {
    VZOR_API: {
      addNode: (label: string) => void;
      navigate: (section: string) => void;
    }
    webkitSpeechRecognition: any;
  }
}

function App() {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-detect when we are in "Work Mode" (Slide 2) based on scroll
  useEffect(() => {
    const checkScroll = () => {
      const h = document.getElementById('scroll-container')?.offsetHeight || 0;
      const y = window.scrollY;
      // If halfway down (Slide 2), show inputs
      if (y > window.innerHeight * 0.5) setInputVisible(true);
      else setInputVisible(false);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  // INIT SPEECH
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ru-RU'; // Russian by default
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceCommand = (text: string) => {
    console.log("VZOR Voice Raw:", text);
    // Remove punctuation and extra spaces for cleaner matching
    const cleanText = text.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    console.log("VZOR Voice Clean:", cleanText);

    // 1. NAVIGATION COMMANDS (Broadened Russian keywords)
    if (cleanText.includes('девелопмент') || cleanText.includes('разработ') || cleanText.includes('программир') || cleanText.includes('development')) {
      if ((window as any).VZOR_API?.enter) (window as any).VZOR_API.enter();
      window.VZOR_API?.navigate('Development');
      return;
    }
    if (cleanText.includes('финанс') || cleanText.includes('экономик') || cleanText.includes('деньг') || cleanText.includes('finance')) {
      if ((window as any).VZOR_API?.enter) (window as any).VZOR_API.enter();
      window.VZOR_API?.navigate('Finance');
      return;
    }
    if (cleanText.includes('недвиж') || cleanText.includes('эстейт') || cleanText.includes('стейт') || cleanText.includes('стройк') || cleanText.includes('estate') || cleanText.includes('state')) {
      if ((window as any).VZOR_API?.enter) (window as any).VZOR_API.enter();
      window.VZOR_API?.navigate('Real Estate');
      return;
    }

    // 2. AUTOMATIC TASK CREATION (Intent detection)
    // Common Russian patterns for "Create task..."
    const createPatterns = [
      'создать задачу', 'создай задачу', 'новая задача',
      'сделай задачу', 'добавь задачу', 'задача',
      'создать проект', 'создай проект'
    ];

    for (const pattern of createPatterns) {
      if (cleanText.startsWith(pattern)) {
        // Extract the actual task name from the original text (preserving case)
        // Find the index of pattern in lower text to slice original
        const lowerRaw = text.toLowerCase();
        const startIdx = lowerRaw.indexOf(pattern) + pattern.length;
        let taskText = text.substring(startIdx).trim();

        // Remove leading punctuation like colons if present
        taskText = taskText.replace(/^[:\-\s]+/, '');

        if (taskText && window.VZOR_API) {
          console.log("VZOR Voice Intent: CREATE TASK ->", taskText);
          if ((window as any).VZOR_API?.enter) (window as any).VZOR_API.enter();
          window.VZOR_API.addNode(taskText);
          setInputText('');
          return;
        }
      }
    }

    // 3. DEFAULT: Flow text into input for manual review/execution
    setInputText(text);
  };

  const toggleMic = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    if ((window as any).VZOR_API?.enter) (window as any).VZOR_API.enter();
    if (window.VZOR_API) window.VZOR_API.addNode(inputText);
    setInputText('');
  };

  return (
    <div className="w-full h-full pointer-events-none relative flex flex-col justify-end items-center pb-24">
      {/* 
           This overlay is totally transparent. 
           It only renders the input box when appropriate (Slide 2).
       */}

      <div className={`transition-all duration-500 transform ${inputVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} pointer-events-auto bg-black/80 backdrop-blur-md border ${isListening ? 'border-red-500' : 'border-white/20'} rounded-full flex items-center px-6 py-3 w-[600px] shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>

        {/* MIC BUTTON */}
        <button onClick={toggleMic} className={`mr-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-cyan-400 hover:text-white'} transition-colors`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={isListening ? "Listening..." : "Voice or Text Input..."}
          className="bg-transparent border-none outline-none text-white font-light tracking-wider w-full placeholder-white/30 font-[Outfit]"
        />
        <button onClick={handleSubmit} className="text-cyan-400/80 hover:text-cyan-400 ml-4 uppercase text-xs tracking-widest">
          EXECUTE
        </button>
      </div>
    </div>
  );
}

export default App;
