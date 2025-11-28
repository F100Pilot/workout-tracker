const SUPABASE_URL = 'https://pcpjsuzfbjbsztepcglw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P6awrwvBFtKqWq1Oeihgvg_FFgVBYF7';

// === Inicialização Supabase ===
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const alerts = document.getElementById('alerts');

const profileCard = document.getElementById('profile-card');
const equipmentCard = document.getElementById('equipment-card');
const workoutCard = document.getElementById('workout-card');

const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const saveProfileBtn = document.getElementById('save-profile');

const eqName = document.getElementById('eq-name');
const eqNotes = document.getElementById('eq-notes');
const addEqBtn = document.getElementById('add-eq');
const equipmentList = document.getElementById('equipment-list');

const newSessionBtn = document.getElementById('new-session');
const sessionsList = document.getElementById('sessions-list');

const exportBtn = document.getElementById('export-data');
const downloadLink = document.getElementById('download-link');
const fileInput = document.getElementById('file-input');

let currentUser = null;
let profile = null;

// Helpers
function showAlert(message, type='info') {
  alerts.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  setTimeout(()=> alerts.innerHTML = '', 4000);
}

// AUTH
btnLogin.addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({ provider: 'github' });
});

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  currentUser = null;
  renderUiForUnauth();
  showAlert('Logged out', 'secondary');
});

supabase.auth.onAuthStateChange((event, session) => {
  const s = session?.user;
  if (s) {
    currentUser = s;
    userInfo.textContent = s.email || s.user_metadata?.name || s.id;
    ensureProfile(s).then(()=> loadAll());
    renderUiForAuth();
  } else {
    renderUiForUnauth();
  }
});

(async ()=>{
  const { data } = await supabase.auth.getSession();
  const s = data.session?.user;
  if (s) {
    currentUser = s;
    userInfo.textContent = s.email || s.user_metadata?.name || s.id;
    ensureProfile(s).then(()=> loadAll());
    renderUiForAuth();
  } else {
    renderUiForUnauth();
  }
})();

function renderUiForAuth() {
  btnLogin.style.display = 'none';
  btnLogout.style.display = 'inline-block';
  profileCard.style.display = 'block';
  equipmentCard.style.display = 'block';
  workoutCard.style.display = 'block';
}

function renderUiForUnauth() {
  btnLogin.style.display = 'inline-block';
  btnLogout.style.display = 'none';
  profileCard.style.display = 'none';
  equipmentCard.style.display = 'none';
  workoutCard.style.display = 'none';
  userInfo.textContent = '';
}

// Ensure profile exists
async function ensureProfile(user) {
  const user_id = user.id;
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user_id).maybeSingle();
  if (error) {
    console.error('fetch profile error', error);
    return;
  }
  if (!data) {
    const metadata = user.user_metadata || {};
    const profileObj = {
      user_id,
      github_id: metadata?.login || null,
      email: user.email || null,
      username: metadata?.login || null,
      avatar_url: metadata?.avatar_url || metadata?.picture || null,
      name: metadata?.name || null
    };
    const { error: insertErr } = await supabase.from('profiles').insert(profileObj);
    if (insertErr) console.error('insert profile error', insertErr);
  }
}

// Profile CRUD
saveProfileBtn.addEventListener('click', async () => {
  if (!currentUser) return alert('Faz login primeiro');
  const user_id = currentUser.id;
  const updates = {
    user_id,
    name: nameInput.value,
    age: parseInt(ageInput.value || 0),
    weight_kg: parseFloat(weightInput.value || 0),
    height_cm: parseFloat(heightInput.value || 0),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'user_id' });
  if (error) return showAlert('Erro ao guardar perfil', 'danger');
  showAlert('Perfil guardado', 'success');
  await loadProfile();
});

// Equipment CRUD
addEqBtn.addEventListener('click', async () => {
  if (!currentUser) return alert('Faz login primeiro');
  const name = eqName.value.trim();
  if (!name) return;
  const { error } = await supabase.from('equipment').insert({ user_id: currentUser.id, name, notes: eqNotes.value });
  if (error) return showAlert('Erro ao adicionar equipamento', 'danger');
  eqName.value = ''; eqNotes.value = '';
  loadEquipment();
});

