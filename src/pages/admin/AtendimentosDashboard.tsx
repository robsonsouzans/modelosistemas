import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Phone, Clock, TrendingUp, Building2, Calendar, Users, Download, Target, Award, Zap, Activity, CheckCircle, AlertCircle, Timer, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AtendimentosStats {
  totalAtendimentos: number;
  tempoMedio: number;
  eficienciaMedia: number;
  topEmpresa: string;
  ticketsPorDia: number;
  taxaResolucao: number;
  tempoResposta: number;
  produtividadeHora: number;
  finalizados: number;
  emAndamento: number;
  pendentes: number;
}

interface AtendimentoData {
  id: string;
  id_atendimento: string;
  atendente: string;
  empresa: string | null;
  tempo_total: number | null;
  data: string;
  status: string | null;
  resolvido: boolean | null;
  tipo: string | null;
  chave: string | null;
  created_at: string;
}

interface AtendentePerformance {
  atendente: string;
  totalAtendimentos: number;
  tempoMedio: number;
  tempoTotal: number;
  eficiencia: number;
  foto_url?: string;
}

interface TaskData {
  id: string;
  titulo: string;
  departamento: string;
  status: string;
  data: string;
  hora: string;
  created_at: string;
}

const COLORS = ['#8B5CF6', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#3730A3'];

const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey === 'eficiencia' ? 'IEA' : entry.name}: ${entry.dataKey === 'eficiencia' ? entry.value.toFixed(2) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTimeTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${Math.round(entry.value)} min`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-white">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AtendimentosDashboard() {
  const [stats, setStats] = useState<AtendimentosStats>({
    totalAtendimentos: 0,
    tempoMedio: 0,
    eficienciaMedia: 0,
    topEmpresa: 'N/A',
    ticketsPorDia: 0,
    taxaResolucao: 0,
    tempoResposta: 0,
    produtividadeHora: 0,
    finalizados: 0,
    emAndamento: 0,
    pendentes: 0
  });
  const [atendentes, setAtendentes] = useState<AtendentePerformance[]>([]);
  const [allActiveAttendants, setAllActiveAttendants] = useState<AtendentePerformance[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedAtendente, setSelectedAtendente] = useState('all');
  const [selectedEmpresa, setSelectedEmpresa] = useState('all');
  const [importDate, setImportDate] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [attendantPhotos, setAttendantPhotos] = useState<Map<string, string>>(new Map());
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadAttendantPhotos(),
          loadDashboardData(),
          loadTasks()
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    applyFilters();
  }, [selectedPeriod, selectedYear, selectedAtendente, selectedEmpresa]);

  const buildBaseQuery = () => {
    let query = supabase.from('atendimentos').select('*');

    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    if (selectedPeriod !== 'all') {
      query = query.gte('data', startDate.toISOString().split('T')[0]);
    }

    if (selectedYear !== 'all') {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('data', yearStart).lte('data', yearEnd);
    }

    if (selectedAtendente !== 'all') {
      query = query.eq('atendente', selectedAtendente);
    }

    if (selectedEmpresa !== 'all') {
      query = query.eq('chave', selectedEmpresa);
    }

    return query;
  };

  const loadAttendantPhotos = async () => {
    try {
      const { data } = await supabase
        .from('attendants')
        .select('name, photo_url')
        .eq('active', true);
      
      const photoMap = new Map();
      data?.forEach(attendant => {
        if (attendant.photo_url) {
          photoMap.set(attendant.name, attendant.photo_url);
        }
      });
      setAttendantPhotos(photoMap);
    } catch (error) {
      console.error('Erro ao carregar fotos dos atendentes:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: activeAttendants } = await supabase
        .from('attendants')
        .select('name')
        .eq('active', true);

      if (!activeAttendants || activeAttendants.length === 0) {
        setTasks([]);
        return;
      }

      const activeAttendantNames = activeAttendants.map(a => a.name);
      
      let query = supabase
        .from('atendimentos')
        .select('id, id_atendimento, atendente, empresa, status, data, created_at')
        .in('atendente', activeAttendantNames)
        .order('created_at', { ascending: false })
        .limit(10);

      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      if (selectedPeriod !== 'all') {
        query = query.gte('data', startDate.toISOString().split('T')[0]);
      }

      if (selectedYear !== 'all') {
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;
        query = query.gte('data', yearStart).lte('data', yearEnd);
      }

      if (selectedAtendente !== 'all') {
        query = query.eq('atendente', selectedAtendente);
      }

      if (selectedEmpresa !== 'all') {
        query = query.eq('chave', selectedEmpresa);
      }

      const { data: atendimentos } = await query;

      if (atendimentos) {
        const tasksData = atendimentos.map((atendimento) => ({
          id: atendimento.id,
          titulo: `Atendimento ${atendimento.id_atendimento} - ${atendimento.empresa || 'Sem empresa'}`,
          departamento: 'Suporte Técnico',
          status: atendimento.status || 'Sem Status',
          data: atendimento.data,
          hora: new Date(atendimento.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          created_at: atendimento.created_at
        }));
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('Carregando dados da dashboard com filtros:', {
        selectedPeriod,
        selectedYear,
        selectedAtendente,
        selectedEmpresa
      });

      const { data: activeAttendants } = await supabase
        .from('attendants')
        .select('name, photo_url')
        .eq('active', true);

      const query = buildBaseQuery();
      
      if (activeAttendants && activeAttendants.length > 0) {
        const activeAttendantNames = activeAttendants.map(a => a.name);
        query.in('atendente', activeAttendantNames);
      }

      const { data: atendimentos, error } = await query;

      if (error) throw error;

      console.log(`TOTAL de atendimentos encontrados com filtros aplicados: ${atendimentos?.length || 0}`);

      const totalAtendimentos = atendimentos?.length || 0;

      if (totalAtendimentos === 0) {
        console.log('Nenhum atendimento encontrado com os filtros aplicados');
        setStats({
          totalAtendimentos: 0,
          tempoMedio: 0,
          eficienciaMedia: 0,
          topEmpresa: 'Sem dados',
          ticketsPorDia: 0,
          taxaResolucao: 0,
          tempoResposta: 0,
          produtividadeHora: 0,
          finalizados: 0,
          emAndamento: 0,
          pendentes: 0
        });
        setAtendentes([]);
        setAllActiveAttendants([]);
        setEmpresas([]);
        setDailyData([]);
        return;
      }

      const tempoTotal = atendimentos.reduce((sum, a) => sum + (a.tempo_total || 0), 0);
      const tempoMedio = tempoTotal / totalAtendimentos;
      
      const finalizados = atendimentos.filter(a => a.status === 'Finalizado' || a.resolvido === true).length;
      const emAndamento = atendimentos.filter(a => a.status === 'Em Andamento' || (a.status !== 'Finalizado' && a.resolvido !== true && a.status !== 'Pendente')).length;
      const pendentes = atendimentos.filter(a => a.status === 'Pendente').length;
      
      const taxaResolucao = finalizados / totalAtendimentos * 100;

      const diasUnicos = new Set(atendimentos.map(a => a.data)).size;
      const ticketsPorDia = totalAtendimentos / (diasUnicos || 1);

      const produtividadeHora = ticketsPorDia / 8;

      const atendenteMap = new Map<string, { total: number; tempo: number; }>();
      atendimentos.forEach(atendimento => {
        const current = atendenteMap.get(atendimento.atendente) || { total: 0, tempo: 0 };
        current.total++;
        current.tempo += atendimento.tempo_total || 0;
        atendenteMap.set(atendimento.atendente, current);
      });

      const allActivePerformance: AtendentePerformance[] = [];
      
      if (activeAttendants) {
        activeAttendants.forEach(attendant => {
          const data = atendenteMap.get(attendant.name) || { total: 0, tempo: 0 };
          const tempoMedio = data.total > 0 ? data.tempo / data.total : 0;
          const eficiencia = tempoMedio > 0 ? data.total / tempoMedio : 0;
          
          allActivePerformance.push({
            atendente: attendant.name,
            totalAtendimentos: data.total,
            tempoMedio,
            tempoTotal: data.tempo,
            eficiencia,
            foto_url: attendant.photo_url
          });
        });
      }

      allActivePerformance.sort((a, b) => b.eficiencia - a.eficiencia);

      const atendentePerformance: AtendentePerformance[] = Array.from(atendenteMap.entries()).map(([nome, data]) => {
        const attendant = activeAttendants?.find(a => a.name === nome);
        const tempoMedio = data.tempo / data.total;
        return {
          atendente: nome,
          totalAtendimentos: data.total,
          tempoMedio,
          tempoTotal: data.tempo,
          eficiencia: data.total / tempoMedio || 0,
          foto_url: attendant?.photo_url
        };
      });

      atendentePerformance.sort((a, b) => b.eficiencia - a.eficiencia);

      setAtendentes(atendentePerformance);
      setAllActiveAttendants(allActivePerformance);

      const empresaMap = new Map<string, number>();
      atendimentos.forEach(a => {
        if (a.chave) {
          empresaMap.set(a.chave, (empresaMap.get(a.chave) || 0) + 1);
        }
      });

      const empresasData = Array.from(empresaMap.entries()).map(([nome, total]) => ({
        nome,
        total
      })).sort((a, b) => b.total - a.total).slice(0, 8);

      setEmpresas(empresasData);

      const dailyMap = new Map<string, number>();
      atendimentos.forEach(a => {
        const data = a.data;
        dailyMap.set(data, (dailyMap.get(data) || 0) + 1);
      });

      const dailyDataArray = Array.from(dailyMap.entries()).map(([data, total]) => ({
        data: new Date(data).toLocaleDateString('pt-BR'),
        total
      })).sort((a, b) => new Date(a.data.split('/').reverse().join('-')).getTime() - new Date(b.data.split('/').reverse().join('-')).getTime());

      setDailyData(dailyDataArray);

      const topEmpresa = empresasData[0]?.nome || 'Sem dados';
      const eficienciaMedia = atendentePerformance.reduce((sum, a) => sum + a.eficiencia, 0) / atendentePerformance.length || 0;

      setStats({
        totalAtendimentos,
        tempoMedio: Number(tempoMedio.toFixed(1)),
        eficienciaMedia: Number(eficienciaMedia.toFixed(2)),
        topEmpresa,
        ticketsPorDia: Number(ticketsPorDia.toFixed(1)),
        taxaResolucao: Number(taxaResolucao.toFixed(1)),
        tempoResposta: Number(tempoMedio.toFixed(1)),
        produtividadeHora: Number(produtividadeHora.toFixed(1)),
        finalizados,
        emAndamento,
        pendentes
      });

      console.log('Dados carregados com TODOS os registros filtrados:', {
        totalAtendimentos,
        finalizados,
        emAndamento,
        pendentes,
        atendentePerformance: atendentePerformance.length,
        allActivePerformance: allActivePerformance.length,
        empresas: empresasData.length
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    }
  };

  const handleDateImport = async () => {
    if (!importDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data para importação",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      console.log('Iniciando importação para a data:', importDate);
      const webhookUrl = `https://n8n.estoquezap.com.br/webhook/atendimentos?data_inicio=${importDate}&data_fim=${importDate}`;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        toast({
          title: "Importação Concluída",
          description: "Atendimentos importados com sucesso!"
        });
        loadDashboardData();
      } else {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar atendimentos. Verifique a conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Download className="h-4 w-4 text-purple-600" />
                Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Input 
                type="date" 
                value={importDate} 
                onChange={e => setImportDate(e.target.value)} 
                className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              />
              <Button onClick={handleDateImport} disabled={isImporting || !importDate} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {isImporting ? 'Importando...' : 'Importar'}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4 text-purple-600" />
                Filtros de Análise
                {isLoading && <span className="text-xs text-purple-600">(Aplicando...)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="7days">7 dias</SelectItem>
                    <SelectItem value="30days">30 dias</SelectItem>
                    <SelectItem value="90days">90 dias</SelectItem>
                    <SelectItem value="year">1 ano</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">Todos Atendentes</SelectItem>
                    {allActiveAttendants.map(a => (
                      <SelectItem key={a.atendente} value={a.atendente}>
                        {a.atendente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">Todas Empresas</SelectItem>
                    {empresas.map(e => (
                      <SelectItem key={e.nome} value={e.nome}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-center">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Aplicado</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Total Atendimentos</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalAtendimentos.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Todos os registros</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Taxa Resolução</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.taxaResolucao}<span className="text-lg">%</span></p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Resolvidos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Tempo Médio</span>
                  </div>
                  <p className="text-3xl font-bold">{Math.round(stats.tempoMedio)}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">minutos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Eficiência</span>
                  </div>
                  <p className="text-3xl font-bold">{Math.round(stats.eficienciaMedia)}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">IEA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Status dos Atendimentos (Todos os registros filtrados)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalAtendimentos.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Total de atendimentos com filtros aplicados</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Finalizados</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {stats.finalizados.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {stats.totalAtendimentos > 0 ? Math.round((stats.finalizados / stats.totalAtendimentos) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
                  <p className="text-xl font-semibold text-cyan-600 dark:text-cyan-400">
                    {stats.emAndamento.toLocaleString()}
                  </p>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">
                    {stats.totalAtendimentos > 0 ? Math.round((stats.emAndamento / stats.totalAtendimentos) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-xl font-semibold text-orange-600 dark:text-orange-400">
                    {stats.pendentes.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {stats.totalAtendimentos > 0 ? Math.round((stats.pendentes / stats.totalAtendimentos) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex overflow-hidden">
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${stats.totalAtendimentos > 0 ? (stats.finalizados / stats.totalAtendimentos) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-cyan-500 h-full" 
                  style={{ width: `${stats.totalAtendimentos > 0 ? (stats.emAndamento / stats.totalAtendimentos) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-orange-500 h-full" 
                  style={{ width: `${stats.totalAtendimentos > 0 ? (stats.pendentes / stats.totalAtendimentos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Users className="h-5 w-5 text-purple-600" />
                Performance por Atendente (Todos os registros filtrados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendentes.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={atendentes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="atendente" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        fontSize={11} 
                        stroke="#64748b" 
                      />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip content={<CustomPerformanceTooltip />} />
                      <Bar 
                        dataKey="totalAtendimentos" 
                        fill="#8B5CF6" 
                        name="Atendimentos" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
                  Nenhum dado disponível com os filtros aplicados
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Progresso (Todos os registros filtrados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Finalizados', value: stats.finalizados, color: '#8B5CF6' },
                          { name: 'Em Progresso', value: stats.emAndamento, color: '#06B6D4' }
                        ]} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {[
                          { name: 'Finalizados', value: stats.finalizados, color: '#8B5CF6' },
                          { name: 'Em Progresso', value: stats.emAndamento, color: '#06B6D4' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalAtendimentos.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Finalizados</p>
                    </div>
                    <p className="text-lg font-semibold text-purple-600">{stats.finalizados.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Em Progresso</p>
                    </div>
                    <p className="text-lg font-semibold text-cyan-600">{stats.emAndamento.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Tarefas (10 mais recentes com filtros aplicados)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">No</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Título da Tarefa</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Departamento</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length > 0 ? tasks.map((task, index) => (
                    <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{index + 1}.</td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{task.titulo}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{task.departamento}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                          task.status === 'Finalizado' && "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
                          task.status === 'Em Andamento' && "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-400",
                          task.status === 'Pendente' && "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400",
                          task.status === 'Sem Status' && "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
                        )}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {new Date(task.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {task.hora}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma tarefa encontrada com os filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Métricas de Performance (Atendentes Ordenados por Maior IEA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allActiveAttendants.length > 0 ? allActiveAttendants.slice(0, 10).map((atendente, index) => (
                <div key={atendente.atendente} className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{atendente.atendente}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="bg-purple-500 h-full" 
                          style={{ width: `${Math.min((atendente.totalAtendimentos / Math.max(...allActiveAttendants.map(a => a.totalAtendimentos), 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                      {atendente.totalAtendimentos}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhum dado de performance disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {allActiveAttendants.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Ranking de Eficiência (IEA) - Ordenado do Maior para Menor
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-4 font-normal">
                  IEA = Total de Atendimentos ÷ Tempo Médio por Atendimento
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Posição</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Foto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Atendente</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Total Atendimentos</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Tempo Médio (min)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Eficiência (IEA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allActiveAttendants.map((atendente, index) => (
                      <tr key={atendente.atendente} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            index === 0 && atendente.eficiencia > 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' : 
                            index === 1 && atendente.eficiencia > 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' : 
                            index === 2 && atendente.eficiencia > 0 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400' : 
                            'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
                          }`}>
                            {index + 1}º
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={atendente.foto_url} alt={atendente.atendente} />
                            <AvatarFallback className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                              {atendente.atendente.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{atendente.atendente}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{atendente.totalAtendimentos}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{atendente.tempoMedio.toFixed(2)}</td>
                        <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">
                          {atendente.eficiencia.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
