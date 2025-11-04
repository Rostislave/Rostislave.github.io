import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM элементы
const $ = (id) => document.getElementById(id);
const loading = $("loading");
const error = $("error");
const questionnaireContainer = $("questionnaireContainer");
const questionNumber = $("questionNumber");
const questionText = $("questionText");
const progressFill = $("progressFill");
const progressDots = $("progressDots");
const finishModal = $("finishModal");

// Глобальные переменные
let questions = [];
let displayableQuestions = []; // Вопросы без пропускаемых
let currentQuestionIndex = 0;
let answers = [];
let patientData = null;
let linkCode = null;

// Получаем данные из URL и localStorage
const urlParams = new URLSearchParams(window.location.search);
linkCode = urlParams.get("code");

// Проверка наличия link_code
if (!linkCode) {
  showError("Отсутствует код сессии. Пожалуйста, вернитесь к анкете.");
} else {
  init();
}

// Инициализация
async function init() {
  try {
    // Загружаем данные пациента из localStorage
    const storedData = localStorage.getItem("patientData");
    if (!storedData) {
      showError("Данные пациента не найдены. Пожалуйста, заполните анкету заново.");
      return;
    }

    patientData = JSON.parse(storedData);

    // Проверяем, что linkCode совпадает
    if (patientData.linkCode !== linkCode) {
      showError("Несоответствие кода сессии. Пожалуйста, заполните анкету заново.");
      return;
    }

    // Определяем файл с вопросами
    const questionFile = getQuestionFile(patientData.gender, patientData.age);

    // Загружаем вопросы
    await loadQuestions(questionFile);

    // Загружаем сохраненные ответы из localStorage
    loadAnswers();

    // Инициализируем прогресс-бар
    initProgressBar();

    // Показываем первый вопрос
    showQuestion(0);

    // Показываем контейнер с вопросами
    loading.style.display = "none";
    questionnaireContainer.style.display = "block";

  } catch (err) {
    console.error("Initialization error:", err);
    showError("Ошибка при загрузке опросника: " + err.message);
  }
}

// Определяем файл с вопросами
function getQuestionFile(gender, age) {
  const isSmall = age >= 13 && age <= 15;

  if (gender === "male") {
    return isSmall ? "./data/male_small.json" : "./data/male.json";
  } else {
    return isSmall ? "./data/female_small.json" : "./data/female.json";
  }
}

// Загружаем вопросы из файла
async function loadQuestions(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error("Не удалось загрузить файл с вопросами");
    }

    questions = await response.json();

    // Фильтруем вопросы - убираем те, что содержат "обвести кружочком"
    displayableQuestions = questions.filter(q => {
      return !q.text.toLowerCase().includes("обвести кружочком");
    });

    console.log(`Загружено ${questions.length} вопросов, отображаемых: ${displayableQuestions.length}`);
  } catch (err) {
    throw new Error("Ошибка загрузки вопросов: " + err.message);
  }
}

// Загружаем ответы из localStorage
function loadAnswers() {
  const storedAnswers = localStorage.getItem("questionnaireAnswers_" + linkCode);
  if (storedAnswers) {
    answers = JSON.parse(storedAnswers);
  } else {
    // Инициализируем пустой массив ответов для всех вопросов (включая пропускаемые)
    answers = questions.map(q => ({
      number: q.number,
      answer: null
    }));
  }
}

// Сохраняем ответы в localStorage
function saveAnswers() {
  localStorage.setItem("questionnaireAnswers_" + linkCode, JSON.stringify(answers));
}

// Инициализируем прогресс-бар
function initProgressBar() {
  const totalDisplayable = displayableQuestions.length;
  const dotsCount = Math.min(20, totalDisplayable); // Максимум 20 точек
  const questionsPerDot = Math.ceil(totalDisplayable / dotsCount);

  progressDots.innerHTML = "";

  for (let i = 0; i < dotsCount; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";

    const tooltip = document.createElement("div");
    const questionIndex = i * questionsPerDot;
    const questionNum = displayableQuestions[Math.min(questionIndex, totalDisplayable - 1)]?.number || i + 1;
    tooltip.className = "progress-dot-tooltip";
    tooltip.textContent = `Вопрос ${questionNum}`;
    dot.appendChild(tooltip);

    dot.addEventListener("click", () => {
      goToQuestion(Math.min(questionIndex, totalDisplayable - 1));
    });

    progressDots.appendChild(dot);
  }

  updateProgressBar();
}

