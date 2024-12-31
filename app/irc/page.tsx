'use client';

import { useState, useEffect, useRef } from 'react';
import { AES, enc } from 'crypto-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function IRCPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const connectWebSocket = () => {
    if (isConnecting || !session?.user?.name) return;
    
    setIsConnecting(true);
    try {
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Conectado al servidor WebSocket');
        setIsConnecting(false);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const decryptedMessage = AES.decrypt(event.data, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString(enc.Utf8);
          if (decryptedMessage) {
            setMessages(prev => [...prev, decryptedMessage]);
          }
        } catch (error) {
          console.error('Error al desencriptar mensaje:', error);
        }
      };

      ws.onerror = () => {
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnecting(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
    } catch (error) {
      setIsConnecting(false);
      console.error('Error al crear WebSocket:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.name) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.name) return;

    if (input.startsWith('/join')) {
      const inviteCode = input.split(' ')[1]?.replace('#', '');
      if (inviteCode === process.env.NEXT_PUBLIC_IRC_INVITE_CODE) {
        setConnected(true);
        setMessages(prev => [...prev, '* Conectado al canal privado']);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const connectionMessage = `* ${session.user.name} se ha unido al chat`;
          const encryptedMessage = AES.encrypt(connectionMessage, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString();
          wsRef.current.send(encryptedMessage);
        }
      } else {
        setMessages(prev => [...prev, '* Código de invitación inválido']);
      }
    } else if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage = `${session.user.name}: ${input}`;
      const encryptedMessage = AES.encrypt(fullMessage, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString();
      wsRef.current.send(encryptedMessage);
    }

    setInput('');
  };

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chat IRC</h1>
        {session?.user?.name && (
          <span className="text-sm text-gray-400">
            Conectado como: {session.user.name}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <span className="text-gray-300">{msg}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={connected ? "Escribe un mensaje..." : "Usa /join #invitación para unirte"}
        />
      </form>
    </div>
  );
} 