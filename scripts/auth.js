import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Подставь свои реальные данные:
const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM"; // ⚠ НЕ service_role, только anon_key!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Проверка: если это index.html — подключаем Auth UI
if (window.location.pathname.includes("index")) {
  // ✅ ПОДМЕНА: теперь используем jsDelivr, а не esm.sh
  import("https://cdn.jsdelivr.net/npm/@supabase/auth-ui@0.4.7/dist/index.js").then(({ Auth }) => {
    Auth({
      supabaseClient: supabase,
      providers: [],
      appearance: {
        theme: "dark"
      },
      element: document.getElementById("auth"),
    });
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      window.location.href = "./doctor.html";
    }
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.location.href = "./doctor.html";
    }
  });
}





