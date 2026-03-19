/**
 * Hook para gerenciar estado do pop-up de consumo
 */

import { useState, useCallback } from 'react';

export interface ConsumptionData {
  clienteName: string;
  description: string;
  value: number;
  totalConsumption: number;
  percentageIncrease: number;
}

export function useConsumptionPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ConsumptionData | null>(null);

  const showPopup = useCallback((consumptionData: ConsumptionData) => {
    setData(consumptionData);
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    // Limpar dados após animação
    setTimeout(() => {
      setData(null);
    }, 300);
  }, []);

  return {
    isOpen,
    data,
    showPopup,
    closePopup,
  };
}
