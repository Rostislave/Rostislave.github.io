import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://vyajxftrbgozpqrvclwd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWp4ZnRyYmdvenBxcnZjbHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzE1NjUsImV4cCI6MjA3NTkwNzU2NX0.zbo359O-XVFKQ1u-lx9HWH-pvcPL2QZm1h7v8dnEogM";

// !>7405< :;85=B Supabase (0=>=8<=K9 4>ABC?)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM M;5<5=BK
const $ = (id) => document.getElementById(id);
const loadingEl = $("loading");
const formContainer = $("formContainer");
const invalidLink = $("invalidLink");
const errorMsg = $("errorMsg");
const successMsg = $("successMsg");
const patientForm = $("patientForm");
const submitBtn = $("submitBtn");

// >;CG05< link_code 87 URL
const urlParams = new URLSearchParams(window.location.search);
const linkCode = urlParams.get("code");

// @>25@O5< =0;8G85 link_code
if (!linkCode) {
  loadingEl.style.display = "none";
  invalidLink.style.display = "block";
} else {
  // @>25@O5< 20;84=>ABL AAK;:8
  checkLinkValidity();
}

// @>25@:0 20;84=>AB8 AAK;:8
async function checkLinkValidity() {
  try {
    // KB05<AO ?>;CG8BL A5AA8N ?> link_code
    // RLS ?>;8B8:0 allow_select_by_link_code_param ?>72>;8B MB> A45;0BL
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

    // @>25@O5< AB0BCA A5AA88
    if (data.status === "completed") {
      errorMsg.textContent = "-B0 0=:5B0 C65 1K;0 70?>;=5=0.";
      errorMsg.classList.add("show");
    }

    // A;8 5ABL 8<O ?0F85=B0 - ?@5470?>;=O5<
    if (data.patient_name) {
      $("patientName").value = data.patient_name;
    }

    // >:07K205< D>@<C
    loadingEl.style.display = "none";
    formContainer.style.display = "block";
  } catch (error) {
    console.error("Error checking link:", error);
    loadingEl.style.display = "none";
    invalidLink.style.display = "block";
  }
}

// 1@01>BG8: >B?@02:8 D>@<K
patientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // !:@K205< A>>1I5=8O
  errorMsg.classList.remove("show");
  successMsg.classList.remove("show");

  // ;>:8@C5< :=>?:C
  submitBtn.disabled = true;
  submitBtn.textContent = "B?@02:0...";

  try {
    // !>18@05< 40==K5 D>@<K
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

    // 0;840F8O >1O70B5;L=KE ?>;59
    if (!formData.patient_name || !formData.gender || !formData.age || !formData.main_complaint) {
      throw new Error(">60;C9AB0, 70?>;=8B5 2A5 >1O70B5;L=K5 ?>;O.");
    }

    // B?@02;O5< 40==K5 2 Supabase
    // RLS ?>;8B8:0 allow_update_by_link_code_param ?>72>;8B >1=>28BL 70?8AL
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
      throw new Error("H81:0 ?@8 A>E@0=5=88 40==KE. >60;C9AB0, ?>?@>1C9B5 A=>20.");
    }

    // #A?5E!
    successMsg.classList.add("show");
    patientForm.style.display = "none";

    // >6=> ?5@5=0?@028BL 8;8 ?>:070BL A>>1I5=85
    setTimeout(() => {
      // window.location.href = "./thank-you.html";
    }, 2000);

  } catch (error) {
    errorMsg.textContent = error.message || "@>87>H;0 >H81:0 ?@8 >B?@02:5 D>@<K.";
    errorMsg.classList.add("show");
    console.error("Submit error:", error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "B?@028BL 0=:5BC";
  }
});
