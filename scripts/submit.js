import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM";

// Создаем клиент Supabase (анонимный доступ)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Элементы
const $ = (id) => document.getElementById(id);
const loadingEl = $("loading");
const formContainer = $("formContainer");
const invalidLink = $("invalidLink");
const errorMsg = $("errorMsg");
const successMsg = $("successMsg");
const patientForm = $("patientForm");
const submitBtn = $("submitBtn");

// Получаем link_code из URL
const urlParams = new URLSearchParams(window.location.search);
const linkCode = urlParams.get("code");

// Проверяем наличие link_code
if (!linkCode) {
  loadingEl.style.display = "none";
  invalidLink.style.display = "block";
} else {
  // Проверяем валидность ссылки
  checkLinkValidity();
}

// Проверка валидности ссылки
async function checkLinkValidity() {
  try {
    // Пытаемся получить сессию по link_code
    // RLS политика allow_select_by_link_code_param позволит это сделать
    const { data, error } = await supabase
      .from("sessions")
      .select("id, status, patient_name")
      .eq("link_code", linkCode)
      .single();

    if (error || !data) {
      console.error("Session not found:", error);
      loadingEl.style.display = "none";
      invalidLink.style.display = "block";
      return;
    }

    // Проверяем статус сессии - пускаем только если pending
    if (data.status !== "pending") {
      loadingEl.style.display = "none";
      invalidLink.style.display = "block";

      // Показываем сообщение в зависимости от статуса
      const invalidTitle = invalidLink.querySelector("h1");
      const invalidText = invalidLink.querySelector("p");

      if (data.status === "completed") {
        if (invalidTitle) invalidTitle.textContent = "Анкета уже заполнена";
        if (invalidText) invalidText.textContent = "Эта анкета уже была заполнена. Если нужно заполнить еще раз, обратитесь к врачу за новой ссылкой.";
      } else if (data.status === "reviewed") {
        if (invalidTitle) invalidTitle.textContent = "Анкета уже проверена";
        if (invalidText) invalidText.textContent = "Эта анкета уже проверена врачом. Доступ к изменению неверен.";
      }
      return;
    }

    // Если есть имя пациента - предзаполняем
    if (data.patient_name) {
      $("patientName").value = data.patient_name;
    }

    // Показываем форму - только для pending статуса
    loadingEl.style.display = "none";
    formContainer.style.display = "block";
  } catch (error) {
    console.error("Error checking link:", error);
    loadingEl.style.display = "none";
    invalidLink.style.display = "block";
  }
}

// Обработчик отправки формы
patientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Скрываем сообщения
  errorMsg.classList.remove("show");
  successMsg.classList.remove("show");

  // Блокируем кнопку
  submitBtn.disabled = true;
  submitBtn.textContent = "Отправка...";

  try {
    // Собираем данные формы
    const formData = {
      patient_name: $("patientName").value.trim(),
      gender: document.querySelector('input[name="gender"]:checked')?.value,
      age: parseInt($("age").value),
      birth_date: $("birthDate").value || null,
      main_complaint: $("mainComplaint").value.trim(),
      chronic_diseases: $("chronicDiseases").value.trim() || null,
      medications: $("medications").value.trim() || null,
      allergies: $("allergies").value.trim() || null,
      additional_info: $("additionalInfo").value.trim() || null
    };

    // Валидация обязательных полей
    if (!formData.patient_name || !formData.gender || !formData.age || !formData.main_complaint) {
      throw new Error("Пожалуйста, заполните все обязательные поля.");
    }

    // Отправляем данные в Supabase
    // RLS политика allow_update_by_link_code_param позволит обновить запись
    const { data, error } = await supabase
      .from("sessions")
      .update({
        patient_name: formData.patient_name,
        gender: formData.gender,
        answers_json: formData,
        status: "completed"
      })
      .eq("link_code", linkCode)
      .select();

    if (error) {
      console.error("Error saving data:", error);
      throw new Error("Ошибка при сохранении данных. Пожалуйста, попробуйте снова.");
    }

    // Успех!
    successMsg.classList.add("show");
    patientForm.style.display = "none";

    // Можно перенаправить или показать сообщение
    setTimeout(() => {
      // window.location.href = "./thank-you.html";
    }, 2000);

  } catch (error) {
    errorMsg.textContent = error.message || "Произошла ошибка при отправке формы.";
    errorMsg.classList.add("show");
    console.error("Submit error:", error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Отправить анкету";
  }
});
