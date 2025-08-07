'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  User,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';

interface Message {
  id: string;
  clientName: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'trainer' | 'client';
  time: string;
  read: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Message | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messages: Message[] = [
    {
      id: '1',
      clientName: 'Maria Silva',
      lastMessage: 'Ok, vejo você amanhã!',
      time: '10:30',
      unread: true,
    },
    {
      id: '2',
      clientName: 'João Santos',
      lastMessage: 'Posso remarcar para sexta?',
      time: '09:15',
      unread: true,
    },
    {
      id: '3',
      clientName: 'Ana Costa',
      lastMessage: 'Obrigada pelo treino!',
      time: 'Ontem',
      unread: false,
    },
    {
      id: '4',
      clientName: 'Pedro Oliveira',
      lastMessage: 'Qual horário está disponível?',
      time: 'Ontem',
      unread: false,
    },
  ];

  const chatMessages: ChatMessage[] = [
    {
      id: '1',
      text: 'Oi! Tudo bem?',
      sender: 'client',
      time: '10:00',
      read: true,
    },
    {
      id: '2',
      text: 'Oi Maria! Tudo ótimo, e você?',
      sender: 'trainer',
      time: '10:05',
      read: true,
    },
    {
      id: '3',
      text: 'Gostaria de confirmar nosso treino de amanhã às 10h',
      sender: 'client',
      time: '10:20',
      read: true,
    },
    {
      id: '4',
      text: 'Perfeito! Está confirmado.',
      sender: 'trainer',
      time: '10:25',
      read: true,
    },
    {
      id: '5',
      text: 'Ok, vejo você amanhã!',
      sender: 'client',
      time: '10:30',
      read: false,
    },
  ];

  const filteredMessages = messages.filter(msg =>
    msg.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      alert(`Mensagem enviada: ${messageInput}`);
      setMessageInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/trainer">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mensagens
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Conversas</CardTitle>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar conversas..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        selectedChat?.id === message.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                      onClick={() => setSelectedChat(message)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {message.clientName}
                            </p>
                            <span className="text-xs text-gray-500">
                              {message.time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {message.lastMessage}
                          </p>
                        </div>
                        {message.unread && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Chat */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedChat.clientName}
                        </p>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'trainer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender === 'trainer'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">{msg.time}</span>
                              {msg.sender === 'trainer' && (
                                msg.read ? (
                                  <CheckCheck className="h-3 w-3 opacity-70" />
                                ) : (
                                  <Check className="h-3 w-3 opacity-70" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Selecione uma conversa para começar
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}