import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nanoid } from "https://esm.sh/nanoid@5";

const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const $ = (id) => document.getElementById(id);
const userEmailEl = $("userEmail");
const logoutBtn = $("logoutBtn");
const sessionForm = $("sessionForm");
const patientNameEl = $("patientName");
const sessionNotesEl = $("sessionNotes");
const createSessionBtn = $("createSessionBtn");
const resetFormBtn = $("resetFormBtn");
const sessionIdDisplay = $("sessionIdDisplay");
const sessionIdValue = $("sessionIdValue");
const copySessionBtn = $("copySessionBtn");
const shareSessionBtn = $("shareSessionBtn");
const successMsg = $("successMsg");
const errorMsg = $("errorMsg");
const sessionsListEl = $("sessionsList");

// State
let currentUser = null;
let sessions = [];

// Initialize
async function init() {
  try {
    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Not authenticated, redirect to login
      window.location.href = "./index.html";
      return;
    }

    currentUser = user;
    userEmailEl.textContent = user.email || "Пользователь";

    // Load sessions
    await loadSessions();
  } catch (error) {
    console.error("Initialization error:", error);
    window.location.href = "./index.html";
  }
}

// Load sessions from Supabase
async function loadSessions() {
  try {
    // Check if sessions table exists and load sessions
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      // Table might not exist yet, show empty state
      console.log("No sessions table or error loading:", error.message);
      renderEmptySessions();
      return;
    }

    sessions = data || [];
    renderSessions();
  } catch (error) {
    console.error("Error loading sessions:", error);
    renderEmptySessions();
  }
}

// Render sessions list
function renderSessions() {
  if (sessions.length === 0) {
    renderEmptySessions();
    return;
  }

  sessionsListEl.innerHTML = sessions.map(session => `
    <div class="session-item">
      <div class="session-item-header">
        <div class="session-item-id">${session.session_id || session.id}</div>
        <div class="session-item-date">${formatDate(session.created_at)}</div>
      </div>
      <div class="session-item-patient">${session.patient_name || "Без имени"}</div>
      ${session.notes ? `<div class="session-item-notes">${session.notes}</div>` : ""}
    </div>
  `).join("");
}

// Render empty state
function renderEmptySessions() {
  sessionsListEl.innerHTML = `
    <p style="color: #6b7280; font-size: 14px; text-align: center; padding: 20px;">
      Пока нет созданных сессий. Создайте первую сессию выше.
    </p>
  `;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Create session
async function createSession(patientName, notes) {
  try {
    // Generate unique session ID using nanoid
    const sessionId = nanoid(10); // Generate 10-character ID

    // Try to save to Supabase
    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          session_id: sessionId,
          patient_name: patientName,
          notes: notes || null,
          doctor_id: currentUser.id,
          doctor_email: currentUser.email,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Error saving to database:", error);

      // Show helpful error message based on error type
      if (error.code === '42P01') {
        throw new Error("Таблица sessions не создана в Supabase. Пожалуйста, выполните SQL скрипт из файла supabase-schema.sql");
      } else if (error.code === '42501') {
        throw new Error("Нет прав доступа к таблице sessions. Проверьте RLS политики в Supabase");
      } else {
        throw new Error(`Ошибка базы данных: ${error.message}`);
      }
    }

    return {
      sessionId,
      patientName,
      notes,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

// Handle form submission
sessionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patientName = patientNameEl.value.trim();
  const notes = sessionNotesEl.value.trim();

  if (!patientName) {
    showError("Пожалуйста, введите имя пациента");
    return;
  }

  createSessionBtn.disabled = true;
  createSessionBtn.textContent = "Создание...";
  hideMessages();

  try {
    const session = await createSession(patientName, notes);

    // Show session ID
    sessionIdValue.textContent = session.sessionId;
    sessionIdDisplay.classList.add("show");
    showSuccess();

    // Reload sessions
    await loadSessions();

    // Clear form after a delay
    setTimeout(() => {
      resetForm();
    }, 5000);

  } catch (error) {
    showError("Ошибка при создании сессии: " + error.message);
  } finally {
    createSessionBtn.disabled = false;
    createSessionBtn.textContent = "Создать сессию";
  }
});

// Reset form
resetFormBtn.addEventListener("click", resetForm);

function resetForm() {
  patientNameEl.value = "";
  sessionNotesEl.value = "";
  sessionIdDisplay.classList.remove("show");
  hideMessages();
}

// Copy session ID
copySessionBtn.addEventListener("click", async () => {
  const sessionId = sessionIdValue.textContent;
  try {
    await navigator.clipboard.writeText(sessionId);
    const originalText = copySessionBtn.textContent;
    copySessionBtn.textContent = "Скопировано!";
    setTimeout(() => {
      copySessionBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error("Error copying:", error);
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = sessionId;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    const originalText = copySessionBtn.textContent;
    copySessionBtn.textContent = "Скопировано!";
    setTimeout(() => {
      copySessionBtn.textContent = originalText;
    }, 2000);
  }
});

// Share session
shareSessionBtn.addEventListener("click", () => {
  const sessionId = sessionIdValue.textContent;
  const patientName = patientNameEl.value.trim();
  const shareText = `Сессия для ${patientName}\nID: ${sessionId}`;

  if (navigator.share) {
    navigator.share({
      title: "ID сессии пациента",
      text: shareText
    }).catch(err => console.log("Error sharing:", err));
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      const originalText = shareSessionBtn.textContent;
      shareSessionBtn.textContent = "Скопировано!";
      setTimeout(() => {
        shareSessionBtn.textContent = originalText;
      }, 2000);
    });
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();
    window.location.href = "./index.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "./index.html";
  }
});

// Show/hide messages
function showSuccess() {
  successMsg.classList.add("show");
  setTimeout(() => {
    successMsg.classList.remove("show");
  }, 5000);
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add("show");
  setTimeout(() => {
    errorMsg.classList.remove("show");
  }, 5000);
}

function hideMessages() {
  successMsg.classList.remove("show");
  errorMsg.classList.remove("show");
}

// Initialize on page load
init();
