import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Download, Star, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
interface Feedback {
  id: string;
  attendant: string;
  module: string;
  general_rating: number;
  clarity_rating: number;
  problem_resolved: string;
  comments: string | null;
  id_atendimento: string | null;
  created_at: string;
}
export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendantFilter, setAttendantFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [resolutionFilter, setResolutionFilter] = useState('all');
  const [attendants, setAttendants] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  useEffect(() => {
    loadFeedbacks();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchTerm, attendantFilter, moduleFilter, ratingFilter, resolutionFilter]);
  const loadFeedbacks = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('feedbacks').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setFeedbacks(data || []);

      // Extract unique attendants and modules for filters
      const uniqueAttendants = [...new Set(data?.map(f => f.attendant) || [])];
      const uniqueModules = [...new Set(data?.map(f => f.module) || [])];
      setAttendants(uniqueAttendants);
      setModules(uniqueModules);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar feedbacks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = feedbacks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(feedback => feedback.attendant.toLowerCase().includes(searchTerm.toLowerCase()) || feedback.module.toLowerCase().includes(searchTerm.toLowerCase()) || feedback.comments?.toLowerCase().includes(searchTerm.toLowerCase()) || feedback.id_atendimento?.includes(searchTerm));
    }

    // Attendant filter
    if (attendantFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.attendant === attendantFilter);
    }

    // Module filter
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.module === moduleFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(feedback => feedback.general_rating === rating);
    }

    // Resolution filter
    if (resolutionFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.problem_resolved === resolutionFilter);
    }
    setFilteredFeedbacks(filtered);
  };
  const exportData = () => {
    const csvContent = [['Data', 'Hora', 'Atendente', 'Módulo', 'Avaliação Geral', 'Clareza', 'Problema Resolvido', 'ID Atendimento', 'Comentários'], ...filteredFeedbacks.map(feedback => [new Date(feedback.created_at).toLocaleDateString('pt-BR'), new Date(feedback.created_at).toLocaleTimeString('pt-BR'), feedback.attendant, feedback.module, feedback.general_rating.toString(), feedback.clarity_rating.toString(), feedback.problem_resolved, feedback.id_atendimento || '', feedback.comments || ''])].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getResolutionBadge = (resolution: string) => {
    const variants = {
      'sim': 'bg-green-100 text-green-800',
      'parcialmente': 'bg-yellow-100 text-yellow-800',
      'nao': 'bg-red-100 text-red-800'
    };
    const labels = {
      'sim': 'Sim',
      'parcialmente': 'Parcialmente',
      'nao': 'Não'
    };
    return <Badge className={variants[resolution as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {labels[resolution as keyof typeof labels] || resolution}
      </Badge>;
  };
  const renderStars = (rating: number) => {
    return <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>;
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>;
  }
  return <div className="space-y-6">
      

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Buscar por atendente, módulo, comentário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <Select value={attendantFilter} onValueChange={setAttendantFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Atendente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Atendentes</SelectItem>
                {attendants.map(attendant => <SelectItem key={attendant} value={attendant}>{attendant}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Módulos</SelectItem>
                {modules.map(module => <SelectItem key={module} value={module}>{module}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Avaliações</SelectItem>
                <SelectItem value="5">5 Estrelas</SelectItem>
                <SelectItem value="4">4 Estrelas</SelectItem>
                <SelectItem value="3">3 Estrelas</SelectItem>
                <SelectItem value="2">2 Estrelas</SelectItem>
                <SelectItem value="1">1 Estrela</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resolutionFilter} onValueChange={setResolutionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Resolução" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Resoluções</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="parcialmente">Parcialmente</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Resultados ({filteredFeedbacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>ID Atendimento</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Avaliação Geral</TableHead>
                  <TableHead>Clareza</TableHead>
                  <TableHead>Resolvido</TableHead>
                  <TableHead>Comentários</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map(feedback => <TableRow key={feedback.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(feedback.created_at).toLocaleTimeString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono">
                      {feedback.id_atendimento || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{feedback.attendant}</TableCell>
                    <TableCell>{feedback.module}</TableCell>
                    <TableCell>{renderStars(feedback.general_rating)}</TableCell>
                    <TableCell>{renderStars(feedback.clarity_rating)}</TableCell>
                    <TableCell>{getResolutionBadge(feedback.problem_resolved)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={feedback.comments || ''}>
                        {feedback.comments || '-'}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
}