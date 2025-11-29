/**********************************************
 * CONFIGURAÇÃO SUPABASE
 **********************************************/
const SUPABASE_URL = "https://pcpjsuzfbjbsztepcglw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_P6awrwvBFtKqWq1Oeihgvg_FFgVBYF7";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**********************************************
 * ELEMENTOS DO DOM
 **********************************************/
const loginBtn = document.getElementById("btn-login");
const logoutBtn = document.getElementById("btn-logout");

const profileCard = document.getElementById("profile-card");
const equipmentCard = document.getElementById("equipment-card");
const workoutCard = document.getElementById("workout-card");

const userInfo = document.getElementById("user-info");

const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const saveProfileBtn = document.getElementById("save-profile");

const eqName = document.getElementById("eq-name");
const eqNotes = document.getElementById("eq-notes");
const addEqBtn = document.getElementById("add-eq");
const equipmentList = document.getElementById("equipment-list");

const sessionsList = document.getElementById("sessions-list");
const newSessionBtn = document.getElementById("new-session");

const exportBtn = document.getElementById("export-data");
const fileInput = document.getElementById("file-input");
const downloadLink = document.getElementById("download-link");

const alerts = document.getElementById("alerts");

/**********************************************
 * UTILITÁRIOS
 **********************************************/
function showAlert(msg, type = "info") {
  alerts.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${msg}
    </div>
  `;
  setTimeout(() => alerts.innerHTML = "", 3000);
}

/**********************************************
 * LOGIN GITHUB
 **********************************************/
loginBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "https://f100pilot.github.io/workout-tracker/"
    }
  });

  if (error) {
    console.error("Erro no login:", error);
    showAlert("Erro ao iniciar sessão", "danger");
  }
});

/**********************************************
 * LOGOUT
 **********************************************/
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

/**********************************************
 * ESTADO DE AUTENTICAÇÃO (SEM REDIRECTS!)
 **********************************************/
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    console.log("Sessão iniciada:", session);
    showLoggedInUI();
    await loadUserData();
    await loadEquipment();
    await loadSessions();
  } else {
    showLoggedOutUI();
  }
});

/**********************************************
 * UI
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

  userInfo.innerText = "";
}

/**********************************************
 * PERFIL — CARREGAR
 **********************************************/
async function loadUserData() {
  const { data: { user } } = await supabase.auth.getUser();
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
 * PERFIL — GUARDAR
 **********************************************/
saveProfileBtn.addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates = {
    user_id: user.id,
    name: nameInput.value,
    age: parseInt(ageInput.value) || null,
    weight_kg: parseFloat(weightInput.value) || null,
    height_cm: parseInt(heightInput.value) || null,
    updated_at: new Date()
  };

  const { error } = await supabase.from("profiles").upsert(updates);
  if (error) return showAlert("Erro ao guardar perfil", "danger");

  showAlert("Perfil guardado com sucesso!", "success");
});

/**********************************************
 * EQUIPAMENTO — CARREGAR
 **********************************************/
async function loadEquipment() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("equipment")
    .select("*")
    .eq("user_id", user.id);

  equipmentList.innerHTML = "";

  data?.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerText = `${item.name} — ${item.notes || ""}`;
    equipmentList.appendChild(li);
  });
}

/**********************************************
 * EQUIPAMENTO — ADICIONAR
 **********************************************/
addEqBtn.addEventListener("click", async () => {
  const name = eqName.value.trim();
  if (!name) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("equipment").insert({
    user_id: user.id,
    name: name,
    notes: eqNotes.value.trim()
  });

  if (error) return showAlert("Erro a adicionar equipamento", "danger");

  eqName.value = "";
  eqNotes.value = "";
  loadEquipment();
});

/**********************************************
 * TREINOS — CARREGAR
 **********************************************/
async function loadSessions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  sessionsList.innerHTML = "";

  data?.forEach(w => {
    const div = document.createElement("div");
    div.className = "list-group-item";
    div.innerText = `Treino em ${new Date(w.date).toLocaleString()}`;
    sessionsList.appendChild(div);
  });
}

/**********************************************
 * NOVA SESSÃO
 **********************************************/
newSessionBtn.addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("workouts").insert({
    user_id: user.id,
    date: new Date(),
    data: {}
  });

  loadSessions();
});

/**********************************************
 * EXPORTAR JSON
 **********************************************/
exportBtn.addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const profile = await supabase.from("profiles").select("*").eq("user_id", user.id);
  const equipment = await supabase.from("equipment").select("*").eq("user_id", user.id);
  const workouts = await supabase.from("workouts").select("*").eq("user_id", user.id);

  const json = JSON.stringify({ profile, equipment, workouts }, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "backup.json";
  downloadLink.style.display = "block";
});

/**********************************************
 * IMPORTAR JSON
 **********************************************/
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);

  alert("Importação lida (restauro manual em breve).");
});
