
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MessageSquare, TrendingUp, CheckCircle, Clock, Users, Timer, Target } from 'lucide-react';
import { formatDateToBrazilian } from '@/lib/dateUtils';

interface AtendimentoStats {
  totalAtendimentos: number;
  tempoMedio: number;
  taxaResolucao: number;
  atendimentosHoje: number;
}

interface Atendimento {
  id: string;
  id_atendimento: string;
  atendente: string;
  data: string;
  tempo_total: number;
  empresa: string;
  chave: string;
  tipo: string;
  status: string;
  resolvido: boolean;
  created_at: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AtendimentosDashboard() {
  const [stats, setStats] = useState<AtendimentoStats>({
    totalAtendimentos: 0,
    tempoMedio: 0,
    taxaResolucao: 0,
    atendimentosHoje: 0
  });

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [filteredAtendimentos, setFilteredAtendimentos] = useState<Atendimento[]>([]);
  
  // Opções dinâmicas dos filtros
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableAttendants, setAvailableAttendants] = useState<string[]>([]);
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedAttendant, setSelectedAttendant] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Dados dos gráficos
  const [attendantData, setAttendantData] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadAtendimentos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedYear, selectedCompany, selectedAttendant, selectedPeriod, atendimentos]);

  const loadAtendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      console.log('Atendimentos carregados:', data?.length);
      setAtendimentos(data || []);
      
      // Extrair opções únicas para filtros
      if (data) {
        // Anos únicos
        const years = [...new Set(data.map(item => item.data.split('-')[0]))].sort((a, b) => b.localeCompare(a));
        setAvailableYears(years);

        // Empresas únicas (pela chave)
        const companies = [...new Set(data.map(item => item.chave).filter(Boolean))].sort();
        setAvailableCompanies(companies);

        // Atendentes únicos
        const attendants = [...new Set(data.map(item => item.atendente))].sort();
        setAvailableAttendants(attendants);
      }
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...atendimentos];
    
    // Filtro por ano
    if (selectedYear !== 'all') {
      filtered = filtered.filter(item => item.data.startsWith(selectedYear));
    }
    
    // Filtro por empresa (chave)
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(item => item.chave === selectedCompany);
    }
    
    // Filtro por atendente
    if (selectedAttendant !== 'all') {
      filtered = filtered.filter(item => item.atendente === selectedAttendant);
    }
    
    // Filtro por período
    if (selectedPeriod !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (selectedPeriod === 'today') {
        filtered = filtered.filter(item => item.data === todayStr);
      } else if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        filtered = filtered.filter(item => item.data >= weekAgoStr && item.data <= todayStr);
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        filtered = filtered.filter(item => item.data >= monthAgoStr && item.data <= todayStr);
      }
    }

    console.log('Atendimentos filtrados:', filtered.length);
    setFilteredAtendimentos(filtered);
    calculateStats(filtered);
    generateChartData(filtered);
  };

  const calculateStats = (data: Atendimento[]) => {
    const totalAtendimentos = data.length;
    const tempoTotal = data.reduce((sum, item) => sum + (item.tempo_total || 0), 0);
    const tempoMedio = totalAtendimentos > 0 ? tempoTotal / totalAtendimentos : 0;
    const resolvidos = data.filter(item => item.resolvido).length;
    const taxaResolucao = totalAtendimentos > 0 ? (resolvidos / totalAtendimentos) * 100 : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const atendimentosHoje = data.filter(item => item.data === today).length;

    setStats({
      totalAtendimentos,
      tempoMedio: Math.round(tempoMedio),
      taxaResolucao: Math.round(taxaResolucao),
      atendimentosHoje
    });
  };

  const generateChartData = (data: Atendimento[]) => {
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
      taxaResolucao: Math.round((stats.resolvidos / stats.count) * 100)
    }));

    setAttendantData(attendantChartData);

    // Dados por empresa
    const companyStats = data.reduce((acc: any, item) => {
      const empresa = item.chave || 'Sem Empresa';
      if (!acc[empresa]) {
        acc[empresa] = 0;
      }
      acc[empresa]++;
      return acc;
    }, {});

    const companyChartData = Object.entries(companyStats).map(([name, count]) => ({
      name,
      value: count
    }));

    setCompanyData(companyChartData);

    // Dados diários (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyStats = last7Days.map(date => {
      const dayData = data.filter(item => item.data === date);
      return {
        date: formatDateToBrazilian(date),
        atendimentos: dayData.length,
        tempoMedio: dayData.length > 0 ? Math.round(dayData.reduce((sum, item) => sum + (item.tempo_total || 0), 0) / dayData.length) : 0
      };
    });

    setDailyData(dailyStats);

    // Dados por status
    const statusStats = data.reduce((acc: any, item) => {
      const status = item.resolvido ? 'Resolvido' : 'Pendente';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusStats).map(([name, value]) => ({
      name,
      value
    }));

    setStatusData(statusChartData);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {availableCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Atendentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Atendentes</SelectItem>
                {availableAttendants.map(attendant => (
                  <SelectItem key={attendant} value={attendant}>{attendant}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Todo o Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
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
                <p className="text-blue-100 text-sm font-medium">Total de Atendimentos</p>
                <p className="text-3xl font-bold">{stats.totalAtendimentos.toLocaleString()}</p>
                <p className="text-blue-100 text-xs mt-1">Registros encontrados</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-200" />
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
                <p className="text-yellow-100 text-sm font-medium">Taxa de Resolução</p>
                <p className="text-3xl font-bold">{stats.taxaResolucao}%</p>
                <p className="text-yellow-100 text-xs mt-1">Problemas resolvidos</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Atendimentos Hoje</p>
                <p className="text-3xl font-bold">{stats.atendimentosHoje}</p>
                <p className="text-purple-100 text-xs mt-1">Registros de hoje</p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="atendimentos" fill="#3B82F6" name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribuição por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={companyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {companyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tendência - Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="atendimentos" stroke="#8884d8" strokeWidth={2} name="Atendimentos" />
                <Line type="monotone" dataKey="tempoMedio" stroke="#82ca9d" strokeWidth={2} name="Tempo Médio (min)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status dos Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Atendimentos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Atendimentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 font-semibold">Atendente</th>
                  <th className="text-left py-3 px-4 font-semibold">Empresa</th>
                  <th className="text-left py-3 px-4 font-semibold">Tempo (min)</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtendimentos.slice(0, 10).map((atendimento, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{atendimento.id_atendimento}</td>
                    <td className="py-3 px-4">{formatDateToBrazilian(atendimento.data)}</td>
                    <td className="py-3 px-4">{atendimento.atendente}</td>
                    <td className="py-3 px-4">{atendimento.chave || '-'}</td>
                    <td className="py-3 px-4">{atendimento.tempo_total || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        atendimento.resolvido 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {atendimento.resolvido ? 'Resolvido' : 'Pendente'}
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
