
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Trophy, Target, TrendingUp, Timer, BarChart3, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AtendentePerformance {
  atendente: string;
  totalAtendimentos: number;
  tempoMedio: number;
  tempoTotal: number;
  eficiencia: number;
  foto_url?: string;
}

interface RankingStats {
  totalAtendimentos: number;
  ieaMedia: number;
  tempoMedio: number;
}

interface AtendimentoResumo {
  atendente: string;
  periodo_tipo: string;
  data_inicio: string;
  data_fim: string;
  total_atendimentos: number;
  tempo_total_minutos: number;
  tempo_medio_minutos: number;
  finalizados: number;
  em_andamento: number;
  pendentes: number;
  taxa_resolucao: number;
  eficiencia_iea: number;
}

const COLORS = ['#8B5CF6', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#5B21B6'];

export default function Monitor() {
  const [selectedPeriod, setSelectedPeriod] = useState('semanal');
  const [rankings, setRankings] = useState<AtendentePerformance[]>([]);
  const [allActiveAttendants, setAllActiveAttendants] = useState<AtendentePerformance[]>([]);
  const [stats, setStats] = useState<RankingStats>({
    totalAtendimentos: 0,
    ieaMedia: 0,
    tempoMedio: 0
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRankings();
  }, [selectedPeriod]);

  const loadRankings = async () => {
    try {
      console.log('Carregando rankings para período:', selectedPeriod);

      // Primeiro, carregue todos os atendentes ativos
      const { data: activeAttendants } = await supabase
        .from('attendants')
        .select('name, photo_url')
        .eq('active', true);

      if (!activeAttendants || activeAttendants.length === 0) {
        console.log('Nenhum atendente ativo encontrado');
        setRankings([]);
        setAllActiveAttendants([]);
        setStats({ totalAtendimentos: 0, ieaMedia: 0, tempoMedio: 0 });
        return;
      }

      // Buscar dados da tabela de resumos
      const { data: resumos, error } = await supabase
        .from('atendimentos_resumo')
        .select('*')
        .eq('periodo_tipo', selectedPeriod)
        .order('data_inicio', { ascending: false });

      if (error) {
        console.error('Erro ao buscar resumos:', error);
        throw error;
      }

      console.log(`Resumos encontrados para ${selectedPeriod}:`, resumos?.length || 0);

      if (!resumos || resumos.length === 0) {
        console.log('Nenhum resumo encontrado para o período');
        // Mostrar todos os atendentes ativos, mas com valores zerados
        const emptyPerformance: AtendentePerformance[] = activeAttendants.map(attendant => ({
          atendente: attendant.name,
          totalAtendimentos: 0,
          tempoMedio: 0,
          tempoTotal: 0,
          eficiencia: 0,
          foto_url: attendant.photo_url
        }));
        
        setRankings([]);
        setAllActiveAttendants(emptyPerformance);
        setStats({ totalAtendimentos: 0, ieaMedia: 0, tempoMedio: 0 });
        return;
      }

      // Agrupar resumos por atendente (somar dados de diferentes períodos)
      const atendenteMap = new Map<string, {
        totalAtendimentos: number;
        tempoTotal: number;
        eficienciaTotal: number;
        periodos: number;
      }>();

      resumos.forEach((resumo: AtendimentoResumo) => {
        const current = atendenteMap.get(resumo.atendente) || { 
          totalAtendimentos: 0, 
          tempoTotal: 0, 
          eficienciaTotal: 0, 
          periodos: 0 
        };
        
        current.totalAtendimentos += resumo.total_atendimentos;
        current.tempoTotal += resumo.tempo_total_minutos;
        current.eficienciaTotal += resumo.eficiencia_iea;
        current.periodos += 1;
        
        atendenteMap.set(resumo.atendente, current);
      });

      // Criar performance para TODOS os atendentes ativos
      const allActivePerformance: AtendentePerformance[] = activeAttendants.map(attendant => {
        const data = atendenteMap.get(attendant.name);
        
        if (!data || data.totalAtendimentos === 0) {
          return {
            atendente: attendant.name,
            totalAtendimentos: 0,
            tempoMedio: 0,
            tempoTotal: 0,
            eficiencia: 0,
            foto_url: attendant.photo_url
          };
        }

        const tempoMedio = data.tempoTotal / data.totalAtendimentos;
        const eficienciaMedia = data.eficienciaTotal / data.periodos;
        
        return {
          atendente: attendant.name,
          totalAtendimentos: data.totalAtendimentos,
          tempoMedio,
          tempoTotal: data.tempoTotal,
          eficiencia: eficienciaMedia,
          foto_url: attendant.photo_url
        };
      });

      // Filtrar apenas atendentes que têm atendimentos no período para o ranking principal
      const rankingsWithData = allActivePerformance.filter(a => a.totalAtendimentos > 0);
      
      // Ordenar por eficiência (IEA) do maior para menor
      rankingsWithData.sort((a, b) => b.eficiencia - a.eficiencia);
      allActivePerformance.sort((a, b) => b.eficiencia - a.eficiencia);

      console.log('Rankings calculados:', {
        rankingsComDados: rankingsWithData.length,
        todosAtendentesAtivos: allActivePerformance.length
      });

      setRankings(rankingsWithData);
      setAllActiveAttendants(allActivePerformance);

      // Calcular estatísticas gerais
      const totalAtendimentos = rankingsWithData.reduce((sum, a) => sum + a.totalAtendimentos, 0);
      const tempoMedio = rankingsWithData.length > 0 
        ? rankingsWithData.reduce((sum, a) => sum + a.tempoMedio, 0) / rankingsWithData.length 
        : 0;
      const ieaMedia = rankingsWithData.length > 0 
        ? rankingsWithData.reduce((sum, a) => sum + a.eficiencia, 0) / rankingsWithData.length 
        : 0;

      setStats({
        totalAtendimentos,
        ieaMedia,
        tempoMedio
      });

    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do ranking",
        variant: "destructive"
      });
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'diario': return 'Diário';
      case 'semanal': return 'Semanal';
      case 'mensal': return 'Mensal';
      case 'anual': return 'Anual';
      default: return 'Semanal';
    }
  };

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ranking Completo - {getPeriodLabel()}
            </h1>
            <button
              onClick={() => setIsFullScreen(false)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Voltar
            </button>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Atendimentos</p>
                    <p className="text-3xl font-bold">{stats.totalAtendimentos.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">IEA Médio</p>
                    <p className="text-3xl font-bold">{stats.ieaMedia.toFixed(2)}</p>
                  </div>
                  <Target className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Tempo Médio</p>
                    <p className="text-3xl font-bold">{Math.round(stats.tempoMedio)} min</p>
                  </div>
                  <Timer className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking Completo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Ranking Completo de Todos os Atendentes Ativos
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Atendimentos</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Tempo Médio (min)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">IEA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allActiveAttendants.map((atendente, index) => (
                      <tr key={atendente.atendente} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            index === 0 && atendente.totalAtendimentos > 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' : 
                            index === 1 && atendente.totalAtendimentos > 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' : 
                            index === 2 && atendente.totalAtendimentos > 0 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400' : 
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header com Filtro */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitor de Performance</h1>
            <p className="text-gray-600 dark:text-gray-400">Ranking {getPeriodLabel()} dos Atendentes</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              onClick={() => setIsFullScreen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
              Tela Cheia
            </button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Total Atendimentos</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalAtendimentos.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{getPeriodLabel()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">IEA Médio</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.ieaMedia.toFixed(2)}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Eficiência</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
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
        </div>

        {/* Top 3 Cards Coloridos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rankings.slice(0, 3).map((atendente, index) => (
            <Card key={atendente.atendente} className={`shadow-lg ${
              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
              'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${
                      index === 0 ? 'bg-white/20 text-white' :
                      index === 1 ? 'bg-white/20 text-white' :
                      'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <Avatar className="h-12 w-12 border-2 border-white/30">
                    <AvatarImage src={atendente.foto_url} alt={atendente.atendente} />
                    <AvatarFallback className="bg-white/20 text-white font-semibold">
                      {atendente.atendente.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{atendente.atendente}</h3>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm opacity-90">
                      <div>
                        <p className="font-medium">{atendente.totalAtendimentos}</p>
                        <p className="text-xs opacity-75">Atendimentos</p>
                      </div>
                      <div>
                        <p className="font-medium">{atendente.eficiencia.toFixed(2)}</p>
                        <p className="text-xs opacity-75">IEA</p>
                      </div>
                      <div>
                        <p className="font-medium">{atendente.tempoMedio.toFixed(1)}</p>
                        <p className="text-xs opacity-75">Tempo (min)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico e Ranking */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Gráfico de Performance */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance - {getPeriodLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankings.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankings.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="atendente" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        fontSize={10} 
                        stroke="#64748b" 
                      />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)' 
                        }} 
                      />
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
                  Nenhum dado disponível para o período {getPeriodLabel().toLowerCase()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking Lateral */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Users className="h-5 w-5 text-purple-600" />
                Ranking - {getPeriodLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {rankings.map((atendente, index) => (
                  <div key={atendente.atendente} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={atendente.foto_url} alt={atendente.atendente} />
                      <AvatarFallback className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                        {atendente.atendente.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">{atendente.atendente}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>{atendente.totalAtendimentos} atend.</span>
                        <span>IEA: {atendente.eficiencia.toFixed(1)}</span>
                        <span>{atendente.tempoMedio.toFixed(1)}min</span>
                      </div>
                    </div>
                  </div>
                ))}
                {rankings.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum atendimento encontrado no período {getPeriodLabel().toLowerCase()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
