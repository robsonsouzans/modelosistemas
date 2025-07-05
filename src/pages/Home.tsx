
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, BarChart3, Users, Star, TrendingUp, CheckCircle } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  const features = [
    {
      icon: MessageSquare,
      title: "Feedback Rápido",
      description: "Sistema intuitivo de avaliação"
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Métricas detalhadas em tempo real"
    },
    {
      icon: Users,
      title: "Gestão Completa",
      description: "Controle total da equipe"
    }
  ]

  const stats = [
    { label: "Feedbacks Coletados", value: "10,000+", icon: MessageSquare },
    { label: "Taxa de Satisfação", value: "94%", icon: Star },
    { label: "Melhoria Contínua", value: "100%", icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Sistema de Feedback
              </h1>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Dashboard Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center py-20">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Central de Feedback
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transforme a experiência dos seus clientes em insights valiosos. 
              Nossa plataforma oferece análises avançadas e métricas em tempo real.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <Button 
              onClick={() => navigate('/validacao')}
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white px-12 py-4 text-lg font-medium"
            >
              <MessageSquare className="h-6 w-6 mr-2" />
              Avaliar Atendimento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <stat.icon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="group border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <feature.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final CTA */}
        <div className="bg-gray-50 rounded-2xl p-12 text-center mb-20 border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Pronto para começar?
          </h3>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            Colete feedbacks valiosos e transforme a experiência dos seus clientes em apenas alguns cliques.
          </p>
          <Button 
            onClick={() => navigate('/validacao')}
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 text-lg font-medium"
          >
            <Star className="h-5 w-5 mr-2" />
            Começar Avaliação
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-gray-900" />
            </div>
            <span className="text-xl font-bold">Sistema de Feedback</span>
          </div>
          <p className="text-gray-400">© 2024 Sistema de Feedback. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
