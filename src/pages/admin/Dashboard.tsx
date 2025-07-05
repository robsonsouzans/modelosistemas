import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { MessageSquare, TrendingUp, CheckCircle, Clock, Award, AlertTriangle, Target, Users, Star, ThumbsUp } from 'lucide-react';
interface DashboardStats {
  totalFeedbacks: number;
  averageRating: number;
  resolutionRate: number;
  averageClarity: number;
}
interface Attendant {
  id: string;
  name: string;
}
interface Module {
  id: string;
  name: string;
}
interface AttendantPerformance {
  name: string;
  feedbacks: number;
  rating: number;
  clarity: number;
  resolved: number;
  partial: number;
  notResolved: number;
  resolutionRate: number;
  score: number;
}
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFeedbacks: 0,
    averageRating: 0,
    resolutionRate: 0,
    averageClarity: 0
  });
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedAttendant, setSelectedAttendant] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedResolution, setSelectedResolution] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [resolutionDistribution, setResolutionDistribution] = useState<any[]>([]);
  const [attendantPerformance, setAttendantPerformance] = useState<AttendantPerformance[]>([]);
  const [modulePerformance, setModulePerformance] = useState<any[]>([]);
  const [tendencyData, setTendencyData] = useState<any[]>([]);
  const [bestAttendant, setBestAttendant] = useState<string>('N/A');
  const [worstAttendant, setWorstAttendant] = useState<string>('N/A');
  const [bestModule, setBestModule] = useState<string>('N/A');
  const [scoreByAttendant, setScoreByAttendant] = useState<any[]>([]);
  const [clarityByAttendant, setClarityByAttendant] = useState<any[]>([]);
  const [ratingVsClarityData, setRatingVsClarityData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    loadInitialData();
  }, []);
  useEffect(() => {
    if (attendants.length > 0 && modules.length > 0) {
      loadDashboardData();
    }
  }, [selectedAttendant, selectedModule, selectedResolution, selectedPeriod, attendants, modules]);
  const loadInitialData = async () => {
    try {
      const [attendantsRes, modulesRes] = await Promise.all([supabase.from('attendants').select('id, name').eq('active', true).order('name'), supabase.from('modules').select('id, name').eq('active', true).order('name')]);
      if (attendantsRes.data) setAttendants(attendantsRes.data);
      if (modulesRes.data) setModules(modulesRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };
  const loadDashboardData = async () => {
    try {
      let query = supabase.from('feedbacks').select('*');

      // Apply filters
      if (selectedAttendant !== 'all') {
        query = query.eq('attendant', selectedAttendant);
      }
      if (selectedModule !== 'all') {
        query = query.eq('module', selectedModule);
      }
      if (selectedResolution !== 'all') {
        query = query.eq('problem_resolved', selectedResolution);
      }
      if (selectedPeriod !== 'all') {
        const date = new Date();
        let startDate = new Date();
        switch (selectedPeriod) {
          case '7days':
            startDate.setDate(date.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(date.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(date.getDate() - 90);
            break;
        }
        if (selectedPeriod !== 'all') {
          query = query.gte('created_at', startDate.toISOString());
        }
      }
      const {
        data: feedbacks,
        error
      } = await query;
      if (error) throw error;
      console.log('Feedbacks carregados:', feedbacks);
      const totalFeedbacks = feedbacks?.length || 0;
      if (totalFeedbacks === 0) {
        // Se não há dados, definir valores padrão
        setStats({
          totalFeedbacks: 0,
          averageRating: 0,
          resolutionRate: 0,
          averageClarity: 0
        });
        setBestAttendant('Sem dados');
        setWorstAttendant('Sem dados');
        setBestModule('Sem dados');
        setAttendantPerformance([]);
        setModulePerformance([]);
        setScoreByAttendant([]);
        setClarityByAttendant([]);
        setRatingVsClarityData([]);
        setRadarData([]);
        setRatingDistribution([]);
        setResolutionDistribution([]);
        setTendencyData([]);
        setDataLoaded(true);
        return;
      }

      // Calculate stats
      const averageRating = feedbacks.reduce((sum, f) => sum + (f.general_rating || 0), 0) / totalFeedbacks;
      const averageClarity = feedbacks.reduce((sum, f) => sum + (f.clarity_rating || 0), 0) / totalFeedbacks;
      const resolvedCount = feedbacks?.filter(f => f.problem_resolved === 'sim').length || 0;
      const resolutionRate = resolvedCount / totalFeedbacks * 100;
      setStats({
        totalFeedbacks,
        averageRating: Number(averageRating.toFixed(1)),
        resolutionRate: Number(resolutionRate.toFixed(1)),
        averageClarity: Number(averageClarity.toFixed(1))
      });

      // Rating distribution
      const ratingDist = [1, 2, 3, 4, 5].map(rating => ({
        name: `${rating} estrela${rating > 1 ? 's' : ''}`,
        value: feedbacks?.filter(f => f.general_rating === rating).length || 0,
        rating: rating
      }));
      setRatingDistribution(ratingDist);

      // Resolution distribution
      const resolutionDist = [{
        name: 'Resolvido',
        value: feedbacks?.filter(f => f.problem_resolved === 'sim').length || 0,
        color: '#10B981'
      }, {
        name: 'Parcialmente',
        value: feedbacks?.filter(f => f.problem_resolved === 'parcialmente').length || 0,
        color: '#F59E0B'
      }, {
        name: 'Não Resolvido',
        value: feedbacks?.filter(f => f.problem_resolved === 'nao').length || 0,
        color: '#EF4444'
      }];
      setResolutionDistribution(resolutionDist);

      // Attendant performance with all attendants (even without feedbacks)
      const attendantStats: AttendantPerformance[] = [];
      attendants.forEach(attendant => {
        const attendantFeedbacks = feedbacks?.filter(f => f.attendant === attendant.name) || [];
        if (attendantFeedbacks.length > 0) {
          const avgRating = attendantFeedbacks.reduce((sum, f) => sum + (f.general_rating || 0), 0) / attendantFeedbacks.length;
          const avgClarity = attendantFeedbacks.reduce((sum, f) => sum + (f.clarity_rating || 0), 0) / attendantFeedbacks.length;
          const resolved = attendantFeedbacks.filter(f => f.problem_resolved === 'sim').length;
          const partial = attendantFeedbacks.filter(f => f.problem_resolved === 'parcialmente').length;
          const notResolved = attendantFeedbacks.filter(f => f.problem_resolved === 'nao').length;
          const resolutionRate = resolved / attendantFeedbacks.length * 100;
          const score = avgRating * 0.4 + avgClarity * 0.3 + resolutionRate * 0.03;
          attendantStats.push({
            name: attendant.name,
            feedbacks: attendantFeedbacks.length,
            rating: Number(avgRating.toFixed(1)),
            clarity: Number(avgClarity.toFixed(1)),
            resolved,
            partial,
            notResolved,
            resolutionRate: Number(resolutionRate.toFixed(1)),
            score: Number(score.toFixed(1))
          });
        } else {
          // Include attendants with no feedbacks
          attendantStats.push({
            name: attendant.name,
            feedbacks: 0,
            rating: 0,
            clarity: 0,
            resolved: 0,
            partial: 0,
            notResolved: 0,
            resolutionRate: 0,
            score: 0
          });
        }
      });
      setAttendantPerformance(attendantStats);

      // Best and worst performers (only from those with data)
      const attendantsWithData = attendantStats.filter(a => a.feedbacks > 0);
      if (attendantsWithData.length > 0) {
        const sortedByScore = [...attendantsWithData].sort((a, b) => b.score - a.score);
        setBestAttendant(sortedByScore[0]?.name || 'Sem dados');
        setWorstAttendant(sortedByScore[sortedByScore.length - 1]?.name || 'Sem dados');
      } else {
        setBestAttendant('Sem dados');
        setWorstAttendant('Sem dados');
      }

      // Score by attendant for chart (only those with data)
      const scoreData = attendantsWithData.map(a => ({
        name: a.name,
        score: a.score,
        rating: a.rating,
        clarity: a.clarity
      }));
      setScoreByAttendant(scoreData);

      // Clarity by attendant (only those with data)
      const clarityData = attendantsWithData.map(a => ({
        name: a.name,
        clarity: a.clarity,
        rating: a.rating
      }));
      setClarityByAttendant(clarityData);

      // Rating vs Clarity comparison
      const ratingVsClarity = attendantsWithData.map(a => ({
        name: a.name,
        rating: a.rating,
        clarity: a.clarity
      }));
      setRatingVsClarityData(ratingVsClarity);

      // Module performance with all modules
      const moduleStats: any[] = [];
      modules.forEach(module => {
        const moduleFeedbacks = feedbacks?.filter(f => f.module === module.name) || [];
        if (moduleFeedbacks.length > 0) {
          const avgRating = moduleFeedbacks.reduce((sum, f) => sum + (f.general_rating || 0), 0) / moduleFeedbacks.length;
          const avgClarity = moduleFeedbacks.reduce((sum, f) => sum + (f.clarity_rating || 0), 0) / moduleFeedbacks.length;
          const resolved = moduleFeedbacks.filter(f => f.problem_resolved === 'sim').length;
          const resolutionRate = resolved / moduleFeedbacks.length * 100;
          moduleStats.push({
            name: module.name,
            feedbacks: moduleFeedbacks.length,
            rating: Number(avgRating.toFixed(1)),
            clarity: Number(avgClarity.toFixed(1)),
            resolutionRate: Number(resolutionRate.toFixed(1))
          });
        }
      });
      setModulePerformance(moduleStats);

      // Best module
      if (moduleStats.length > 0) {
        const bestModuleData = moduleStats.reduce((best, current) => current.rating > best.rating ? current : best);
        setBestModule(bestModuleData.name);
      } else {
        setBestModule('Sem dados');
      }

      // Radar chart data for performance comparison
      if (attendantsWithData.length > 0) {
        const radarChartData = [{
          subject: 'Rating',
          G_Braga: 0,
          Robson: 0,
          Eder: 0,
          fullMark: 5
        }, {
          subject: 'Clareza',
          G_Braga: 0,
          Robson: 0,
          Eder: 0,
          fullMark: 5
        }, {
          subject: 'Resolução',
          G_Braga: 0,
          Robson: 0,
          Eder: 0,
          fullMark: 100
        }, {
          subject: 'Score',
          G_Braga: 0,
          Robson: 0,
          Eder: 0,
          fullMark: 10
        }];
        attendantsWithData.forEach(attendant => {
          const normalizedName = attendant.name.replace(/\s/g, '_');
          radarChartData[0][normalizedName] = attendant.rating;
          radarChartData[1][normalizedName] = attendant.clarity;
          radarChartData[2][normalizedName] = attendant.resolutionRate;
          radarChartData[3][normalizedName] = attendant.score;
        });
        setRadarData(radarChartData);
      }

      // Tendency data (last 7 days)
      const last7Days = Array.from({
        length: 7
      }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      const tendencyStats = last7Days.map(date => {
        const dayFeedbacks = feedbacks?.filter(f => f.created_at.startsWith(date)) || [];
        const avgRating = dayFeedbacks.length ? dayFeedbacks.reduce((sum, f) => sum + (f.general_rating || 0), 0) / dayFeedbacks.length : 0;
        return {
          date: new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          feedbacks: dayFeedbacks.length,
          rating: Number(avgRating.toFixed(1))
        };
      });
      setTendencyData(tendencyStats);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDataLoaded(true);
    }
  };
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => <p key={index} style={{
          color: entry.color
        }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>)}
        </div>;
    }
    return null;
  };
  return <div className="space-y-6">
      {/* Header */}
      

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Atendentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Atendentes</SelectItem>
                {attendants.map(attendant => <SelectItem key={attendant.id} value={attendant.name}>
                    {attendant.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Módulos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Módulos</SelectItem>
                {modules.map(module => <SelectItem key={module.id} value={module.name}>
                    {module.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedResolution} onValueChange={setSelectedResolution}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Resoluções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Resoluções</SelectItem>
                <SelectItem value="sim">Resolvido</SelectItem>
                <SelectItem value="parcialmente">Parcialmente</SelectItem>
                <SelectItem value="nao">Não Resolvido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Todo o Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Feedbacks</p>
                <p className="text-3xl font-bold">{stats.totalFeedbacks}</p>
                <p className="text-blue-100 text-xs mt-1">Avaliações coletadas</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Avaliação Média</p>
                <p className="text-3xl font-bold">{stats.averageRating}</p>
                <p className="text-yellow-100 text-xs mt-1">De 5 estrelas</p>
              </div>
              <Star className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Taxa de Resolução</p>
                <p className="text-3xl font-bold">{stats.resolutionRate.toFixed(0)}%</p>
                <p className="text-green-100 text-xs mt-1">Problemas resolvidos</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Clareza Média</p>
                <p className="text-3xl font-bold">{stats.averageClarity}</p>
                <p className="text-purple-100 text-xs mt-1">Clareza do atendimento</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Melhor Atendente</p>
                <p className="text-xl font-bold text-green-600">{bestAttendant}</p>
                <p className="text-xs text-gray-500 mt-1">Maior score geral</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precisa Melhorar</p>
                <p className="text-xl font-bold text-orange-600">{worstAttendant}</p>
                <p className="text-xs text-gray-500 mt-1">Foco em treinamento</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Melhor Módulo</p>
                <p className="text-xl font-bold text-blue-600">{bestModule}</p>
                <p className="text-xs text-gray-500 mt-1">Maior satisfação</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Performance e Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Score Geral por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreByAttendant.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreByAttendant}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#3B82F6" name="Score" />
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-300 text-gray-500">
                Nenhum dado disponível
              </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparação de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="G.Braga" dataKey="G_Braga" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Radar name="Robson" dataKey="Robson" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Radar name="Eder" dataKey="Eder" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-300 text-gray-500">
                Nenhum dado disponível
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Comparação Rating vs Clareza e Performance por Módulo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparação Rating vs Clareza
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratingVsClarityData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingVsClarityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rating" fill="#F59E0B" name="Avaliação" />
                  <Bar dataKey="clarity" fill="#06B6D4" name="Clareza" />
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-300 text-gray-500">
                Nenhum dado disponível
              </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modulePerformance.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modulePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rating" fill="#10B981" name="Avaliação" />
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-300 text-gray-500">
                Nenhum dado disponível
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Clareza por Atendente e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Clareza por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clarityByAttendant.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={clarityByAttendant}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="clarity" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Clareza" />
                </AreaChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-300 text-gray-500">
                Nenhum dado disponível
              </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={resolutionDistribution} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {resolutionDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 4 - Tendência */}
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
              <LineChart data={tendencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rating" stroke="#374151" strokeWidth={3} dot={{
                r: 6
              }} name="Avaliação" />
                <Line type="monotone" dataKey="feedbacks" stroke="#EF4444" strokeWidth={2} dot={{
                r: 4
              }} name="Feedbacks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Distribuição de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#F59E0B" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      {attendantPerformance.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Métricas Detalhadas por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Atendente</th>
                    <th className="text-left py-3 px-4 font-semibold">Feedbacks</th>
                    <th className="text-left py-3 px-4 font-semibold">Avaliação</th>
                    <th className="text-left py-3 px-4 font-semibold">Clareza</th>
                    <th className="text-left py-3 px-4 font-semibold">Resolvidos</th>
                    <th className="text-left py-3 px-4 font-semibold">Parciais</th>
                    <th className="text-left py-3 px-4 font-semibold">Não Resolvidos</th>
                    <th className="text-left py-3 px-4 font-semibold">Taxa Resolução</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {attendantPerformance.map((attendant, index) => <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{attendant.name}</td>
                      <td className="py-3 px-4">{attendant.feedbacks}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          {attendant.rating}
                        </span>
                      </td>
                      <td className="py-3 px-4">{attendant.clarity}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">{attendant.resolved}</td>
                      <td className="py-3 px-4 text-yellow-600 font-medium">{attendant.partial}</td>
                      <td className="py-3 px-4 text-red-600 font-medium">{attendant.notResolved}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${attendant.resolutionRate >= 80 ? 'bg-green-100 text-green-800' : attendant.resolutionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {attendant.resolutionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={`px-2 py-1 rounded text-xs ${attendant.score >= 4 ? 'bg-green-100 text-green-800' : attendant.score >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {attendant.score}
                        </span>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>}
    </div>;
}