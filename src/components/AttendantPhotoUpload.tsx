
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Upload, User, Camera } from 'lucide-react'

interface AttendantPhotoUploadProps {
  attendantId: string
  attendantName: string
  currentPhotoUrl?: string
  onPhotoUpdated: (newPhotoUrl: string) => void
}

export function AttendantPhotoUpload({ 
  attendantId, 
  attendantName, 
  currentPhotoUrl, 
  onPhotoUpdated 
}: AttendantPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Apenas arquivos JPG, PNG ou WebP são permitidos",
        variant: "destructive"
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${attendantId}-${Date.now()}.${fileExt}`
      
      // Para este exemplo, vamos salvar a URL como uma string
      // Em um projeto real, você usaria Supabase Storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('attendants')
          .update({ photo_url: base64Url })
          .eq('id', attendantId)

        if (error) throw error

        onPhotoUpdated(base64Url)
        setIsOpen(false)
        
        toast({
          title: "Sucesso",
          description: "Foto atualizada com sucesso!"
        })
      }
      
      reader.readAsDataURL(file)

    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {currentPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto do Atendente: {attendantName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview da foto atual */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {currentPhotoUrl ? (
                <img 
                  src={currentPhotoUrl} 
                  alt={attendantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="photo-upload">Escolher nova foto</Label>
            <div className="flex items-center gap-4">
              <Input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <Button 
                type="button" 
                variant="secondary" 
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Enviando...' : 'Upload'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>• Formatos aceitos: JPG, PNG, WebP</p>
            <p>• Tamanho máximo: 5MB</p>
            <p>• Recomendado: foto quadrada 300x300px</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
