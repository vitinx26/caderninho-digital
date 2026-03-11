/**
 * Home - Página inicial do Caderninho Digital
 * Redireciona para Dashboard se logado, ou para Login se não
 */

import { useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Se está logado, ir para o dashboard
    if (user) {
      setLocation('/dashboard');
    } else {
      // Se não está logado, ir para a página de login
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
}
