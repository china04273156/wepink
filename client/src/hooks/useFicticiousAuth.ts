import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export function useFicticiousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há usuário no sessionStorage
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('wepink_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de requisição
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validação básica
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (!email.includes('@')) {
        throw new Error('Email inválido');
      }

      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      // Criar usuário fictício
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
      };

      // Salvar no sessionStorage (não persiste após fechar o navegador)
      sessionStorage.setItem('wepink_user', JSON.stringify(newUser));
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de requisição
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validação básica
      if (!data.name || !data.email || !data.password) {
        throw new Error('Nome, email e senha são obrigatórios');
      }

      if (!data.email.includes('@')) {
        throw new Error('Email inválido');
      }

      if (data.password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      if (data.name.length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }

      // Criar usuário fictício
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      // Salvar no sessionStorage
      sessionStorage.setItem('wepink_user', JSON.stringify(newUser));
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cadastrar';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('wepink_user');
    setUser(null);
    setError(null);
  };

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  };
}
