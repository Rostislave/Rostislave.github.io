import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Подставь свои реальные данные:
const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM"; // ⚠ НЕ service_role, только anon_key!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Если уже авторизованы — сразу на doctor.html


// Хэндлер логина
const $ = (id) => document.getElementById(id);
const emailEl = $("email");
const passEl = $("password");
const btn = $("login");
const errBox = $("err");

btn?.addEventListener("click", async () => {
  errBox.style.display = "none";
  btn.disabled = true;

  const email = emailEl.value.trim();
  const password = passEl.value;


  try {
    // Вход по email+password
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Успех → редирект
    window.location.href = "./doctor.html";
  } catch (e) {
    errBox.textContent = e.message || "Ошибка входа";
    errBox.style.display = "block";
  } finally {
    btn.disabled = false;
  }
});

// Экспортим клиент для doctor.js при необходимости
export { supabase };