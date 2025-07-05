
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Hash, ArrowLeft } from 'lucide-react'

export default function CodeValidation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Verificar se há parâmetro 'id' na URL
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      setCode(idParam)
    }
  }, [searchParams])

  const validateCode = (codigo: string) => {
    const codigoRegex = /^\d{6}$/
    return codigoRegex.test(codigo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCode(code)) {
      toast({
        title: "Código inválido",
        description: "O código deve conter exatamente 6 dígitos numéricos",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      console.log('Enviando código para validação:', code)
      
      const response = await fetch('https://n8n.estoquezap.com.br/webhook/feedpro-consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: code
        })
      })

      if (response.status === 400) {
        toast({
          title: "Código inválido",
          description: "O código informado não foi encontrado. Verifique e tente novamente.",
          variant: "destructive"
        })
        return
      }

      if (!response.ok) {
        throw new Error('Erro na validação do código')
      }

      const data = await response.json()
      console.log('Resposta do webhook:', data)

      // Armazenar os dados no sessionStorage para usar na página de feedback
      sessionStorage.setItem('feedbackData', JSON.stringify({
        codigo: code,
        atendente: data.atendente || '',
        modulo: data.descricao || '',
        empresa: data.empresa || '',
        chave: data.chave || '',
        solicitante: data.solicitante || ''
      }))

      // Redirecionar para a página de feedback
      navigate('/feedback')
      
    } catch (error) {
      console.error('Erro ao validar código:', error)
      toast({
        title: "Código não válido",
        description: "O código informado não foi encontrado. Verifique e tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header minimalista */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Hash className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Validação de Código
          </h1>
          <p className="text-gray-600">
            Digite o código de 6 dígitos do seu atendimento
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de Código */}
              <div className="text-center">
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(value)
                  }}
                  maxLength={6}
                  className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-2 border-gray-200 focus:border-gray-900 rounded-xl bg-white"
                  autoFocus
                />
                <div className="mt-2 text-sm text-gray-500">
                  {code.length}/6 dígitos
                </div>
              </div>

              {/* Botão de Validação */}
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 text-lg font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Validando...
                  </div>
                ) : (
                  'Avaliar Atendimento'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
