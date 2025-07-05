
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Monitor as MonitorIcon, TrendingUp, Users, Clock, Timer } from 'lucide-react';
import { getCurrentWeekDateRange, getCurrentMonthDateRange, getCurrentYearDateRange } from '@/lib/dateUtils';

interface MonitorStats {
  totalAtendimentos: number;  
  tempoMedio: number;
  atendimentosAtivos: number;
  eficienciaGeral: number;
}

interface AtendimentoMonitor {
  id: string;
  atendente: string;
  data: string;
  tempo_total: number;
  resolvido: boolean;
}

export default function Monitor() {
  const [stats, setStats] = useState<MonitorStats>({
    totalAtendimentos: 0,
    tempoMedio: 0,
    atendimentosAtivos: 0,
    eficienciaGeral: 0
  });

  const [selectedPeriod, setSelectedPeriod] = useState('semanal');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [attendantData, setAttendantData] = useState<any[]>([]);

  useEffect(() => {
    loadMonitorData();
  }, [selectedPeriod]);

  const getDateRange = () => {
    switch (selectedPeriod) {
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
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('atendimentos')
        .select('*');

      if (start && end) {
        query = query.gte('data', start).lte('data', end);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`Monitor - Dados carregados para período ${selectedPeriod}:`, data?.length);
      
      if (data) {
        calculateStats(data);
        generateChartData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do monitor:', error);
    }
  };

  const calculateStats = (data: AtendimentoMonitor[]) => {
    const totalAtendimentos = data.length;
    const tempoTotal = data.reduce((sum, item) => sum + (item.tempo_total || 0), 0);
    const tempoMedio = totalAtendimentos > 0 ? Math.round(tempoTotal / totalAtendimentos) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const atendimentosAtivos = data.filter(item => item.data === today && !item.resolvido).length;
    
    const resolvidos = data.filter(item => item.resolvido).length;
    const eficienciaGeral = totalAtendimentos > 0 ? Math.round((resolvidos / totalAtendimentos) * 100) : 0;

    setStats({
      totalAtendimentos,
      tempoMedio,
      atendimentosAtivos,
      eficienciaGeral
    });
  };

  const generateChartData = (data: AtendimentoMonitor[]) => {
    // Performance por período
    let groupBy = '';
    let formatKey = '';
    
    switch (selectedPeriod) {
      case 'semanal':
        groupBy = 'data';
        formatKey = 'day';
        break;
      case 'mensal':
        groupBy = 'data';
        formatKey = 'day';  
        break;
      case 'anual':
        groupBy = 'month';
        formatKey = 'month';
        break;
    }

    const performanceStats: any = {};
    
    data.forEach(item => {
      let key = '';
      if (formatKey === 'day') {
        const date = new Date(item.data);
        key = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (formatKey === 'month') {
        const date = new Date(item.data);
        key = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
      
      if (!performanceStats[key]) {
        performanceStats[key] = { count: 0, tempo: 0, resolvidos: 0 };
      }
      performanceStats[key].count++;
      performanceStats[key].tempo += item.tempo_total || 0;
      if (item.resolvido) performanceStats[key].resolvidos++;
    });

    const performanceChartData = Object.entries(performanceStats).map(([period, stats]: [string, any]) => ({
      period,
      atendimentos: stats.count,
      tempoMedio: Math.round(stats.tempo / stats.count),
      eficiencia: Math.round((stats.resolvidos / stats.count) * 100)
    })).sort((a, b) => a.period.localeCompare(b.period));

    setPerformanceData(performanceChartData);

    // Dados por atendente
    const attendantStats = data.reduce((acc: any, item) => {
      if (!acc[item.atendente]) {
        acc[item.atendente] = { count: 0, tempo: 0, resolvidos: 0 };
      }
      acc[item.atendente].count++;
      acc[item.atendente].tempo += item.tempo_total || 0;
      if (item.resolvido) acc[item.atendente].resolvidos++;
      return acc;
    }, {});

    const attendantChartData = Object.entries(attendantStats).map(([name, stats]: [string, any]) => ({
      name,
      atendimentos: stats.count,
      tempoMedio: Math.round(stats.tempo / stats.count),
      eficiencia: Math.round((stats.resolvidos / stats.count) * 100)
    }));

    setAttendantData(attendantChartData);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorIcon className="h-5 w-5" />
            Monitor de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal (Semana Atual)</SelectItem>
                <SelectItem value="mensal">Mensal (Mês Atual)</SelectItem>
                <SelectItem value="anual">Anual (Ano Atual)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Atendimentos</p>
                <p className="text-3xl font-bold">{stats.totalAtendimentos.toLocaleString()}</p>
                <p className="text-blue-100 text-xs mt-1">No período selecionado</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Tempo Médio</p>
                <p className="text-3xl font-bold">{stats.tempoMedio}</p>
                <p className="text-green-100 text-xs mt-1">Minutos por atendimento</p>
              </div>
              <Timer className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Ativos Hoje</p>
                <p className="text-3xl font-bold">{stats.atendimentosAtivos}</p>
                <p className="text-yellow-100 text-xs mt-1">Atendimentos em andamento</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Eficiência Geral</p>
                <p className="text-3xl font-bold">{stats.eficienciaGeral}%</p>
                <p className="text-purple-100 text-xs mt-1">Taxa de resolução</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  style={{ fill: '#000000', fontSize: '12px' }}
                />
                <YAxis style={{ fill: '#000000', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    color: '#000000'
                  }}
                  labelStyle={{ color: '#000000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="atendimentos" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  name="Atendimentos" 
                />
                <Line 
                  type="monotone" 
                  dataKey="eficiencia" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  name="Eficiência %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendantData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  style={{ fill: '#000000', fontSize: '12px' }}
                />
                <YAxis style={{ fill: '#000000', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    color: '#000000'
                  }}
                  labelStyle={{ color: '#000000' }}
                />
                <Bar dataKey="atendimentos" fill="#3B82F6" name="Atendimentos" />
                <Bar dataKey="eficiencia" fill="#10B981" name="Eficiência %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorIcon className="h-5 w-5" />
            Performance Detalhada por Atendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Atendente</th>
                  <th className="text-left py-3 px-4 font-semibold">Atendimentos</th>
                  <th className="text-left py-3 px-4 font-semibold">Tempo Médio (min)</th>
                  <th className="text-left py-3 px-4 font-semibold">Eficiência</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendantData.map((attendant, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{attendant.name}</td>
                    <td className="py-3 px-4">{attendant.atendimentos}</td>
                    <td className="py-3 px-4">{attendant.tempoMedio}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        attendant.eficiencia >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : attendant.eficiencia >= 60 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attendant.eficiencia}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
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
