/**********************************************
 * SUPABASE CONFIG
 **********************************************/
const SUPABASE_URL = "https://pcpjsuzfbjbsztepcglw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcGpzdXpmYmpic3p0ZXBjZ2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzk1NTEsImV4cCI6MjA3OTgxNTU1MX0.je8roo-yz9dyc5nC52WBKOcO7DyUAUXYa-TdKz6QANY";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/**********************************************
 * DOM ELEMENTS
 **********************************************/
const loginBtn = document.getElementById("btn-login");
const logoutBtn = document.getElementById("btn-logout");

const userInfo = document.getElementById("user-info");

const profileCard = document.getElementById("profile-card");
const equipmentCard = document.getElementById("equipment-card");
const workoutCard = document.getElementById("workout-card");

const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const saveProfileBtn = document.getElementById("save-profile");

const eqName = document.getElementById("eq-name");
const eqNotes = document.getElementById("eq-notes");
const addEqBtn = document.getElementById("btn-add-eq");

const equipmentList = document.getElementById("equipment-list");

const sessionsList = document.getElementById("sessions-list");
const newSessionBtn = document.getElementById("new-session");

const exportBtn = document.getElementById("export-data");
const fileInput = document.getElementById("file-input");
const downloadLink = document.getElementById("download-link");
const alerts = document.getElementById("alerts");

/**********************************************
 * ALERT SYSTEM
 **********************************************/
function showAlert(msg, type = "info") {
  alerts.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
  setTimeout(() => (alerts.innerHTML = ""), 3000);
}

/**********************************************
 * RESTORE SESSION
 **********************************************/
async function restoreSession() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData?.session) {
    showLoggedInUI();
    await loadUserData();
    await loadEquipment();
    await loadSessions();
  } else {
    showLoggedOutUI();
  }
}

restoreSession();

/**********************************************
 * LOGIN WITH GITHUB
 **********************************************/
loginBtn.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "https://f100pilot.github.io/workout-tracker/",
    },
  });
});

/**********************************************
 * LOGOUT
 **********************************************/
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

/**********************************************
 * AUTH STATE LISTENER
 **********************************************/
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    showLoggedInUI();
    await loadUserData();
    await loadEquipment();
    await loadSessions();
  } else {
    showLoggedOutUI();
  }
});

/**********************************************
 * UI FUNCTIONS
 **********************************************/
function showLoggedInUI() {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "block";

  profileCard.style.display = "block";
  equipmentCard.style.display = "block";
  workoutCard.style.display = "block";
}

function showLoggedOutUI() {
  loginBtn.style.display = "block";
  logoutBtn.style.display = "none";

  profileCard.style.display = "none";
  equipmentCard.style.display = "none";
  workoutCard.style.display = "none";
}

/**********************************************
 * LOAD PROFILE
 **********************************************/
async function loadUserData() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  userInfo.innerText = user.email;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return;

  nameInput.value = data.name ?? "";
  ageInput.value = data.age ?? "";
  weightInput.value = data.weight_kg ?? "";
  heightInput.value = data.height_cm ?? "";
}

/**********************************************
 * SAVE PROFILE
 **********************************************/
saveProfileBtn.addEventListener("click", async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  const updates = {
    user_id: user.id,
    name: nameInput.value,
    age: parseInt(ageInput.value) || null,
    weight_kg: parseFloat(weightInput.value) || null,
    height_cm: parseInt(heightInput.value) || null,
    updated_at: new Date(),
  };

  await supabase.from("profiles").upsert(updates);

  showAlert("Perfil guardado com sucesso!", "success");
});

/**********************************************
 * LOAD EQUIPMENT
 **********************************************/
async function loadEquipment() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("equipment")
    .select("*")
    .eq("user_id", user.id);

  equipmentList.innerHTML = "";

  data?.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerText = `${item.name} — ${item.notes || ""}`;
    equipmentList.appendChild(li);
  });
}

/**********************************************
 * ADD EQUIPMENT
 **********************************************/
addEqBtn.addEventListener("click", async () => {
  const name = eqName.value.trim();
  if (!name) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("equipment").insert({
    user_id: user.id,
    name: name,
    notes: eqNotes.value.trim(),
  });

  showAlert("Equipamento adicionado!", "success");
  eqName.value = "";
  eqNotes.value = "";
  loadEquipment();
});

/**********************************************
 * LOAD SESSIONS
 **********************************************/
async function loadSessions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  sessionsList.innerHTML = "";

  data?.forEach((w) => {
    const div = document.createElement("div");
    div.className = "list-group-item";
    div.innerText = `Treino — ${new Date(w.date).toLocaleString()}`;
    sessionsList.appendChild(div);
  });
}

/**********************************************
 * NEW SESSION
 **********************************************/
newSessionBtn.addEventListener("click", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("workouts").insert({
    user_id: user.id,
    date: new Date(),
    data: {},
  });

  showAlert("Treino registado!", "success");
  loadSessions();
});

/**********************************************
 * EXPORT JSON
 **********************************************/
exportBtn.addEventListener("click", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id);

  const equipment = await supabase
    .from("equipment")
    .select("*")
    .eq("user_id", user.id);

  const workouts = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id);

  const json = JSON.stringify({ profile, equipment, workouts }, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "backup.json";
  downloadLink.style.display = "block";
});

/**********************************************
 * IMPORT JSON
 **********************************************/
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);

  alert("Importação lida (restauro automático será adicionado).");
});
