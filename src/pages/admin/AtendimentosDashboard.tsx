
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Building,
  Hash,
  FileText
} from 'lucide-react';

interface Atendimento {
  id: string;
  atendente: string;
  data: string;
  tempo_total: number | null;
  resolvido: boolean | null;
  empresa: string | null;
  chave: string | null;
  tipo: string | null;
  status: string | null;
  id_atendimento: string;
  created_at: string;
  updated_at: string;
}

export default function AtendimentosDashboard() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendant, setSelectedAttendant] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAtendimentos();
  }, []);

  const loadAtendimentos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAtendimentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar atendimentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateResumoData = async () => {
    try {
      setUpdating(true);
      
      // Chamar a função SQL para atualizar os resumos
      const { error } = await supabase.rpc('atualizar_resumo_atendimentos');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Dados de resumo atualizados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao atualizar resumos:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados de resumo",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string | null, resolvido: boolean | null) => {
    if (resolvido === true || status === 'Finalizado') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Finalizado</Badge>;
    }
    if (status === 'Em Andamento') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em Andamento</Badge>;
    }
    if (status === 'Pendente') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Não Definido</Badge>;
  };

  const getUniqueValues = (key: keyof Atendimento) => {
    return [...new Set(atendimentos.map(a => a[key]).filter(Boolean))];
  };

  const filteredAtendimentos = atendimentos.filter(atendimento => {
    const matchesSearch = 
      atendimento.atendente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.id_atendimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (atendimento.empresa && atendimento.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (atendimento.chave && atendimento.chave.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAttendant = selectedAttendant === 'all' || atendimento.atendente === selectedAttendant;
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'finalizado' && (atendimento.resolvido === true || atendimento.status === 'Finalizado')) ||
      (selectedStatus === 'andamento' && atendimento.status === 'Em Andamento') ||
      (selectedStatus === 'pendente' && atendimento.status === 'Pendente');

    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && new Date(atendimento.data).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'week' && new Date(atendimento.data) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && new Date(atendimento.data) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesAttendant && matchesStatus && matchesDate;
  });

  const stats = {
    total: atendimentos.length,
    finalizados: atendimentos.filter(a => a.resolvido === true || a.status === 'Finalizado').length,
    emAndamento: atendimentos.filter(a => a.status === 'Em Andamento').length,
    pendentes: atendimentos.filter(a => a.status === 'Pendente').length,
    tempoMedio: atendimentos.filter(a => a.tempo_total).length > 0 
      ? atendimentos.filter(a => a.tempo_total).reduce((sum, a) => sum + (a.tempo_total || 0), 0) / atendimentos.filter(a => a.tempo_total).length
      : 0
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando atendimentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atendimentos</h1>
          <p className="text-gray-600">Gestão e controle de atendimentos</p>
        </div>
        <Button 
          onClick={updateResumoData}
          disabled={updating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
          {updating ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Finalizados</p>
                <p className="text-2xl font-bold">{stats.finalizados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.round(stats.tempoMedio)} min</p>
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
                  placeholder="Buscar por atendente, ID, empresa..."
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
                {getUniqueValues('atendente').map((atendente) => (
                  <SelectItem key={atendente} value={atendente}>
                    {atendente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="andamento">Em Andamento</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSelectedAttendant('all');
                setSelectedStatus('all');
                setDateFilter('all');
                setSearchTerm('');
              }}
              variant="outline"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atendimentos */}
      <div className="grid gap-4">
        {filteredAtendimentos.map((atendimento) => (
          <Card key={atendimento.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{atendimento.atendente}</span>
                  </div>
                  {getStatusBadge(atendimento.status, atendimento.resolvido)}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">{atendimento.id_atendimento}</span>
                </div>
                
                {atendimento.empresa && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium">{atendimento.empresa}</span>
                  </div>
                )}

                {atendimento.tempo_total && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Tempo:</span>
                    <span className="font-medium">{atendimento.tempo_total} min</span>
                  </div>
                )}

                {atendimento.tipo && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{atendimento.tipo}</span>
                  </div>
                )}
              </div>

              {atendimento.chave && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">Chave:</span>
                  <span className="ml-2 font-mono">{atendimento.chave}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAtendimentos.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum atendimento encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedAttendant !== 'all' || selectedStatus !== 'all' || dateFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar atendimentos.'
                  : 'Ainda não há atendimentos cadastrados.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
