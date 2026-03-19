/**
 * Componente de Pop-up de Consumo
 * Exibe notificação visual de consumo após registrar despesa
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConsumptionData {
  descricao: string;
  valor: number;
  totalConsumo: number;
  nomeCliente: string;
  percentualAumento?: number;
}

interface ConsumptionPopupProps {
  isOpen: boolean;
  data: ConsumptionData | null;
  onClose: () => void;
}

export function ConsumptionPopup({ isOpen, data, onClose }: ConsumptionPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-fechar após 5 segundos
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen || !data) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-auto ${
          isVisible ? 'opacity-20' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 pointer-events-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Botão de Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse" />
            <div className="relative bg-green-50 rounded-full p-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Despesa Registrada!
        </h2>

        {/* Descrição da Despesa */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Descrição</p>
          <p className="text-lg font-semibold text-gray-900">{data.descricao}</p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Valor</p>
              <p className="text-xl font-bold text-blue-600">
                R$ {data.valor.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-semibold text-gray-900">{data.nomeCliente}</p>
            </div>
          </div>
        </div>

        {/* Resumo de Consumo */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">Consumo Total</p>
          </div>

          <p className="text-3xl font-bold text-blue-600 mb-2">
            R$ {data.totalConsumo.toFixed(2)}
          </p>

          {data.percentualAumento !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(data.percentualAumento, 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-600">
                +{data.percentualAumento.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Mensagem */}
        <p className="text-center text-sm text-gray-600 mb-4">
          Despesa adicionada com sucesso ao seu histórico de consumo.
        </p>

        {/* Botão de Fechar */}
        <Button
          onClick={handleClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Entendido
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook para gerenciar popup de consumo
 */
export function useConsumptionPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ConsumptionData | null>(null);

  const showPopup = (consumptionData: ConsumptionData) => {
    setData(consumptionData);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setTimeout(() => {
      setData(null);
    }, 300);
  };

  return {
    isOpen,
    data,
    showPopup,
    closePopup,
  };
}
