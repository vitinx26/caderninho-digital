/**
 * ConsumptionPopup - Pop-up de notificação de consumo
 * Exibido após registrar uma despesa
 */

import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

interface ConsumptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  clienteName: string;
  description: string;
  value: number;
  totalConsumption: number;
  percentageIncrease: number;
}

export default function ConsumptionPopup({
  isOpen,
  onClose,
  clienteName,
  description,
  value,
  totalConsumption,
  percentageIncrease,
}: ConsumptionPopupProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);

    if (isOpen) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const valueFormatted = (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const totalFormatted = (totalConsumption / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="fixed inset-0 flex items-end justify-center pointer-events-none z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={() => {
          setIsVisible(false);
          onClose();
        }}
      />

      {/* Popup */}
      <div className="relative pointer-events-auto mb-4 mx-4 max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-green-200 dark:border-green-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Check size={20} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Despesa Registrada!</h3>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Cliente */}
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-lg font-semibold text-foreground">{clienteName}</p>
            </div>

            {/* Descrição */}
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-foreground">{description}</p>
            </div>

            {/* Valor Registrado */}
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-900">
              <p className="text-sm text-muted-foreground">Valor Registrado</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{valueFormatted}</p>
            </div>

            {/* Consumo Total */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-muted-foreground">Consumo Total</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalFormatted}</p>
                {percentageIncrease > 0 && (
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    +{percentageIncrease.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Fechará automaticamente em 5 segundos</p>
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
