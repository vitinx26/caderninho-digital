/**
 * ConsumptionPopup - Pop-up de notificação de consumo enviado
 * Exibido após registrar uma despesa com sucesso
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';

interface ConsumptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  clienteName: string;
  description: string;
  value: number;
}

export default function ConsumptionPopup({
  isOpen,
  onClose,
  clienteName,
  description,
  value,
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
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">✓ Enviado!</h3>
                <p className="text-white/80 text-xs">Notificação enviada aos administradores</p>
              </div>
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
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mt-1">
                <Send size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Consumação Registrada</p>
                <p className="text-lg font-semibold text-foreground">{clienteName}</p>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>

            {/* Valor */}
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-900">
              <p className="text-sm text-muted-foreground">Valor Registrado</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{valueFormatted}</p>
            </div>

            {/* Status */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Notificação enviada para todos os administradores
                </p>
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
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
