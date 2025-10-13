// scripts/auth.js

// ✅ 1. Импортируем Supabase Client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ Подставь свои реальные значения
const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM"; // ⚠ НЕ service_role, только anon_key!

// ✅ 2. Инициализация клиента
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Проверка: если index.html — подключаем Auth UI
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname === "/Rostislave.github.io/") {
  // 3. Динамически загружаем UI-виджет Supabase
  import("https://esm.sh/@supabase/auth-ui@0.4.7").then(async ({ Auth }) => {
    Auth({
      supabaseClient: supabase,
      providers: [], // email/password only
      appearance: { theme: "dark" },
      element: document.getElementById("auth")
    });
  });

  // 4. После успешного входа → перенаправляем врача
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      window.location.href = "./doctor.html";
    }
  });

  // 5. Если врач уже авторизован — сразу ведём его дальше
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.location.href = "./doctor.html";
    }
  });
}
