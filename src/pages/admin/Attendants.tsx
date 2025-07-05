
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Users, User, Eye, EyeOff } from 'lucide-react'
import { AttendantPhotoUpload } from '@/components/AttendantPhotoUpload'

interface Attendant {
  id: string
  name: string
  active: boolean
  photo_url?: string
  created_at: string
}

export default function Attendants() {
  const [attendants, setAttendants] = useState<Attendant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null)
  const [formData, setFormData] = useState({ name: '', active: true })
  const { toast } = useToast()

  useEffect(() => {
    loadAttendants()
  }, [])

  const loadAttendants = async () => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .select('*')
        .order('name')

      if (error) throw error
      setAttendants(data || [])
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de atendentes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAttendant) {
        // Atualizar
        const { error } = await supabase
          .from('attendants')
          .update({
            name: formData.name,
            active: formData.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAttendant.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Atendente atualizado com sucesso!"
        })
      } else {
        // Criar novo
        const { error } = await supabase
          .from('attendants')
          .insert({
            name: formData.name,
            active: formData.active
          })

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Atendente criado com sucesso!"
        })
      }

      loadAttendants()
      setIsDialogOpen(false)
      setEditingAttendant(null)
      setFormData({ name: '', active: true })

    } catch (error) {
      console.error('Erro ao salvar atendente:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar atendente",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (attendant: Attendant) => {
    setEditingAttendant(attendant)
    setFormData({
      name: attendant.name,
      active: attendant.active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este atendente?')) return

    try {
      const { error } = await supabase
        .from('attendants')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Atendente excluído com sucesso!"
      })
      
      loadAttendants()
    } catch (error) {
      console.error('Erro ao excluir atendente:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir atendente",
        variant: "destructive"
      })
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('attendants')
        .update({ 
          active: !currentActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Atendente ${!currentActive ? 'ativado' : 'desativado'} com sucesso!`
      })
      
      loadAttendants()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status do atendente",
        variant: "destructive"
      })
    }
  }

  const handlePhotoUpdated = (attendantId: string, newPhotoUrl: string) => {
    setAttendants(prev => prev.map(a => 
      a.id === attendantId ? { ...a, photo_url: newPhotoUrl } : a
    ))
  }

  const openNewDialog = () => {
    setEditingAttendant(null)
    setFormData({ name: '', active: true })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Atendentes</h1>
        <Button onClick={openNewDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Atendente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Atendentes ({attendants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendants.map((attendant) => (
                <TableRow key={attendant.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {attendant.photo_url ? (
                        <img 
                          src={attendant.photo_url} 
                          alt={attendant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{attendant.name}</TableCell>
                  <TableCell>
                    <Badge variant={attendant.active ? "default" : "secondary"}>
                      {attendant.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(attendant.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AttendantPhotoUpload
                        attendantId={attendant.id}
                        attendantName={attendant.name}
                        currentPhotoUrl={attendant.photo_url}
                        onPhotoUpdated={(newPhotoUrl) => handlePhotoUpdated(attendant.id, newPhotoUrl)}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(attendant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(attendant.id, attendant.active)}
                      >
                        {attendant.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(attendant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {attendants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum atendente cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAttendant ? 'Editar Atendente' : 'Novo Atendente'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do atendente"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingAttendant ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
