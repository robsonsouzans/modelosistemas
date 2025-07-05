import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
export default function Settings() {
  const {
    user,
    updateUser
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação da senha atual obrigatória
    if (!formData.currentPassword) {
      toast({
        title: "Erro",
        description: "A senha atual é obrigatória para salvar as alterações",
        variant: "destructive"
      });
      return;
    }

    // Se está tentando alterar a senha, validar nova senha
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive"
        });
        return;
      }
      if (formData.newPassword && formData.newPassword.length < 6) {
        toast({
          title: "Erro",
          description: "A nova senha deve ter pelo menos 6 caracteres",
          variant: "destructive"
        });
        return;
      }
    }
    setLoading(true);
    try {
      const success = await updateUser(formData.username, formData.currentPassword, formData.newPassword || undefined);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Configurações atualizadas com sucesso!"
        });

        // Limpar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast({
          title: "Erro",
          description: "Senha atual incorreta ou erro ao atualizar configurações",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-6">
      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input id="username" value={formData.username} onChange={e => setFormData(prev => ({
              ...prev,
              username: e.target.value
            }))} placeholder="Digite seu nome de usuário" />
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual *</Label>
              <Input id="currentPassword" type="password" value={formData.currentPassword} onChange={e => setFormData(prev => ({
              ...prev,
              currentPassword: e.target.value
            }))} placeholder="Digite sua senha atual" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha (opcional)</Label>
              <Input id="newPassword" type="password" value={formData.newPassword} onChange={e => setFormData(prev => ({
              ...prev,
              newPassword: e.target.value
            }))} placeholder="Digite sua nova senha" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData(prev => ({
              ...prev,
              confirmPassword: e.target.value
            }))} placeholder="Confirme sua nova senha" disabled={!formData.newPassword} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Salvar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <Button type="submit" disabled={loading || !formData.currentPassword} className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white">
              {loading ? <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div> : <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Configurações
                </div>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">Informações Importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A senha atual é obrigatória para salvar qualquer alteração</li>
            <li>• A nova senha deve ter pelo menos 6 caracteres</li>
            <li>• Deixe os campos de nova senha em branco se não quiser alterá-la</li>
            <li>• As alterações serão aplicadas imediatamente após salvar</li>
          </ul>
        </CardContent>
      </Card>
    </div>;
}