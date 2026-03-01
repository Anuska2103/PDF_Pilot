"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Upload, FileAudio, FileText, Mic, Presentation, ChevronRight, X, Play, Download } from "lucide-react";

// Types
interface Message {
  role: "user" | "assistant";
  content: string | React.ReactNode;
  type?: "text" | "audio" | "file" | "jsx";
  fileUrl?: string; // For audio or file links
}

interface AudioFile {
  id: string;
  name: string;
  url: string;
  type: "overview" | "podcast";
}

export default function ResizableGrid() {
  // Initial widths for the left and right columns
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(260);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef<"left" | "right" | null>(null);

  // App State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  
  // Refs for auto-scroll and file upload
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startResizing = (direction: "left" | "right") => {
    isResizing.current = direction;
    document.body.style.cursor = "col-resize";
  };

  const stopResizing = () => {
    isResizing.current = null;
    document.body.style.cursor = "default";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isResizing.current) return;

    if (isResizing.current === "left") {
      // Set a minimum width of 150px and max of 500px
      const newWidth = Math.min(Math.max(150, e.clientX), 500);
      setLeftWidth(newWidth);
    } else if (isResizing.current === "right") {
      const newWidth = Math.min(Math.max(150, window.innerWidth - e.clientX), 500);
      setRightWidth(newWidth);
    }
  };

  // --- API Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Optimistic UI update
      setMessages(prev => [...prev, { role: "user", content: `Uploading file: ${file.name}...` }]);
      
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/upload", formData);
      setSessionId(response.data.session_id);
      
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove "Uploading..."
        { role: "user", content: `Uploaded: ${file.name}` },
        { role: "assistant", content: response.data.message }
      ]);
    } catch (error) {
      console.error("Upload failed", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to upload file." }]);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    
    if (!sessionId) {
      alert("Please upload a PDF first!");
      return;
    }

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/chat", { query: userMessage });
      // The backend expects session context ideally, but the current /chat implementation in main.py 
      // uses 'chat_graph' which might rely on global state or context injection. 
      // Looking at main.py, /chat endpoint takes ChatRequest(query: str). 
      // It implies state management might be handled differently or purely by query context if not session-bound in API definition details provided.
      // Assuming naive implementation for now based on provided main.py.
      
      setMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!sessionId) return alert("Upload a PDF first!");
    setIsLoading(true);
    try {
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/summarize", { session_id: sessionId });
      setMessages(prev => [...prev, { role: "assistant", content: `**Summary:**\n${response.data.summary}` }]);
    } catch (error) {
      console.error("Summarize failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioOverview = async () => {
    if (!sessionId) return alert("Upload a PDF first!");
    setIsLoading(true);
    try {
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/audio-overview", { session_id: sessionId });
      const audioUrl = response.data.audio_url;
          

      // Add to Left Panel list
      setAudioFiles(prev => [...prev, { 
        id: Date.now().toString(), 
        name: "Overview " + new Date().toLocaleTimeString(), 
        url: audioUrl, 
        type: "overview" 
      }]);

    } catch (error) {
      console.error("Audio Overview failed", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePodcast = async () => {
    if (!sessionId) return alert("Upload a PDF first!");
    setIsLoading(true);
    try {
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/audio-podcast", { session_id: sessionId });
      const audioUrl = response.data.audio_url;
      const script = response.data.script; // Not displayed but available
           // Add to Left Panel list
      setAudioFiles(prev => [...prev, { 
        id: Date.now().toString(), 
        name: "Podcast " + new Date().toLocaleTimeString(), 
        url: audioUrl, 
        type: "podcast" 
      }]);

    } catch (error) {
      console.error("Podcast failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscript = async () => {
    if (!sessionId) return alert("Upload a PDF first!");
    setIsLoading(true);
    try {
      const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/transcript", { session_id: sessionId });
      // Parsing the JSON string script if necessary, but endpoint returns 'script' string. 
      // If it's a JSON string, we might want to prettify it, but sticking to text for now.
      const scriptContent = typeof response.data.script === 'string' ? response.data.script : JSON.stringify(response.data.script, null, 2);

      
          setMessages(prev => [
              ...prev,
              {
                role: "assistant",
                content: `Transcript:\n\n${scriptContent}`
              }
            ]);


    } catch (error) {
      console.error("Transcript failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePPT = async () => {
    if (!sessionId) return alert("Upload a PDF first!");
    setIsLoading(true);
    try {
        // Trigger PPT outline generation
        const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/ppt-outline", { session_id: sessionId });
        const slides = response.data.slides;

        // Display in right panel
        const pptContent = (
            <div className="p-4 bg-zinc-800 rounded-lg h-full overflow-auto space-y-4">
                <h3 className="text-lg font-bold mb-2 text-white">PPT Outline</h3>
                <div className="space-y-4">
                    {slides.map((slide: any, idx: number) => (
                        <div key={idx} className="bg-zinc-700 p-3 rounded">
                            <h4 className="font-bold text-sky-400">Slide {slide.slide_number}: {slide.title}</h4>
                            <p className="text-sm text-zinc-300 italic mb-2">{slide.caption}</p>
                            <ul className="list-disc list-inside text-sm text-zinc-200">
                                {slide.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        );

        // Add to chat history
        setMessages(prev => [...prev, { 
            role: "assistant", 
            content: pptContent,
            type: "jsx"
        }]);

    } catch (error) {
        console.error("PPT Outline failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPPT = async () => {
      if (!sessionId) return alert("Upload a PDF first!");
     
      try {
        const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/download-ppt", { session_id: sessionId }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'presentation.pptx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
         console.error("Download failed", e);
      }
  }

  const handleConvertDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const response = await axios.post("https://pdf-pilot-pvvs.onrender.com/convert-pdf-to-docx", formData, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name.replace('.pdf', '') + '.docx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Successfully converted ${file.name} to DOCX and downloaded!`
          }
        ]);

      } catch (error) {
        console.error("Conversion failed", error);
      } finally {
        setIsLoading(false);
        if (e.target) e.target.value = "";
      }
  }


  return (
    <div 
      className="h-screen w-full bg-zinc-900 text-white flex  select-none"
      onMouseMove={onMouseMove}
      onMouseUp={stopResizing}
      onMouseLeave={stopResizing}
    >
      <div 
        ref={gridRef}
        className="grid h-full w-full"
        style={{ 
          gridTemplateColumns: `${leftWidth}px 4px 1fr 4px ${rightWidth}px` 
        }}
      >
        {/* Left Column: Audio Files */}
        <aside className="bg-zinc-900 flex flex-col items-center border-r border-zinc-800 overflow-y-auto">
          <div className="p-4 w-full border-b border-zinc-800">
            <h2 className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Audio Library</h2>
          </div>
          <div className="w-full p-2 space-y-2">
            {audioFiles.map(file => (
              <div key={file.id} className="p-3 bg-zinc-800 rounded hover:bg-zinc-700 transition cursor-pointer flex items-center gap-3">
                <div className="p-2 bg-zinc-900 rounded-full">
                    {file.type === 'podcast' ? <Mic size={16} className="text-purple-400"/> : <FileAudio size={16} className="text-blue-400"/>}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <audio controls src={`https://pdf-pilot-pvvs.onrender.com${file.url}`} className="w-full h-8 mt-2" />
                </div>
              </div>
            ))}
            {audioFiles.length === 0 && (
                <div className="text-center text-zinc-600 mt-10 p-4">
                    <p className="text-sm">No audio files generated yet.</p>
                </div>
            )}
          </div>
        </aside>

        {/* Left Divider */}
        <div 
          onMouseDown={() => startResizing("left")}
          className="bg-zinc-800 hover:bg-sky-500 cursor-col-resize transition-colors w-1"
        />

        {/* Center Content: Chat */}
        <main className="bg-zinc-950 flex flex-col h-full relative">
            {/* Header */}
            <div className="h-14 border-b border-zinc-900 flex items-center px-6 bg-zinc-950">
               <h1 className="font-semibold text-lg">PDF Assistant Details & Chat</h1>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
                            <Upload className="text-zinc-600" />
                        </div>
                        <p>Upload a PDF to get started</p>
                    </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none whitespace-pre-wrap' 
                            : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                        }`}>
                            {msg.type === 'jsx' ? msg.content : <Markdown rehypePlugins={[remarkGfm]}>{msg.content as string}</Markdown>}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-none animate-pulse">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition"
                        title="Upload PDF"
                    >
                        <Upload size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".pdf" 
                        className="hidden" 
                    />
                    
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask about your PDF..."
                            className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-black border-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </main>

        {/* Right Divider */}
        <div 
          onMouseDown={() => startResizing("right")}

          className="bg-zinc-800 hover:bg-sky-500 cursor-col-resize transition-colors w-1"
        />

        {/* Right Column: Actions */}
        <aside className="bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
            {/* Action Buttons Panel */}
            <div className="p-6 flex flex-wrap gap-3 content-start">
                <button onClick={handleSummarize} className="rounded-[2rem] border-[3px] px-4 py-2 border-purple-500/30 hover:border-purple-500 bg-zinc-800 hover:bg-purple-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <FileText size={16} /> Summarize
                </button>

                <button onClick={handleAudioOverview} className="rounded-[2rem] border-[3px] px-4 py-2 border-blue-500/30 hover:border-blue-500 bg-zinc-800 hover:bg-blue-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <Play size={16} /> Audio Overview
                </button>

                <button onClick={handlePodcast} className="rounded-[2rem] border-[3px] px-4 py-2 border-pink-500/30 hover:border-pink-500 bg-zinc-800 hover:bg-pink-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <Mic size={16} /> Podcast
                </button>

                <button onClick={handleTranscript} className="rounded-[2rem] border-[3px] px-4 py-2 border-yellow-500/30 hover:border-yellow-500 bg-zinc-800 hover:bg-yellow-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <FileText size={16} /> Transcript
                </button>

                <button onClick={handlePPT} className="rounded-[2rem] border-[3px] px-4 py-2 border-orange-500/30 hover:border-orange-500 bg-zinc-800 hover:bg-orange-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <Presentation size={16} /> PPT Outline
                </button>

                <button onClick={handleDownloadPPT} className="rounded-[2rem] border-[3px] px-4 py-2 border-red-500/30 hover:border-red-500 bg-zinc-800 hover:bg-red-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center">
                    <Download size={16} /> Download PPT
                </button>
                
                {/* Special Case: Hidden input for convert, button triggers it */}
                <label className="rounded-[2rem] border-[3px] px-4 py-2 border-green-500/30 hover:border-green-500 bg-zinc-800 hover:bg-green-500/10 transition text-sm flex items-center gap-2 flex-grow justify-center cursor-pointer">
                    <FileText size={16} /> PDF to Word
                    <input type="file" accept=".pdf" className="hidden" onChange={handleConvertDocx} />
                </label>
            </div>

            {/* Right Panel Info */}
            <div className="flex-1 p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="text-zinc-600 text-center text-sm italic mt-10">
                    All outputs will appear in the chat area
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
}
