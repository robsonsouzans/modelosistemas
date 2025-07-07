
-- Criar tabela para armazenar dados agregados dos atendimentos por atendente
CREATE TABLE public.atendimentos_resumo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendente TEXT NOT NULL,
  periodo_tipo TEXT NOT NULL CHECK (periodo_tipo IN ('diario', 'semanal', 'mensal', 'anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  total_atendimentos INTEGER NOT NULL DEFAULT 0,
  tempo_total_minutos NUMERIC NOT NULL DEFAULT 0,
  tempo_medio_minutos NUMERIC NOT NULL DEFAULT 0,
  finalizados INTEGER NOT NULL DEFAULT 0,
  em_andamento INTEGER NOT NULL DEFAULT 0,
  pendentes INTEGER NOT NULL DEFAULT 0,
  taxa_resolucao NUMERIC NOT NULL DEFAULT 0,
  eficiencia_iea NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(atendente, periodo_tipo, data_inicio)
);

-- Habilitar RLS
ALTER TABLE public.atendimentos_resumo ENABLE ROW LEVEL SECURITY;

-- Política para permitir visualização
CREATE POLICY "Anyone can view atendimentos_resumo" 
  ON public.atendimentos_resumo 
  FOR SELECT 
  USING (true);

-- Política para permitir gerenciamento por admins
CREATE POLICY "Admins can manage atendimentos_resumo" 
  ON public.atendimentos_resumo 
  FOR ALL 
  USING (true);

-- Criar índices para melhorar performance
CREATE INDEX idx_atendimentos_resumo_atendente ON public.atendimentos_resumo(atendente);
CREATE INDEX idx_atendimentos_resumo_periodo ON public.atendimentos_resumo(periodo_tipo, data_inicio);
CREATE INDEX idx_atendimentos_resumo_data ON public.atendimentos_resumo(data_inicio, data_fim);

-- Função para atualizar os dados resumidos
CREATE OR REPLACE FUNCTION public.atualizar_resumo_atendimentos()
RETURNS void AS $$
DECLARE
  r RECORD;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Limpar dados antigos (manter apenas últimos 2 anos)
  DELETE FROM public.atendimentos_resumo 
  WHERE data_inicio < CURRENT_DATE - INTERVAL '2 years';
  
  -- Obter lista de atendentes ativos
  FOR r IN SELECT DISTINCT name FROM public.attendants WHERE active = true
  LOOP
    -- Calcular resumo diário (últimos 30 dias)
    FOR i IN 0..29 LOOP
      start_date := CURRENT_DATE - i;
      end_date := start_date;
      
      INSERT INTO public.atendimentos_resumo (
        atendente, periodo_tipo, data_inicio, data_fim,
        total_atendimentos, tempo_total_minutos, tempo_medio_minutos,
        finalizados, em_andamento, pendentes, taxa_resolucao, eficiencia_iea
      )
      SELECT 
        r.name,
        'diario',
        start_date,
        end_date,
        COUNT(*),
        COALESCE(SUM(tempo_total), 0),
        CASE WHEN COUNT(*) > 0 THEN COALESCE(AVG(tempo_total), 0) ELSE 0 END,
        COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true),
        COUNT(*) FILTER (WHERE status = 'Em Andamento' OR (status != 'Finalizado' AND resolvido != true AND status != 'Pendente')),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        CASE WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true))::NUMERIC / COUNT(*) * 100 
        ELSE 0 END,
        CASE WHEN COALESCE(AVG(tempo_total), 0) > 0 THEN 
          COUNT(*)::NUMERIC / COALESCE(AVG(tempo_total), 1) 
        ELSE 0 END
      FROM public.atendimentos 
      WHERE atendente = r.name AND data = start_date
      ON CONFLICT (atendente, periodo_tipo, data_inicio) 
      DO UPDATE SET
        total_atendimentos = EXCLUDED.total_atendimentos,
        tempo_total_minutos = EXCLUDED.tempo_total_minutos,
        tempo_medio_minutos = EXCLUDED.tempo_medio_minutos,
        finalizados = EXCLUDED.finalizados,
        em_andamento = EXCLUDED.em_andamento,
        pendentes = EXCLUDED.pendentes,
        taxa_resolucao = EXCLUDED.taxa_resolucao,
        eficiencia_iea = EXCLUDED.eficiencia_iea,
        updated_at = now();
    END LOOP;
    
    -- Calcular resumo semanal (últimas 12 semanas)
    FOR i IN 0..11 LOOP
      start_date := DATE_TRUNC('week', CURRENT_DATE) - (i * INTERVAL '1 week')::DATE;
      end_date := start_date + INTERVAL '6 days';
      
      INSERT INTO public.atendimentos_resumo (
        atendente, periodo_tipo, data_inicio, data_fim,
        total_atendimentos, tempo_total_minutos, tempo_medio_minutos,
        finalizados, em_andamento, pendentes, taxa_resolucao, eficiencia_iea
      )
      SELECT 
        r.name,
        'semanal',
        start_date,
        end_date,
        COUNT(*),
        COALESCE(SUM(tempo_total), 0),
        CASE WHEN COUNT(*) > 0 THEN COALESCE(AVG(tempo_total), 0) ELSE 0 END,
        COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true),
        COUNT(*) FILTER (WHERE status = 'Em Andamento' OR (status != 'Finalizado' AND resolvido != true AND status != 'Pendente')),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        CASE WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true))::NUMERIC / COUNT(*) * 100 
        ELSE 0 END,
        CASE WHEN COALESCE(AVG(tempo_total), 0) > 0 THEN 
          COUNT(*)::NUMERIC / COALESCE(AVG(tempo_total), 1) 
        ELSE 0 END
      FROM public.atendimentos 
      WHERE atendente = r.name AND data >= start_date AND data <= end_date
      ON CONFLICT (atendente, periodo_tipo, data_inicio) 
      DO UPDATE SET
        total_atendimentos = EXCLUDED.total_atendimentos,
        tempo_total_minutos = EXCLUDED.tempo_total_minutos,
        tempo_medio_minutos = EXCLUDED.tempo_medio_minutos,
        finalizados = EXCLUDED.finalizados,
        em_andamento = EXCLUDED.em_andamento,
        pendentes = EXCLUDED.pendentes,
        taxa_resolucao = EXCLUDED.taxa_resolucao,
        eficiencia_iea = EXCLUDED.eficiencia_iea,
        updated_at = now();
    END LOOP;
    
    -- Calcular resumo mensal (últimos 12 meses)
    FOR i IN 0..11 LOOP
      start_date := DATE_TRUNC('month', CURRENT_DATE) - (i * INTERVAL '1 month')::DATE;
      end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      
      INSERT INTO public.atendimentos_resumo (
        atendente, periodo_tipo, data_inicio, data_fim,
        total_atendimentos, tempo_total_minutos, tempo_medio_minutos,
        finalizados, em_andamento, pendentes, taxa_resolucao, eficiencia_iea
      )
      SELECT 
        r.name,
        'mensal',
        start_date,
        end_date,
        COUNT(*),
        COALESCE(SUM(tempo_total), 0),
        CASE WHEN COUNT(*) > 0 THEN COALESCE(AVG(tempo_total), 0) ELSE 0 END,
        COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true),
        COUNT(*) FILTER (WHERE status = 'Em Andamento' OR (status != 'Finalizado' AND resolvido != true AND status != 'Pendente')),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        CASE WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true))::NUMERIC / COUNT(*) * 100 
        ELSE 0 END,
        CASE WHEN COALESCE(AVG(tempo_total), 0) > 0 THEN 
          COUNT(*)::NUMERIC / COALESCE(AVG(tempo_total), 1) 
        ELSE 0 END
      FROM public.atendimentos 
      WHERE atendente = r.name AND data >= start_date AND data <= end_date
      ON CONFLICT (atendente, periodo_tipo, data_inicio) 
      DO UPDATE SET
        total_atendimentos = EXCLUDED.total_atendimentos,
        tempo_total_minutos = EXCLUDED.tempo_total_minutos,
        tempo_medio_minutos = EXCLUDED.tempo_medio_minutos,
        finalizados = EXCLUDED.finalizados,
        em_andamento = EXCLUDED.em_andamento,
        pendentes = EXCLUDED.pendentes,
        taxa_resolucao = EXCLUDED.taxa_resolucao,
        eficiencia_iea = EXCLUDED.eficiencia_iea,
        updated_at = now();
    END LOOP;
    
    -- Calcular resumo anual (últimos 3 anos)
    FOR i IN 0..2 LOOP
      start_date := DATE_TRUNC('year', CURRENT_DATE) - (i * INTERVAL '1 year')::DATE;
      end_date := (start_date + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
      
      INSERT INTO public.atendimentos_resumo (
        atendente, periodo_tipo, data_inicio, data_fim,
        total_atendimentos, tempo_total_minutos, tempo_medio_minutos,
        finalizados, em_andamento, pendentes, taxa_resolucao, eficiencia_iea
      )
      SELECT 
        r.name,
        'anual',
        start_date,
        end_date,
        COUNT(*),
        COALESCE(SUM(tempo_total), 0),
        CASE WHEN COUNT(*) > 0 THEN COALESCE(AVG(tempo_total), 0) ELSE 0 END,
        COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true),
        COUNT(*) FILTER (WHERE status = 'Em Andamento' OR (status != 'Finalizado' AND resolvido != true AND status != 'Pendente')),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        CASE WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE status = 'Finalizado' OR resolvido = true))::NUMERIC / COUNT(*) * 100 
        ELSE 0 END,
        CASE WHEN COALESCE(AVG(tempo_total), 0) > 0 THEN 
          COUNT(*)::NUMERIC / COALESCE(AVG(tempo_total), 1) 
        ELSE 0 END
      FROM public.atendimentos 
      WHERE atendente = r.name AND data >= start_date AND data <= end_date
      ON CONFLICT (atendente, periodo_tipo, data_inicio) 
      DO UPDATE SET
        total_atendimentos = EXCLUDED.total_atendimentos,
        tempo_total_minutos = EXCLUDED.tempo_total_minutos,
        tempo_medio_minutos = EXCLUDED.tempo_medio_minutos,
        finalizados = EXCLUDED.finalizados,
        em_andamento = EXCLUDED.em_andamento,
        pendentes = EXCLUDED.pendentes,
        taxa_resolucao = EXCLUDED.taxa_resolucao,
        eficiencia_iea = EXCLUDED.eficiencia_iea,
        updated_at = now();
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Resumo de atendimentos atualizado com sucesso!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função uma vez para popular os dados iniciais
SELECT public.atualizar_resumo_atendimentos();
