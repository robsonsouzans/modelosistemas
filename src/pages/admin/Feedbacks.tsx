
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star, Search, Filter, MessageSquare, Calendar, User, Building, Hash, Trophy } from 'lucide-react';

interface Feedback {
  id: string;
  attendant: string;
  general_rating: number;
  clarity_rating: number;
  problem_resolved: string;
  module: string;
  comments: string | null;
  created_at: string;
  id_atendimento: string | null;
  empresa: string | null;
  chave: string | null;
  solicitante: string | null;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </div>
  );
};

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendant, setSelectedAttendant] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedResolution, setSelectedResolution] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar feedbacks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = () => {
    let query = supabase.from('feedbacks').select('*');

    if (selectedAttendant !== 'all') {
      query = query.eq('attendant', selectedAttendant);
    }

    if (selectedModule !== 'all') {
      query = query.eq('module', selectedModule);
    }

    if (selectedRating !== 'all') {
      query = query.eq('general_rating', parseInt(selectedRating));
    }

    if (selectedResolution !== 'all') {
      query = query.eq('problem_resolved', selectedResolution);
    }

    return query.order('created_at', { ascending: false });
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const query = buildQuery();
      const { data, error } = await query;

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar filtros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedAttendant('all');
    setSelectedModule('all');
    setSelectedRating('all');
    setSelectedResolution('all');
    setSearchTerm('');
    loadFeedbacks();
  };

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.attendant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (feedback.comments && feedback.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (feedback.empresa && feedback.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (feedback.solicitante && feedback.solicitante.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUniqueValues = (key: keyof Feedback) => {
    return [...new Set(feedbacks.map(f => f[key]).filter(Boolean))];
  };

  const getResolutionBadgeColor = (resolution: string) => {
    switch (resolution.toLowerCase()) {
      case 'sim':
      case 'resolvido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'não':
      case 'nao':
      case 'não resolvido':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'parcialmente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.general_rating, 0) / feedbacks.length).toFixed(1)
    : '0';

  const resolutionRate = feedbacks.length > 0
    ? ((feedbacks.filter(f => f.problem_resolved.toLowerCase() === 'sim').length / feedbacks.length) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando feedbacks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedbacks</h1>
          <p className="text-gray-600">Avaliações e comentários dos atendimentos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Feedbacks</p>
                <p className="text-2xl font-bold">{feedbacks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold">{averageRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Resolução</p>
                <p className="text-2xl font-bold">{resolutionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Este Mês</p>
                <p className="text-2xl font-bold">
                  {feedbacks.filter(f => 
                    new Date(f.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por atendente, módulo, comentário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
              <SelectTrigger>
                <SelectValue placeholder="Atendente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Atendentes</SelectItem>
                {getUniqueValues('attendant').map((attendant) => (
                  <SelectItem key={attendant} value={attendant}>
                    {attendant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Módulos</SelectItem>
                {getUniqueValues('module').map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger>
                <SelectValue placeholder="Avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Avaliações</SelectItem>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} estrela{rating !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedResolution} onValueChange={setSelectedResolution}>
              <SelectTrigger>
                <SelectValue placeholder="Resolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Resoluções</SelectItem>
                {getUniqueValues('problem_resolved').map((resolution) => (
                  <SelectItem key={resolution} value={resolution}>
                    {resolution}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
              Aplicar Filtros
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Feedbacks */}
      <div className="grid gap-4">
        {filteredFeedbacks.map((feedback) => (
          <Card key={feedback.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{feedback.attendant}</span>
                  </div>
                  <Badge className={getResolutionBadgeColor(feedback.problem_resolved)}>
                    {feedback.problem_resolved}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(feedback.created_at).toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Avaliação Geral</p>
                  <StarRating rating={feedback.general_rating} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clareza</p>
                  <StarRating rating={feedback.clarity_rating} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Módulo:</span>
                  <span className="font-medium">{feedback.module}</span>
                </div>
                {feedback.empresa && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium">{feedback.empresa}</span>
                  </div>
                )}
                {feedback.id_atendimento && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium">{feedback.id_atendimento}</span>
                  </div>
                )}
              </div>

              {feedback.comments && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Comentários:</p>
                  <p className="text-sm">{feedback.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredFeedbacks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum feedback encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedAttendant !== 'all' || selectedModule !== 'all'
                  ? 'Tente ajustar os filtros para encontrar feedbacks.'
                  : 'Ainda não há feedbacks cadastrados.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
