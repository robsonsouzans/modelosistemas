
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Monitor as MonitorIcon, TrendingUp, Users, Clock, Timer, Target } from 'lucide-react';
import { getCurrentWeekDateRange, getCurrentMonthDateRange, getCurrentYearDateRange } from '@/lib/dateUtils';

interface MonitorStats {
  totalAtendimentos: number;  
  tempoMedio: number;
  atendimentosAtivos: number;
  eficienciaIEA: number;
}

interface AtendimentoMonitor {
  id: string;
  id_atendimento: string;
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
    eficienciaIEA: 0
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
      
      // Remover limitações - buscar todos os registros
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
    // Agrupar por id_atendimento único
    const uniqueAtendimentos = new Map();
    data.forEach(item => {
      if (!uniqueAtendimentos.has(item.id_atendimento)) {
        uniqueAtendimentos.set(item.id_atendimento, item);
      }
    });
    
    const uniqueData = Array.from(uniqueAtendimentos.values());
    const totalAtendimentos = uniqueData.length;
    
    const tempoTotal = uniqueData.reduce((sum, item) => sum + (item.tempo_total || 0), 0);
    const tempoMedio = totalAtendimentos > 0 ? Math.round(tempoTotal / totalAtendimentos) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const atendimentosAtivos = data.filter(item => item.data === today && !item.resolvido).length;
    
    // Nova fórmula IEA = Total de Atendimentos ÷ Tempo Médio por Atendimento
    const eficienciaIEA = tempoMedio > 0 ? totalAtendimentos / tempoMedio : 0;

    setStats({
      totalAtendimentos,
      tempoMedio,
      atendimentosAtivos,
      eficienciaIEA: Math.round(eficienciaIEA * 100) / 100 // 2 casas decimais
    });
  };

  const generateChartData = (data: AtendimentoMonitor[]) => {
    // Agrupar por id_atendimento único para contagem correta
    const uniqueAtendimentos = new Map();
    data.forEach(item => {
      if (!uniqueAtendimentos.has(item.id_atendimento)) {
        uniqueAtendimentos.set(item.id_atendimento, item);
      }
    });
    const uniqueData = Array.from(uniqueAtendimentos.values());

    // Performance por período
    const performanceStats: any = {};
    
    uniqueData.forEach(item => {
      let key = '';
      const date = new Date(item.data);
      
      if (selectedPeriod === 'anual') {
        key = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      } else {
        key = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      if (!performanceStats[key]) {
        performanceStats[key] = { count: 0, tempo: 0, resolvidos: 0 };
      }
      performanceStats[key].count++;
      performanceStats[key].tempo += item.tempo_total || 0;
      if (item.resolvido) performanceStats[key].resolvidos++;
    });

    const performanceChartData = Object.entries(performanceStats).map(([period, stats]: [string, any]) => {
      const tempoMedio = stats.tempo / stats.count;
      const iea = tempoMedio > 0 ? stats.count / tempoMedio : 0;
      return {
        period,
        atendimentos: stats.count,
        tempoMedio: Math.round(tempoMedio),
        eficienciaIEA: Math.round(iea * 100) / 100
      };
    }).sort((a, b) => a.period.localeCompare(b.period));

    setPerformanceData(performanceChartData);

    // Dados por atendente usando registros únicos
    const attendantStats = uniqueData.reduce((acc: any, item) => {
      if (!acc[item.atendente]) {
        acc[item.atendente] = { count: 0, tempo: 0, resolvidos: 0 };
      }
      acc[item.atendente].count++;
      acc[item.atendente].tempo += item.tempo_total || 0;
      if (item.resolvido) acc[item.atendente].resolvidos++;
      return acc;
    }, {});

    const attendantChartData = Object.entries(attendantStats).map(([name, stats]: [string, any]) => {
      const tempoMedio = stats.tempo / stats.count;
      const iea = tempoMedio > 0 ? stats.count / tempoMedio : 0;
      return {
        name,
        atendimentos: stats.count,
        tempoMedio: Math.round(tempoMedio),
        eficienciaIEA: Math.round(iea * 100) / 100
      };
    });

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

      {/* Cards de Estatísticas - Design Antigo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Atendimentos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAtendimentos.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">No período selecionado</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tempo Médio</p>
                <p className="text-3xl font-bold text-gray-900">{stats.tempoMedio}</p>
                <p className="text-gray-500 text-xs mt-1">Minutos por atendimento</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Timer className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Eficiência IEA</p>
                <p className="text-3xl font-bold text-gray-900">{stats.eficienciaIEA}</p>
                <p className="text-gray-500 text-xs mt-1">Total ÷ Tempo Médio</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ativos Hoje</p>
                <p className="text-3xl font-bold text-gray-900">{stats.atendimentosAtivos}</p>
                <p className="text-gray-500 text-xs mt-1">Atendimentos em andamento</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
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
                  style={{ fill: '#374151', fontSize: '12px' }}
                />
                <YAxis style={{ fill: '#374151', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    color: '#374151'
                  }}
                  labelStyle={{ color: '#374151' }}
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
                  dataKey="eficienciaIEA" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  name="Eficiência IEA" 
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
                  style={{ fill: '#374151', fontSize: '12px' }}
                />
                <YAxis style={{ fill: '#374151', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    color: '#374151'
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="atendimentos" fill="#3B82F6" name="Atendimentos" />
                <Bar dataKey="eficienciaIEA" fill="#10B981" name="Eficiência IEA" />
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
                  <th className="text-left py-3 px-4 font-semibold">Eficiência IEA</th>
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
                        attendant.eficienciaIEA >= 1.0
                          ? 'bg-green-100 text-green-800' 
                          : attendant.eficienciaIEA >= 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attendant.eficienciaIEA}
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
