
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Monitor as MonitorIcon, Crown, Star, Award, Maximize2, Clock, User } from 'lucide-react';
import { getCurrentWeekDateRange, getCurrentMonthDateRange, getCurrentYearDateRange } from '@/lib/dateUtils';

interface AtendimentoMonitor {
  id: string;
  id_atendimento: string;
  atendente: string;
  data: string;
  tempo_total: number;
  resolvido: boolean;
}

interface AttendantStats {
  name: string;
  atendimentos: number;
  tempoMedio: number;
  eficienciaIEA: number;
  position: number;
}

export default function Monitor() {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [selectedRanking, setSelectedRanking] = useState('mensal');
  const [topAttendants, setTopAttendants] = useState<AttendantStats[]>([]);
  const [allAttendants, setAllAttendants] = useState<AttendantStats[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadMonitorData();
  }, [selectedPeriod, selectedRanking]);

  const getDateRange = (period: string) => {
    switch (period) {
      case 'semanal':
        return getCurrentWeekDateRange();
      case 'mensal':
        return getCurrentMonthDateRange();
      case 'anual':  
        return getCurrentYearDateRange();
      default:
        return { start: '', end: '' };
    }
  };

  const loadMonitorData = async () => {
    try {
      const { start, end } = getDateRange(selectedRanking);
      
      let query = supabase
        .from('atendimentos')
        .select('*');

      if (start && end) {
        query = query.gte('data', start).lte('data', end);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`Monitor - Dados carregados para período ${selectedRanking}:`, data?.length);
      
      if (data) {
        processAttendantData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do monitor:', error);
    }
  };

  const processAttendantData = (data: AtendimentoMonitor[]) => {
    // Agrupar por id_atendimento único
    const uniqueAtendimentos = new Map();
    data.forEach(item => {
      if (!uniqueAtendimentos.has(item.id_atendimento)) {
        uniqueAtendimentos.set(item.id_atendimento, item);
      }
    });
    const uniqueData = Array.from(uniqueAtendimentos.values());

    // Calcular estatísticas por atendente
    const attendantStats = uniqueData.reduce((acc: any, item) => {
      if (!acc[item.atendente]) {
        acc[item.atendente] = { count: 0, tempo: 0 };
      }
      acc[item.atendente].count++;
      acc[item.atendente].tempo += item.tempo_total || 0;
      return acc;
    }, {});

    // Converter para array e calcular IEA
    const attendantArray = Object.entries(attendantStats).map(([name, stats]: [string, any]) => {
      const tempoMedio = stats.tempo / stats.count;
      const iea = tempoMedio > 0 ? stats.count / tempoMedio : 0;
      return {
        name,
        atendimentos: stats.count,
        tempoMedio: Math.round(tempoMedio),
        eficienciaIEA: Math.round(iea * 100) / 100
      };
    });

    // Ordenar por eficiência IEA (descendente)
    const sortedAttendants = attendantArray
      .sort((a, b) => b.eficienciaIEA - a.eficienciaIEA)
      .map((attendant, index) => ({
        ...attendant,
        position: index + 1
      }));

    setAllAttendants(sortedAttendants);
    setTopAttendants(sortedAttendants.slice(0, 3));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getCardColor = (position: number) => {
    switch (position) {
      case 1: return 'from-purple-500 to-purple-600';
      case 2: return 'from-blue-500 to-blue-600';
      case 3: return 'from-teal-500 to-teal-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-300" />;
      case 2: return <Star className="h-6 w-6 text-gray-300" />;
      case 3: return <Award className="h-6 w-6 text-orange-300" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorIcon className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-600">Controles do Monitor</CardTitle>
            </div>
            <Button 
              variant="outline" 
              onClick={toggleFullscreen}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Tela Cheia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}
            </div>
            <Select value={selectedRanking} onValueChange={setSelectedRanking}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ranking Mensal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">Ranking Anual</SelectItem>
                <SelectItem value="mensal">Ranking Mensal</SelectItem>
                <SelectItem value="semanal">Ranking Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards dos Top 3 Atendentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topAttendants.map((attendant) => (
          <Card key={attendant.name} className={`bg-gradient-to-br ${getCardColor(attendant.position)} text-white relative overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                {getPositionIcon(attendant.position)}
                <div className="text-right">
                  <span className="text-white/80 text-sm">{attendant.position}º Lugar</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{attendant.name}</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center bg-white/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{attendant.eficienciaIEA}</div>
                  <div className="text-white/80 text-sm">IEA (Eficiência)</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{attendant.atendimentos}</div>
                    <div className="text-white/80 text-xs">Atendimentos</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{attendant.tempoMedio}min</div>
                    <div className="text-white/80 text-xs">Tempo Médio</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de Todos os Atendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Demais Atendentes Ativos - Ranking Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allAttendants.slice(3).map((attendant) => (
              <div key={attendant.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-purple-600">{attendant.position}º</span>
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{attendant.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-1">
                    <div>
                      <span className="font-medium text-purple-600">{attendant.eficienciaIEA}</span>
                      <div>IEA</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">{attendant.atendimentos}</span>
                      <div>Atend.</div>
                    </div>
                    <div>
                      <span className="font-medium text-teal-600">{attendant.tempoMedio}min</span>
                      <div>Tempo</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Informações do IEA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <MonitorIcon className="h-5 w-5" />
              Índice de Eficiência (IEA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">
                IEA = Total de Atendimentos ÷ Tempo Médio por Atendimento
              </div>
              <div className="text-xs text-gray-600">
                Quanto maior o IEA, melhor a performance do atendente. Este índice considera tanto a produtividade quanto a eficiência temporal.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Clock className="h-5 w-5" />
              Atualização Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Atualização automática a cada 5 minutos
              </div>
              <div className="text-xs text-gray-600">
                Os dados são atualizados automaticamente para garantir informações sempre atuais sobre a performance dos atendentes.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
