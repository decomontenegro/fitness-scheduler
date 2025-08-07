'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  Menu, 
  X,
  ChevronRight,
  Dumbbell,
  Heart,
  TrendingUp,
  MessageSquare,
  Shield,
  Smartphone
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Agendamento Fácil',
      description: 'Agende suas sessões em segundos com nosso calendário inteligente'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Gestão de Clientes',
      description: 'Gerencie todos seus clientes em um único lugar'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Lembretes Automáticos',
      description: 'Notificações automáticas para nunca perder um treino'
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Chat Integrado',
      description: 'Comunique-se diretamente com seus clientes pelo app'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Relatórios e Métricas',
      description: 'Acompanhe o progresso e resultados de cada cliente'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Seguro e Confiável',
      description: 'Seus dados protegidos com criptografia de ponta'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Personal Trainer',
      content: 'Revolucionou minha forma de trabalhar! Agora consigo gerenciar 50+ clientes sem stress.',
      rating: 5,
      avatar: 'CS'
    },
    {
      name: 'Ana Costa',
      role: 'Cliente',
      content: 'Super fácil de usar! Adoro poder agendar meus treinos direto pelo celular.',
      rating: 5,
      avatar: 'AC'
    },
    {
      name: 'Pedro Santos',
      role: 'Personal Trainer',
      content: 'A melhor ferramenta para personal trainers. Aumentei meu faturamento em 40%!',
      rating: 5,
      avatar: 'PS'
    }
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'R$ 49',
      period: '/mês',
      features: [
        'Até 20 clientes',
        'Agendamento ilimitado',
        'Lembretes automáticos',
        'Suporte por email'
      ],
      popular: false
    },
    {
      name: 'Profissional',
      price: 'R$ 99',
      period: '/mês',
      features: [
        'Até 100 clientes',
        'Agendamento ilimitado',
        'Chat integrado',
        'Relatórios avançados',
        'Suporte prioritário',
        'Integração com pagamentos'
      ],
      popular: true
    },
    {
      name: 'Elite',
      price: 'R$ 199',
      period: '/mês',
      features: [
        'Clientes ilimitados',
        'Todas as funcionalidades',
        'API personalizada',
        'Múltiplos trainers',
        'Suporte 24/7',
        'Treinamento personalizado'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold gradient-text">FitScheduler</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-primary-500 transition-colors">
                Recursos
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-primary-500 transition-colors">
                Depoimentos
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary-500 transition-colors">
                Preços
              </Link>
              <Link href="/schedule" className="text-gray-600 hover:text-primary-500 transition-colors font-medium">
                Agendar Treino
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Começar Grátis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="container-custom py-4 space-y-3">
              <Link href="#features" className="block py-2 text-gray-600 hover:text-primary-500">
                Recursos
              </Link>
              <Link href="#testimonials" className="block py-2 text-gray-600 hover:text-primary-500">
                Depoimentos
              </Link>
              <Link href="#pricing" className="block py-2 text-gray-600 hover:text-primary-500">
                Preços
              </Link>
              <Link href="/schedule" className="block py-2 text-gray-600 hover:text-primary-500 font-medium">
                Agendar Treino
              </Link>
              <div className="flex gap-3 pt-3">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" fullWidth size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button fullWidth size="sm">
                    Começar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="container-custom py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <Heart className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Transforme seu negócio fitness
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Gerencie seus <span className="gradient-text">treinos</span> de forma inteligente
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A plataforma completa para personal trainers modernos. 
              Agende sessões, gerencie clientes e aumente seu faturamento.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button 
                  size="lg" 
                  variant="gradient"
                  magnetic
                  glow
                  icon={<ChevronRight className="h-5 w-5" />}
                >
                  Teste Grátis por 30 dias
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  variant="glass" 
                  size="lg"
                  className="backdrop-blur-xl"
                >
                  Ver Demonstração
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">1000+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trainers ativos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">50k+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Treinos agendados</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">4.9</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avaliação</p>
              </div>
            </div>
          </div>
          
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse-soft"></div>
            <Card variant="glass" animated className="relative overflow-hidden backdrop-blur-2xl">
              <CardContent className="p-8">
                <div className="aspect-square bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl flex items-center justify-center animate-float shadow-2xl shadow-primary-500/30">
                  <Smartphone className="h-32 w-32 text-white animate-bounce-soft" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container-custom py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ferramentas poderosas para simplificar sua rotina e focar no que importa: seus clientes
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="tilt" 
              animated
              className="group hover-glow"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary-500/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container-custom py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Junte-se a milhares de profissionais satisfeitos
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning-400 text-warning-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container-custom py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planos que crescem com você
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Escolha o plano ideal para seu momento
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  fullWidth 
                  variant={plan.popular ? 'primary' : 'outline'}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom py-20">
        <Card variant="gradient" className="overflow-hidden">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de personal trainers que já revolucionaram sua forma de trabalhar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" icon={<ChevronRight className="h-5 w-5" />}>
                  Começar Teste Grátis
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Falar com Vendas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-bold">FitScheduler</span>
              </div>
              <p className="text-gray-400">
                A plataforma completa para personal trainers modernos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Recursos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Preços</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrações</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Termos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Licenças</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FitScheduler. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
