import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Users, Clock, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AtendimentoResumo {
  atendente: string;
  data_inicio: string;
  data_fim: string;
  eficiencia_iea: number;
  em_andamento: number;
  finalizados: number;
  pendentes: number;
  periodo_tipo: string;
  taxa_resolucao: number;
  tempo_medio_minutos: number;
  tempo_total_minutos: number;
  total_atendimentos: number;
}

interface Attendant {
  id: string;
  name: string;
  active: boolean;
  photo_url: string | null;
}

export default function AtendimentosDashboard() {
  const [atendimentosResumo, setAtendimentosResumo] = useState<AtendimentoResumo[]>([]);
  const [atendentes, setAtendentes] = useState<Attendant[]>([]);
  const [selectedAtendente, setSelectedAtendente] = useState<string>('all');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('7d');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
    loadAtendentes();
  }, [selectedAtendente, selectedPeriodo]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate(selectedPeriodo);
      const endDate = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('atendimentos_resumo')
        .select('*')
        .gte('data_inicio', startDate)
        .lte('data_fim', endDate)
        .order('data_inicio', { ascending: false });

      if (selectedAtendente !== 'all') {
        query = query.eq('atendente', selectedAtendente);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do painel",
          variant: "destructive"
        });
        return;
      }

      setAtendimentosResumo(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAtendentes = async () => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('Erro ao carregar atendentes:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar atendentes",
          variant: "destructive"
        });
        return;
      }

      setAtendentes(data || []);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar atendentes",
        variant: "destructive"
      });
    }
  };

  const getStartDate = (periodo: string): string => {
    const today = new Date();
    let startDate = new Date();

    switch (periodo) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }

    return startDate.toISOString().split('T')[0];
  };

  const handleUpdateData = async () => {
    try {
      setUpdating(true);
      
      // Call the database function to update summary data
      const { error } = await supabase.rpc('atualizar_resumo_atendimentos');
      
      if (error) {
        console.error('Erro ao atualizar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar dados resumidos",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Dados resumidos atualizados com sucesso!",
        variant: "default"
      });

      // Reload the dashboard data
      await loadDashboardData();
      
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados resumidos",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard de Atendimentos</h1>
        <Button onClick={handleUpdateData} disabled={updating} className="flex items-center gap-2">
          {updating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar Dados
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Atendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Atendentes</SelectItem>
                  {atendentes.map((atendente) => (
                    <SelectItem key={atendente.id} value={atendente.name}>
                      {atendente.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {atendimentosResumo.reduce((acc, curr) => acc + curr.total_atendimentos, 0)}
            </div>
            <p className="text-sm text-gray-500">Número total de atendimentos no período.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(atendimentosResumo.reduce((acc, curr) => acc + curr.tempo_medio_minutos, 0) / atendimentosResumo.length) || 0} min
            </div>
            <p className="text-sm text-gray-500">Tempo médio gasto por atendimento.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Atendimentos Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {atendimentosResumo.reduce((acc, curr) => acc + curr.finalizados, 0)}
            </div>
            <p className="text-sm text-gray-500">Número de atendimentos que foram finalizados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Atendimentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {atendimentosResumo.reduce((acc, curr) => acc + curr.pendentes, 0)}
            </div>
            <p className="text-sm text-gray-500">Número de atendimentos que estão pendentes.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atendente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Fim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Atendimentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo Médio (min)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finalizados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendentes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {atendimentosResumo.map((resumo, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.atendente}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(resumo.data_inicio).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(resumo.data_fim).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.total_atendimentos}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.round(resumo.tempo_medio_minutos)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.finalizados}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.pendentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
