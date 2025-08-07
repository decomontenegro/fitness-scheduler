'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Mail, Phone, MapPin, Send, ArrowLeft, MessageSquare, User } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular envio
    setTimeout(() => {
      setIsSubmitted(true);
      setLoading(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500">
              <ArrowLeft className="h-5 w-5" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">Entre em Contato</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Estamos aqui para ajudar você a alcançar seus objetivos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Telefone</p>
                      <p className="text-gray-600 dark:text-gray-400">(11) 99999-9999</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-gray-600 dark:text-gray-400">contato@fitscheduler.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Endereço</p>
                      <p className="text-gray-600 dark:text-gray-400">São Paulo, SP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          name="name"
                          label="Nome completo"
                          placeholder="Seu nome"
                          icon={<User className="h-5 w-5" />}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                        
                        <Input
                          type="email"
                          name="email"
                          label="Email"
                          placeholder="seu@email.com"
                          icon={<Mail className="h-5 w-5" />}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="tel"
                          name="phone"
                          label="Telefone"
                          placeholder="(11) 99999-9999"
                          icon={<Phone className="h-5 w-5" />}
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assunto
                          </label>
                          <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="input"
                            required
                          >
                            <option value="">Selecione um assunto</option>
                            <option value="duvida">Dúvida</option>
                            <option value="agendamento">Agendamento</option>
                            <option value="parceria">Parceria</option>
                            <option value="suporte">Suporte técnico</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Mensagem
                        </label>
                        <textarea
                          name="message"
                          rows={5}
                          className="input"
                          placeholder="Digite sua mensagem..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        icon={<Send className="h-5 w-5" />}
                      >
                        Enviar mensagem
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-10 w-10 text-success-600" />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Mensagem enviada!
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Recebemos sua mensagem e responderemos em breve.
                      </p>

                      <Button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            subject: '',
                            message: ''
                          });
                        }}
                        variant="outline"
                      >
                        Enviar outra mensagem
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}