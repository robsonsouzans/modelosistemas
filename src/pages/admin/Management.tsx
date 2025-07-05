import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Plus, Edit, Search, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
interface ResolutionOption {
  id: string;
  value: string;
  label: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
interface Module {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
export default function Management() {
  const [resolutionOptions, setResolutionOptions] = useState<ResolutionOption[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState<ResolutionOption | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [resolutionFormData, setResolutionFormData] = useState({
    value: '',
    label: '',
    active: true
  });
  const [moduleFormData, setModuleFormData] = useState({
    name: '',
    active: true
  });
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [resolutionRes, modulesRes] = await Promise.all([supabase.from('problem_resolution_options').select('*').order('label'), supabase.from('modules').select('*').order('name')]);
      if (resolutionRes.error) throw resolutionRes.error;
      if (modulesRes.error) throw modulesRes.error;
      setResolutionOptions(resolutionRes.data || []);
      setModules(modulesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionFormData.value.trim() || !resolutionFormData.label.trim()) {
      toast({
        title: "Erro",
        description: "Valor e Label são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingResolution) {
        const {
          error
        } = await supabase.from('problem_resolution_options').update({
          value: resolutionFormData.value.trim(),
          label: resolutionFormData.label.trim(),
          active: resolutionFormData.active,
          updated_at: new Date().toISOString()
        }).eq('id', editingResolution.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Opção de resolução atualizada com sucesso"
        });
      } else {
        const {
          error
        } = await supabase.from('problem_resolution_options').insert([{
          value: resolutionFormData.value.trim(),
          label: resolutionFormData.label.trim(),
          active: resolutionFormData.active
        }]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Opção de resolução criada com sucesso"
        });
      }
      setIsResolutionDialogOpen(false);
      setEditingResolution(null);
      setResolutionFormData({
        value: '',
        label: '',
        active: true
      });
      loadData();
    } catch (error) {
      console.error('Error saving resolution option:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar opção de resolução",
        variant: "destructive"
      });
    }
  };
  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleFormData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingModule) {
        const {
          error
        } = await supabase.from('modules').update({
          name: moduleFormData.name.trim(),
          active: moduleFormData.active,
          updated_at: new Date().toISOString()
        }).eq('id', editingModule.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Módulo atualizado com sucesso"
        });
      } else {
        const {
          error
        } = await supabase.from('modules').insert([{
          name: moduleFormData.name.trim(),
          active: moduleFormData.active
        }]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Módulo criado com sucesso"
        });
      }
      setIsModuleDialogOpen(false);
      setEditingModule(null);
      setModuleFormData({
        name: '',
        active: true
      });
      loadData();
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar módulo",
        variant: "destructive"
      });
    }
  };
  const handleResolutionEdit = (option: ResolutionOption) => {
    setEditingResolution(option);
    setResolutionFormData({
      value: option.value,
      label: option.label,
      active: option.active
    });
    setIsResolutionDialogOpen(true);
  };
  const handleModuleEdit = (module: Module) => {
    setEditingModule(module);
    setModuleFormData({
      name: module.name,
      active: module.active
    });
    setIsModuleDialogOpen(true);
  };
  const handleResolutionStatusToggle = async (option: ResolutionOption) => {
    try {
      const {
        error
      } = await supabase.from('problem_resolution_options').update({
        active: !option.active,
        updated_at: new Date().toISOString()
      }).eq('id', option.id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: `Opção ${!option.active ? 'ativada' : 'desativada'} com sucesso`
      });
      loadData();
    } catch (error) {
      console.error('Error updating resolution status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };
  const handleModuleStatusToggle = async (module: Module) => {
    try {
      const {
        error
      } = await supabase.from('modules').update({
        active: !module.active,
        updated_at: new Date().toISOString()
      }).eq('id', module.id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: `Módulo ${!module.active ? 'ativado' : 'desativado'} com sucesso`
      });
      loadData();
    } catch (error) {
      console.error('Error updating module status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do módulo",
        variant: "destructive"
      });
    }
  };
  const handleResolutionDelete = async (option: ResolutionOption) => {
    try {
      // Check if resolution option has associated feedbacks
      const {
        data: feedbacks,
        error: feedbackError
      } = await supabase.from('feedbacks').select('id').eq('problem_resolved', option.value).limit(1);
      if (feedbackError) throw feedbackError;
      if (feedbacks && feedbacks.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir esta opção pois existem feedbacks associados a ela",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('problem_resolution_options').delete().eq('id', option.id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Opção de resolução excluída com sucesso"
      });
      loadData();
    } catch (error) {
      console.error('Error deleting resolution option:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir opção de resolução",
        variant: "destructive"
      });
    }
  };
  const handleModuleDelete = async (module: Module) => {
    try {
      // Check if module has associated feedbacks
      const {
        data: feedbacks,
        error: feedbackError
      } = await supabase.from('feedbacks').select('id').eq('module', module.name).limit(1);
      if (feedbackError) throw feedbackError;
      if (feedbacks && feedbacks.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir este módulo pois existem feedbacks associados a ele",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('modules').delete().eq('id', module.id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Módulo excluído com sucesso"
      });
      loadData();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir módulo",
        variant: "destructive"
      });
    }
  };
  const filteredResolutionOptions = resolutionOptions.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()) || option.value.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredModules = modules.filter(module => module.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>;
  }
  return <div className="space-y-6">
      

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resolution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resolution">Opções de Resolução</TabsTrigger>
          <TabsTrigger value="modules">Módulos/Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="resolution" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Opções de Resolução</h2>
              <p className="text-gray-600">Gerencie as opções de "Problema Resolvido?"</p>
            </div>
            <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                setEditingResolution(null);
                setResolutionFormData({
                  value: '',
                  label: '',
                  active: true
                });
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Opção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingResolution ? 'Editar Opção' : 'Nova Opção de Resolução'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleResolutionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (usado no sistema) *
                    </label>
                    <Input value={resolutionFormData.value} onChange={e => setResolutionFormData(prev => ({
                    ...prev,
                    value: e.target.value
                  }))} placeholder="ex: sim, nao, parcialmente" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label (exibido ao usuário) *
                    </label>
                    <Input value={resolutionFormData.label} onChange={e => setResolutionFormData(prev => ({
                    ...prev,
                    label: e.target.value
                  }))} placeholder="ex: Sim, Não, Parcialmente" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={resolutionFormData.active} onCheckedChange={checked => setResolutionFormData(prev => ({
                    ...prev,
                    active: checked
                  }))} />
                    <label className="text-sm font-medium text-gray-700">
                      Ativo
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsResolutionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingResolution ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResolutionOptions.map(option => <TableRow key={option.id}>
                      <TableCell className="font-mono">{option.value}</TableCell>
                      <TableCell className="font-medium">{option.label}</TableCell>
                      <TableCell>
                        <Badge variant={option.active ? "default" : "secondary"}>
                          {option.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(option.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch checked={option.active} onCheckedChange={() => handleResolutionStatusToggle(option)} />
                          <Button variant="outline" size="sm" onClick={() => handleResolutionEdit(option)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a opção "{option.label}"? 
                                  Esta ação não pode ser desfeita e só será permitida se não houver feedbacks associados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleResolutionDelete(option)} className="bg-red-600 hover:bg-red-700">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Módulos/Setores</h2>
              <p className="text-gray-600">Gerencie os módulos disponíveis no sistema</p>
            </div>
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                setEditingModule(null);
                setModuleFormData({
                  name: '',
                  active: true
                });
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleModuleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <Input value={moduleFormData.name} onChange={e => setModuleFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} placeholder="Nome do módulo/setor" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={moduleFormData.active} onCheckedChange={checked => setModuleFormData(prev => ({
                    ...prev,
                    active: checked
                  }))} />
                    <label className="text-sm font-medium text-gray-700">
                      Ativo
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingModule ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.map(module => <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>
                        <Badge variant={module.active ? "default" : "secondary"}>
                          {module.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(module.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{new Date(module.updated_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch checked={module.active} onCheckedChange={() => handleModuleStatusToggle(module)} />
                          <Button variant="outline" size="sm" onClick={() => handleModuleEdit(module)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o módulo "{module.name}"? 
                                  Esta ação não pode ser desfeita e só será permitida se não houver feedbacks associados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleModuleDelete(module)} className="bg-red-600 hover:bg-red-700">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
}