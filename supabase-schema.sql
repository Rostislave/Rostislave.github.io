-- Удаляем старую таблицу если существует (осторожно! удалит данные)
DROP TABLE IF EXISTS public.sessions CASCADE;

-- Создаем новую таблицу sessions с полной структурой
CREATE TABLE IF NOT EXISTS public.sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_code VARCHAR(12) UNIQUE NOT NULL,
  patient_name TEXT,
  answers_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  gender TEXT,
  doctor_id UUID,
  doctor_email TEXT,
  notes TEXT,
  doctor_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_sessions_link_code ON public.sessions(link_code);
CREATE INDEX IF NOT EXISTS idx_sessions_doctor_id ON public.sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);

-- Включаем Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Политика 1: Врачи могут видеть только свои сессии
CREATE POLICY "doctors_can_view_own_sessions"
ON public.sessions
FOR SELECT
USING (auth.uid() = doctor_id);

-- Политика 2: Врачи могут создавать свои сессии
CREATE POLICY "doctors_can_insert_own_sessions"
ON public.sessions
FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

-- Политика 3: Врачи могут обновлять свои сессии
CREATE POLICY "doctors_can_update_own_sessions"
ON public.sessions
FOR UPDATE
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Политика 4: Врачи могут удалять свои сессии
CREATE POLICY "doctors_can_delete_own_sessions"
ON public.sessions
FOR DELETE
USING (auth.uid() = doctor_id);

-- Политика 5: Пациенты (анонимные) могут обновлять сессию по link_code
-- Используем специальный механизм Supabase для передачи link_code через параметры запроса
CREATE POLICY "allow_update_by_link_code_param"
ON public.sessions
FOR UPDATE
TO public
USING (
  (link_code)::text = COALESCE(
    NULLIF(
      split_part(
        current_setting('request.query'::text, true),
        '"link_code":"eq.'::text,
        -1
      ),
      ''::text
    ),
    (link_code)::text
  )
);

-- Политика 6: Пациенты (анонимные) могут читать сессию по link_code
CREATE POLICY "allow_select_by_link_code_param"
ON public.sessions
FOR SELECT
TO public
USING (
  (link_code)::text = COALESCE(
    NULLIF(
      split_part(
        current_setting('request.query'::text, true),
        '"link_code":"eq.'::text,
        -1
      ),
      ''::text
    ),
    (link_code)::text
  )
);

-- Комментарии для документации
COMMENT ON TABLE public.sessions IS 'Таблица сессий для системы врач-пациент с RLS';
COMMENT ON COLUMN public.sessions.link_code IS 'Уникальный код для доступа пациента (12 символов, nanoid)';
COMMENT ON COLUMN public.sessions.answers_json IS 'JSON с ответами пациента на вопросы анкеты';
COMMENT ON COLUMN public.sessions.status IS 'Статус: pending (ожидает), completed (заполнено), reviewed (проверено врачом)';
