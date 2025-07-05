
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/FeedbackForm/StarRating'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Send, CheckCircle, MessageSquare, Users, Settings, Star } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface Attendant {
  id: string
  name: string
}

interface Module {
  id: string
  name: string
}

interface ResolutionOption {
  value: string
  label: string
}

export default function FeedbackForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const [attendants, setAttendants] = useState<Attendant[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [resolutionOptions, setResolutionOptions] = useState<ResolutionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedbackData, setFeedbackData] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    attendant: '',
    module: '',
    general_rating: 0,
    clarity_rating: 0,
    problem_resolved: '',
    comments: '',
    codigo: '',
    empresa: '',
    chave: '',
    solicitante: ''
  })

  useEffect(() => {
    loadFormData()
    
    // Verificar se há dados do sessionStorage (vindos da validação)
    const savedData = sessionStorage.getItem('feedbackData')
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      console.log('Dados recebidos:', parsedData)
      
      setFormData(prev => ({
        ...prev,
        codigo: parsedData.codigo || '',
        empresa: parsedData.empresa || '',
        chave: parsedData.chave || '',
        solicitante: parsedData.solicitante || ''
      }))

      // Guardar os dados para preencher depois quando os dropdowns estiverem carregados
      setFeedbackData(parsedData)

      // Limpar os dados do sessionStorage após usar
      sessionStorage.removeItem('feedbackData')
    } else {
      // Capturar o parâmetro 'id' da URL como fallback
      const searchParams = new URLSearchParams(location.search)
      const idParam = searchParams.get('id')
      if (idParam) {
        setFormData(prev => ({ ...prev, codigo: idParam }))
      } else {
        // Se não há dados nem na sessionStorage nem na URL, redirecionar para validação
        navigate('/validacao')
      }
    }
  }, [location, navigate])

  // Efeito separado para preencher dropdowns quando os dados estiverem carregados
  useEffect(() => {
    if (feedbackData && attendants.length > 0 && modules.length > 0) {
      preencherDropdowns(feedbackData)
    }
  }, [feedbackData, attendants, modules])

  const preencherDropdowns = (dadosRecebidos: any) => {
    console.log('Preenchendo dropdowns com:', dadosRecebidos)
    console.log('Attendants disponíveis:', attendants)
    console.log('Modules disponíveis:', modules)
    
    // Preencher Atendente se existir na lista
    if (dadosRecebidos.atendente) {
      const atendenteEncontrado = attendants.find(
        attendant => attendant.name.toLowerCase() === dadosRecebidos.atendente.toLowerCase()
      )
      console.log('Atendente encontrado:', atendenteEncontrado)
      if (atendenteEncontrado) {
        setFormData(prev => ({ ...prev, attendant: atendenteEncontrado.name }))
      }
    }

    // Preencher Módulo/Sistema usando apenas a parte após os dois pontos do campo modulo
    if (dadosRecebidos.modulo) {
      // Extrair apenas a parte após os dois pontos
      const moduloParts = dadosRecebidos.modulo.split(':')
      const moduloParaBuscar = moduloParts.length > 1 ? moduloParts[1].trim() : dadosRecebidos.modulo.trim()
      
      console.log('Módulo original:', dadosRecebidos.modulo)
      console.log('Módulo para buscar:', moduloParaBuscar)
      
      const moduloEncontrado = modules.find(
        module => module.name.toLowerCase() === moduloParaBuscar.toLowerCase()
      )
      console.log('Módulo encontrado:', moduloEncontrado)
      if (moduloEncontrado) {
        setFormData(prev => ({ ...prev, module: moduloEncontrado.name }))
      }
    }
  }

  const loadFormData = async () => {
    try {
      const [attendantsRes, modulesRes, optionsRes] = await Promise.all([
        supabase.from('attendants').select('id, name').eq('active', true).order('name'),
        supabase.from('modules').select('id, name').eq('active', true).order('name'),
        supabase.from('problem_resolution_options').select('value, label').eq('active', true)
      ])

      if (attendantsRes.data) setAttendants(attendantsRes.data)
      if (modulesRes.data) setModules(modulesRes.data)
      if (optionsRes.data) setResolutionOptions(optionsRes.data)
    } catch (error) {
      console.error('Error loading form data:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do formulário",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obrigatórios
    if (!formData.attendant || !formData.module || !formData.general_rating || 
        !formData.clarity_rating || !formData.problem_resolved) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Se código está vazio, solicitar preenchimento
    if (!formData.codigo) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, preencha o código do atendimento",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Verificar se já existe um feedback com este código de atendimento
      console.log('Verificando se código já existe:', formData.codigo)
      
      const { data: existingFeedback, error: checkError } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('id_atendimento', formData.codigo)
        .maybeSingle()

      if (checkError) {
        console.error('Erro ao verificar código existente:', checkError)
        throw checkError
      }

      if (existingFeedback) {
        console.log('Feedback já existe para este código:', existingFeedback)
        toast({
          title: "Feedback já registrado",
          description: "Este código de atendimento já possui um feedback registrado anteriormente.",
        })
        
        // Redirecionar para /validacao após 2 segundos
        setTimeout(() => {
          navigate('/validacao')
        }, 2000)
        
        return
      }

      // Preparar dados para inserção
      const feedbackDataToInsert = {
        attendant: formData.attendant,
        module: formData.module,
        general_rating: formData.general_rating,
        clarity_rating: formData.clarity_rating,
        problem_resolved: formData.problem_resolved,
        comments: formData.comments || null,
        id_atendimento: formData.codigo,
        empresa: formData.empresa || null,
        chave: formData.chave || null,
        solicitante: formData.solicitante || null
      }

      console.log('Enviando dados:', feedbackDataToInsert)

      const { error } = await supabase
        .from('feedbacks')
        .insert([feedbackDataToInsert])

      if (error) {
        console.error('Erro ao inserir feedback:', error)
        throw error
      }

      setSubmitted(true)
      toast({
        title: "Feedback enviado!",
        description: "Obrigado pela sua avaliação. Ela é muito importante para nós!",
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar feedback. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Enviado!</h2>
                <p className="text-gray-600 leading-relaxed">
                  Obrigado pela sua avaliação. Ela é fundamental para melhorarmos nossos serviços.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/validacao')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-medium rounded-xl"
              >
                <Send className="h-5 w-5 mr-2" />
                Enviar Novo Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header minimalista */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Avaliação de Atendimento
          </h1>
          <p className="text-gray-600">
            Sua opinião é fundamental para melhorarmos nossos serviços
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gray-900 text-white">
            <CardTitle className="text-center text-lg font-medium flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              Formulário de Avaliação
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Seleções */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <label className="block text-base font-medium text-gray-900">
                      Atendente <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <Select value={formData.attendant} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, attendant: value }))
                  }>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl">
                      <SelectValue placeholder="Selecione o atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendants.map((attendant) => (
                        <SelectItem key={attendant.id} value={attendant.name}>
                          {attendant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <label className="block text-base font-medium text-gray-900">
                      Módulo/Sistema <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <Select value={formData.module} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, module: value }))
                  }>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl">
                      <SelectValue placeholder="Selecione o módulo/sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.name}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Avaliações */}
              <div className="space-y-6">
                <div className="border border-gray-200 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="h-5 w-5 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Avaliação Geral</h3>
                      <p className="text-sm text-gray-600">Como você avalia o atendimento de forma geral?</p>
                    </div>
                  </div>
                  <StarRating
                    label=""
                    value={formData.general_rating}
                    onChange={(value) => setFormData(prev => ({ ...prev, general_rating: value }))}
                    required
                  />
                </div>

                <div className="border border-gray-200 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Clareza da Comunicação</h3>
                      <p className="text-sm text-gray-600">O atendente foi claro em suas explicações?</p>
                    </div>
                  </div>
                  <StarRating
                    label=""
                    value={formData.clarity_rating}
                    onChange={(value) => setFormData(prev => ({ ...prev, clarity_rating: value }))}
                    required
                  />
                </div>
              </div>

              {/* Problema Resolvido */}
              <div className="border border-gray-200 p-6 rounded-xl">
                <div className="mb-4">
                  <label className="block text-lg font-medium text-gray-900 mb-2">
                    Problema Resolvido? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600">
                    Seu problema foi solucionado?
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {resolutionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, problem_resolved: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.problem_resolved === option.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentários */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <label className="block text-base font-medium text-gray-900">
                    Comentários Adicionais
                  </label>
                </div>
                <Textarea
                  placeholder="Deixe aqui suas sugestões, elogios ou comentários..."
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  className="resize-none border-2 border-gray-200 focus:border-gray-900 rounded-xl"
                />
              </div>

              {/* Botão de envio */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 text-lg font-medium rounded-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5" />
                      Enviar Feedback
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
