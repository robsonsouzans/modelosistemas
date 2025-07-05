
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (username: string, currentPassword: string, newPassword?: string) => Promise<boolean>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = sessionStorage.getItem('admin_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Tentando login para:', username)
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single()

      console.log('Resultado da consulta:', { data, error })

      if (error) {
        console.error('Erro na consulta:', error)
        return false
      }

      if (!data) {
        console.log('Usuário não encontrado')
        return false
      }

      // Verificar se a senha confere (comparação direta por enquanto)
      if (data.password_hash !== password) {
        console.log('Senha incorreta')
        return false
      }

      const userData = { id: data.id, username: data.username }
      setUser(userData)
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_user', JSON.stringify(userData))
      
      console.log('Login realizado com sucesso')
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const updateUser = async (username: string, currentPassword: string, newPassword?: string): Promise<boolean> => {
    try {
      if (!user) return false

      console.log('Atualizando usuário:', username)

      // Primeiro verificar a senha atual
      const { data: currentUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError || !currentUser) {
        console.error('Erro ao buscar usuário:', fetchError)
        return false
      }

      // Verificar senha atual
      if (currentUser.password_hash !== currentPassword) {
        console.log('Senha atual incorreta')
        return false
      }

      // Preparar dados para atualização
      const updateData: any = {
        username: username,
        updated_at: new Date().toISOString()
      }

      // Se uma nova senha foi fornecida, incluir na atualização
      if (newPassword) {
        updateData.password_hash = newPassword
      }

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError)
        return false
      }

      // Atualizar dados locais
      const updatedUserData = { ...user, username: username }
      setUser(updatedUserData)
      sessionStorage.setItem('admin_user', JSON.stringify(updatedUserData))

      console.log('Usuário atualizado com sucesso')
      return true
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_user')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