// Обновляем прогресс-бар
function updateProgressBar() {
  const totalDisplayable = displayableQuestions.length;
  const answeredCount = displayableQuestions.filter(q => {
    const answer = answers.find(a => a.number === q.number);
    return answer && answer.answer !== null;
  }).length;

  // Обновляем линию прогресса
  const progress = (answeredCount / totalDisplayable) * 100;
  progressFill.style.width = progress + "%";

  // Обновляем точки
  const dots = progressDots.querySelectorAll(".progress-dot");
  const dotsCount = dots.length;
  const questionsPerDot = Math.ceil(totalDisplayable / dotsCount);

  dots.forEach((dot, i) => {
    const questionIndex = i * questionsPerDot;
    const question = displayableQuestions[Math.min(questionIndex, totalDisplayable - 1)];

    if (question) {
      const answer = answers.find(a => a.number === question.number);
      const isAnswered = answer && answer.answer !== null;
      const isCurrent = questionIndex === currentQuestionIndex;

      dot.classList.toggle("answered", isAnswered);
      dot.classList.toggle("current", isCurrent);
    }
  });
}

// Показываем вопрос
function showQuestion(index) {
  if (index < 0 || index >= displayableQuestions.length) {
    return;
  }

  currentQuestionIndex = index;
  const question = displayableQuestions[index];

  // Добавляем класс fade-out
  questionText.classList.add("fade-out");
  const answerButtons = document.querySelector(".answer-buttons");
  answerButtons.classList.add("fade-out");

  setTimeout(() => {
    // Обновляем содержимое
    questionNumber.textContent = `Вопрос ${question.number} из ${questions.length}`;
    questionText.textContent = question.text;

    // Убираем класс fade-out
    questionText.classList.remove("fade-out");
    answerButtons.classList.remove("fade-out");

    // Обновляем кнопки ответов
    updateAnswerButtons(question.number);

    // Обновляем прогресс-бар
    updateProgressBar();

    // Проверяем, это последний вопрос
    if (index === displayableQuestions.length - 1) {
      checkIfAllAnswered();
    }
  }, 200);
}

// Обновляем состояние кнопок ответов
function updateAnswerButtons(questionNumber) {
  const answer = answers.find(a => a.number === questionNumber);
  const buttons = document.querySelectorAll(".answer-btn");

  buttons.forEach(btn => {
    const answerValue = parseInt(btn.dataset.answer);
    btn.classList.toggle("selected", answer && answer.answer === answerValue);
  });
}

// Обработчик клика на кнопку ответа
document.querySelectorAll(".answer-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const answerValue = parseInt(btn.dataset.answer);
    const question = displayableQuestions[currentQuestionIndex];

    // Сохраняем ответ
    const answerIndex = answers.findIndex(a => a.number === question.number);
    if (answerIndex !== -1) {
      answers[answerIndex].answer = answerValue;
    }

    // Сохраняем в localStorage
    saveAnswers();

    // Обновляем кнопки
    updateAnswerButtons(question.number);

    // Обновляем прогресс-бар
    updateProgressBar();

    // Переходим к следующему вопросу
    setTimeout(() => {
      if (currentQuestionIndex < displayableQuestions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
      } else {
        checkIfAllAnswered();
      }
    }, 300);
  });
});

// Переход к вопросу
function goToQuestion(index) {
  showQuestion(index);
}

// Проверяем, все ли вопросы отвечены
function checkIfAllAnswered() {
  const allAnswered = displayableQuestions.every(q => {
    const answer = answers.find(a => a.number === q.number);
    return answer && answer.answer !== null;
  });

  if (allAnswered) {
    finishModal.classList.add("show");
  }
}

// Обработчики для финального окна
$("backToQuestions").addEventListener("click", () => {
  finishModal.classList.remove("show");
});

$("finishTest").addEventListener("click", async () => {
  try {
    $("finishTest").disabled = true;
    $("finishTest").textContent = "Отправка...";

    // Подготавливаем ответы для отправки (только с ответами)
    const answersToSend = answers.filter(a => a.answer !== null);

    // Отправляем в Supabase
    const { data, error } = await supabase
      .from("sessions")
      .update({
        answers_json: answersToSend,
        status: "completed"
      })
      .eq("link_code", linkCode)
      .select();

    if (error) {
      console.error("Error saving answers:", error);
      alert("Ошибка при сохранении ответов. Пожалуйста, попробуйте снова.");
      $("finishTest").disabled = false;
      $("finishTest").textContent = "Завершить тестирование";
      return;
    }

    // Очищаем localStorage
    localStorage.removeItem("questionnaireAnswers_" + linkCode);
    localStorage.removeItem("patientData");

    // Показываем сообщение об успехе
    alert("Спасибо! Ваши ответы успешно отправлены врачу.");

    // Можно перенаправить на страницу благодарности
    window.location.href = "./thank-you.html";

  } catch (err) {
    console.error("Error finishing test:", err);
    alert("Произошла ошибка. Пожалуйста, попробуйте снова.");
    $("finishTest").disabled = false;
    $("finishTest").textContent = "Завершить тестирование";
  }
});

// Показываем ошибку
function showError(message) {
  loading.style.display = "none";
  error.style.display = "block";
  error.textContent = message;
}
