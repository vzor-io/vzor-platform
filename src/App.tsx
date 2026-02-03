import { useState, useEffect, useRef } from 'react';
import Viewport3D from './components/Viewport3D_V3';
import { useWorkflowStore } from './store/WorkflowStore';
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

  // INIT SPEECH & API
  const addAgent = useWorkflowStore(state => state.addAgent);

  useEffect(() => {
    // API BRIDGE
    window.VZOR_API = {
      addNode: (label: string) => {
        console.log("VZOR API: Adding node", label);
        // Add a new agent to the store
        addAgent({
          id: `task-${Date.now()}`,
          role: 'market_analyst', // Default role for now
          status: 'running',
          inputs: ['site-input']
        });
      },
      navigate: (section: string) => {
        console.log("Navigate to", section);
      }
    };

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
    <div className="relative w-full h-full bg-black">
      <Viewport3D />
    </div>
  );
}

export default App;
