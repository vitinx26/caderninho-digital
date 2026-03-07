/**
 * Home - Página inicial (redirecionada para Dashboard)
 */

import { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

export default function Home() {
  const { irPara } = useNavigation();

  useEffect(() => {
    irPara('dashboard');
  }, [irPara]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
}
