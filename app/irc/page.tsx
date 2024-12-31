'use client';

import { useState, useEffect, useRef } from 'react';
import { AES, enc } from 'crypto-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

// URL base según el entorno
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://custom-gen.vercel.app'
  : 'http://localhost:3000';

export default function IRCPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const connectSocket = () => {
    if (isConnecting || !session?.user?.name) return;
    
    setIsConnecting(true);
    try {
      const socket = io(BASE_URL, {
        path: '/api/socketio',
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true
      });

      socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        setIsConnecting(false);
        setConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Error de socket:', error);
        setIsConnecting(false);
        setConnected(false);
      });

      socket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
        setConnected(true);
        setIsConnecting(false);
      });

      socket.on('message', (encryptedData) => {
        try {
          console.log('Mensaje recibido (encriptado):', encryptedData);
          const decryptedMessage = AES.decrypt(encryptedData, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString(enc.Utf8);
          console.log('Mensaje desencriptado:', decryptedMessage);
          
          if (decryptedMessage && session?.user?.name) {
            // Evitar duplicar mensajes propios
            const [author] = decryptedMessage.split(':');
            const isOwnMessage = author.trim() === session.user.name;
            
            if (!isOwnMessage) {
              setMessages(prev => [...prev, decryptedMessage]);
            }
          }
        } catch (error) {
          console.error('Error al desencriptar mensaje:', error);
        }
      });

      socket.on('disconnect', () => {
        setConnected(false);
        setIsConnecting(false);
        console.log('Desconectado del servidor');
      });

      socketRef.current = socket;

    } catch (error) {
      setIsConnecting(false);
      console.error('Error al crear Socket.IO:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.name) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
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
        
        if (socketRef.current?.connected) {
          const connectionMessage = `* ${session.user.name} se ha unido al chat`;
          const encryptedMessage = AES.encrypt(connectionMessage, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString();
          socketRef.current.emit('message', encryptedMessage);
          console.log('Mensaje de conexión enviado');
        }
      } else {
        setMessages(prev => [...prev, '* Código de invitación inválido']);
      }
    } else if (connected && socketRef.current?.connected) {
      try {
        const fullMessage = `${session.user.name}: ${input}`;
        console.log('Enviando mensaje:', fullMessage);
        
        const encryptedMessage = AES.encrypt(fullMessage, process.env.NEXT_PUBLIC_IRC_INVITE_CODE || '').toString();
        socketRef.current.emit('message', encryptedMessage);
        
        // Agregar el mensaje localmente también
        setMessages(prev => [...prev, fullMessage]);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        setMessages(prev => [...prev, '* Error al enviar el mensaje']);
      }
    } else {
      console.log('No conectado:', { connected, socketConnected: socketRef.current?.connected });
      setMessages(prev => [...prev, '* No estás conectado al chat']);
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