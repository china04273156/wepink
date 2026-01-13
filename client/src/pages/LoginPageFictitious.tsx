import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useFicticiousAuth } from '@/hooks/useFicticiousAuth';

export default function LoginPageFictitious() {
  const [, setLocation] = useLocation();
  const { login, loading, error } = useFicticiousAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      setFormData({ email: '', password: '' });
      setLocation('/');
    } else {
      setLocalError(result.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">WePink</h1>
          <p className="text-gray-600">Bem-vinda de volta!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-semibold">{error || localError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-600"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Lembrar-me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition duration-200"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">ou</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-xl">f</span>
              <span className="text-gray-700 font-semibold">Facebook</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-xl">G</span>
              <span className="text-gray-700 font-semibold">Google</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => setLocation('/register')}
                className="text-pink-600 font-bold hover:text-pink-700 transition"
              >
                Cadastre-se
              </button>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-gray-600 text-sm hover:text-pink-600 transition"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-white rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            💡 <strong>Dica:</strong> Use qualquer email e senha (mín. 6 caracteres) para fazer login fictício.
          </p>
        </div>
      </div>
    </div>
  );
}