async function loadEquipment() {
  if (!currentUser) return;
  const { data, error } = await supabase.from('equipment').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error) return console.error(error);
  equipmentList.innerHTML = '';
  data.forEach(it => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-start';
    li.innerHTML = `<div><strong>${it.name}</strong><br/><small>${it.notes||''}</small></div>`;
    const del = document.createElement('button');
    del.className = 'btn btn-sm btn-outline-danger';
    del.textContent = 'Apagar';
    del.addEventListener('click', async ()=> {
      await supabase.from('equipment').delete().eq('id', it.id);
      loadEquipment();
    });
    li.appendChild(del);
    equipmentList.appendChild(li);
  });
}

// Workouts
newSessionBtn.addEventListener('click', async () => {
  if (!currentUser) return alert('Faz login primeiro');
  const payload = { user_id: currentUser.id, data: { entries: [] } };
  const { error } = await supabase.from('workouts').insert(payload);
  if (error) return showAlert('Erro a criar sessão', 'danger');
  loadWorkouts();
});

async function loadWorkouts() {
  if (!currentUser) return;
  const { data, error } = await supabase.from('workouts').select('*').eq('user_id', currentUser.id).order('date', { ascending: false });
  if (error) return console.error(error);
  sessionsList.innerHTML = '';
  data.forEach(s => {
    const li = document.createElement('div');
    li.className = 'list-group-item';
    const date = new Date(s.date).toLocaleString();
    let html = `<div class="d-flex justify-content-between"><div><strong>${date}</strong></div><div><button class="btn btn-sm btn-outline-secondary add-entry" data-id="${s.id}">Adicionar Série</button></div></div>`;
    if (s.data?.entries && s.data.entries.length) {
      html += '<ul class="mt-2">';
      s.data.entries.forEach(e => {
        html += `<li>${e.exercise} — reps: ${e.reps} — peso: ${e.weight||0}kg</li>`;
      });
      html += '</ul>';
    }
    li.innerHTML = html;
    sessionsList.appendChild(li);
    li.querySelector('.add-entry').addEventListener('click', ()=> addEntryToSession(s.id));
  });
}

async function addEntryToSession(sessionId) {
  const exercise = prompt('Nome do exercício (ex.: Supino)');
  if (!exercise) return;
  const reps = parseInt(prompt('Reps (número):') || '0');
  const weight = parseFloat(prompt('Peso (kg):') || '0');
  const { data, error } = await supabase.from('workouts').select('*').eq('id', sessionId).maybeSingle();
  if (error || !data) return console.error(error || 'session not found');
  const sess = data;
  const entries = sess.data?.entries || [];
  entries.push({ exercise, reps, weight, added_at: new Date().toISOString() });
  const { error: updateErr } = await supabase.from('workouts').update({ data: { entries } }).eq('id', sessionId);
  if (updateErr) return showAlert('Erro ao guardar série', 'danger');
  loadWorkouts();
}

// Load all user data
async function loadAll() {
  await loadProfile();
  await loadEquipment();
  await loadWorkouts();
}

async function loadProfile() {
  if (!currentUser) return;
  const { data } = await supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle();
  if (!data) return;
  profile = data;
  nameInput.value = profile.name || '';
  ageInput.value = profile.age || '';
  weightInput.value = profile.weight_kg || '';
  heightInput.value = profile.height_cm || '';
}

// Export data
exportBtn.addEventListener('click', async ()=> {
  if (!currentUser) return alert('Faz login primeiro');
  const { data: p } = await supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle();
  const { data: eq } = await supabase.from('equipment').select('*').eq('user_id', currentUser.id);
  const { data: w } = await supabase.from('workouts').select('*').eq('user_id', currentUser.id);
  const blob = new Blob([JSON.stringify({ profile: p, equipment: eq, workouts: w }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = 'workout-data.json';
  downloadLink.style.display = 'inline-block';
  downloadLink.textContent = 'Descarregar dados';
});

// Import data
fileInput.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const txt = await f.text();
  try {
    const obj = JSON.parse(txt);
    if (obj.profile) {
      await supabase.from('profiles').upsert({ ...obj.profile, user_id: currentUser.id }, { onConflict: 'user_id' });
    }
    if (obj.equipment && obj.equipment.length) {
      for (const it of obj.equipment) {
        await supabase.from('equipment').insert({ user_id: currentUser.id, name: it.name, notes: it.notes || '' });
      }
    }
    if (obj.workouts && obj.workouts.length) {
      for (const w of obj.workouts) {
        await supabase.from('workouts').insert({ user_id: currentUser.id, data: w.data || { entries: [] } });
      }
    }
    showAlert('Import concluído', 'success');
    loadAll();
  } catch(err) {
    showAlert('Erro a importar: ficheiro inválido', 'danger');
  }
});
