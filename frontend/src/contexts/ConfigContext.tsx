import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface Trimestre {
  id: number;
  nombre: 'T1' | 'T2' | 'T3';
  fecha_inicio: string;
  fecha_fin: string;
}

export interface AnioAcademico {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  trimestres: Trimestre[];
  trimestre_actual?: 'T1' | 'T2' | 'T3';
}

interface ConfigContextType {
  anioActivo: AnioAcademico | null;
  trimestreActual: 'T1' | 'T2' | 'T3';
  anios: AnioAcademico[];
  periodoVisor: string | null;   // null = usa el activo
  setPeriodoVisor: (p: string | null) => void;
  refresh: () => void;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType>({
  anioActivo: null,
  trimestreActual: 'T1',
  anios: [],
  periodoVisor: null,
  setPeriodoVisor: () => {},
  refresh: () => {},
  loading: true,
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [anioActivo, setAnioActivo] = useState<AnioAcademico | null>(null);
  const [anios, setAnios] = useState<AnioAcademico[]>([]);
  const [trimestreActual, setTrimestreActual] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [periodoVisor, setPeriodoVisor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [configRes, aniosRes] = await Promise.all([
        api.get('/api/v1/auth/config/').catch(() => null),
        api.get('/api/v1/auth/anios/').catch(() => ({ data: [] })),
      ]);
      if (configRes) {
        setAnioActivo(configRes.data);
        setTrimestreActual(configRes.data.trimestre_actual || 'T1');
      }
      setAnios(aniosRes.data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return (
    <ConfigContext.Provider value={{
      anioActivo, trimestreActual, anios, periodoVisor, setPeriodoVisor, refresh, loading,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
