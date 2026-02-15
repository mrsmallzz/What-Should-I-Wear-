 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app.js b/app.js
new file mode 100644
index 0000000000000000000000000000000000000000..a79e54fa0059197ca1aa4629bb927704b8953fe5
--- /dev/null
+++ b/app.js
@@ -0,0 +1,385 @@
+const state = {
+  userName: localStorage.getItem('userName') || '',
+  location: localStorage.getItem('location') || '',
+  age: localStorage.getItem('age') || '',
+  calendarLink: localStorage.getItem('calendarLink') || '',
+  onboardingComplete: localStorage.getItem('onboardingComplete') === 'true',
+  closets: JSON.parse(localStorage.getItem('closets') || '[]'),
+  selectedClosetId: localStorage.getItem('selectedClosetId') || '',
+  tenDayPlans: JSON.parse(localStorage.getItem('tenDayPlans') || '[]'),
+  travelPlans: JSON.parse(localStorage.getItem('travelPlans') || '[]')
+};
+
+const $ = (id) => document.getElementById(id);
+
+function persist() {
+  localStorage.setItem('userName', state.userName);
+  localStorage.setItem('location', state.location);
+  localStorage.setItem('age', state.age);
+  localStorage.setItem('calendarLink', state.calendarLink);
+  localStorage.setItem('onboardingComplete', String(state.onboardingComplete));
+  localStorage.setItem('closets', JSON.stringify(state.closets));
+  localStorage.setItem('selectedClosetId', state.selectedClosetId || '');
+  localStorage.setItem('tenDayPlans', JSON.stringify(state.tenDayPlans));
+  localStorage.setItem('travelPlans', JSON.stringify(state.travelPlans));
+}
+
+function uid() {
+  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
+}
+
+function selectedCloset() {
+  return state.closets.find(c => c.id === state.selectedClosetId) || null;
+}
+
+function detailsHeading(name) {
+  const clean = (name || '').trim();
+  return clean ? `Tell us a little more, ${clean}` : 'Tell us a little more';
+}
+
+function showScreen(id) {
+  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
+  $(id).classList.remove('hidden');
+  if (id === 'screen-details') {
+    $('details-title').textContent = detailsHeading(state.userName);
+  }
+}
+
+function showApp() {
+  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
+  $('app-shell').classList.remove('hidden');
+  renderHome();
+  renderClosets();
+  renderSelectedClosetItems();
+  renderPlans();
+}
+
+function weatherCodeToText(code) {
+  const map = {
+    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog',
+    61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Rain showers'
+  };
+  return map[code] || 'Variable';
+}
+
+async function fetchWeather(location, date) {
+  if (!location || !date) return { summary: 'Missing location/date', daysOut: 0 };
+  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
+  const geoData = await geo.json();
+  if (!geoData.results || !geoData.results[0]) throw new Error('Location not found.');
+  const { latitude, longitude } = geoData.results[0];
+
+  const target = new Date(date);
+  const today = new Date();
+  const daysOut = Math.ceil((target - today) / 86400000);
+
+  const start = today.toISOString().slice(0, 10);
+  const end = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
+  const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`);
+  const weatherData = await weather.json();
+  const idx = weatherData.daily.time.indexOf(date);
+  if (idx < 0) return { summary: `Forecast unavailable for ${date}`, daysOut };
+
+  const code = weatherData.daily.weather_code[idx];
+  const min = Math.round(weatherData.daily.temperature_2m_min[idx]);
+  const max = Math.round(weatherData.daily.temperature_2m_max[idx]);
+  return { summary: `${weatherCodeToText(code)} (${min}°C - ${max}°C)`, daysOut };
+}
+
+function renderHome() {
+  $('home-name').textContent = state.userName || '-';
+  $('home-location').textContent = state.location || '-';
+  $('home-calendar').textContent = state.calendarLink ? `Linked (${state.calendarLink})` : 'Not linked';
+}
+
+function renderClosets() {
+  const holder = $('closet-list');
+  holder.innerHTML = '';
+  if (!state.closets.length) {
+    holder.innerHTML = '<p class="muted">No closets yet. Create one to get started.</p>';
+    return;
+  }
+
+  state.closets.forEach(closet => {
+    const div = document.createElement('div');
+    div.className = 'list-item';
+    div.innerHTML = `
+      <h4>${closet.name} ${closet.id === state.selectedClosetId ? '<span class="pill">Selected</span>' : ''}</h4>
+      <p class="muted">${closet.items.length} items</p>
+      <div class="actions">
+        <button data-action="select" data-id="${closet.id}">Select</button>
+        <button data-action="favorite" data-id="${closet.id}">${closet.favorite ? 'Unfavorite' : 'Favorite'} closet</button>
+        <button data-action="dislike" data-id="${closet.id}">${closet.disliked ? 'Undo dislike' : 'Dislike'} closet</button>
+      </div>
+    `;
+    holder.appendChild(div);
+  });
+
+  holder.querySelectorAll('button').forEach((btn) => {
+    btn.addEventListener('click', () => {
+      const closet = state.closets.find(c => c.id === btn.dataset.id);
+      if (!closet) return;
+      if (btn.dataset.action === 'select') state.selectedClosetId = closet.id;
+      if (btn.dataset.action === 'favorite') closet.favorite = !closet.favorite;
+      if (btn.dataset.action === 'dislike') closet.disliked = !closet.disliked;
+      persist();
+      renderClosets();
+      renderSelectedClosetItems();
+    });
+  });
+}
+
+function renderSelectedClosetItems() {
+  const holder = $('selected-closet-items');
+  const closet = selectedCloset();
+  holder.innerHTML = '';
+  if (!closet) {
+    holder.innerHTML = '<p class="muted">Select a closet to manage items.</p>';
+    return;
+  }
+  if (!closet.items.length) {
+    holder.innerHTML = '<p class="muted">No items yet in this closet.</p>';
+    return;
+  }
+
+  closet.items.forEach((item) => {
+    const div = document.createElement('div');
+    div.className = 'list-item';
+    div.innerHTML = `
+      <h4>${item.name} <span class="pill">${item.category}</span></h4>
+      <p class="muted">${item.notes || ''}</p>
+      <div class="actions">
+        <button data-action="favorite" data-id="${item.id}">${item.favorite ? 'Unfavorite' : 'Favorite'} item</button>
+        <button data-action="dislike" data-id="${item.id}">${item.disliked ? 'Undo dislike' : 'Dislike'} item</button>
+        <button data-action="remove" data-id="${item.id}">Remove item</button>
+      </div>
+    `;
+    holder.appendChild(div);
+  });
+
+  holder.querySelectorAll('button').forEach((btn) => {
+    btn.addEventListener('click', () => {
+      const item = closet.items.find(i => i.id === btn.dataset.id);
+      if (!item) return;
+      if (btn.dataset.action === 'favorite') item.favorite = !item.favorite;
+      if (btn.dataset.action === 'dislike') item.disliked = !item.disliked;
+      if (btn.dataset.action === 'remove') closet.items = closet.items.filter(i => i.id !== item.id);
+      persist();
+      renderSelectedClosetItems();
+      renderClosets();
+    });
+  });
+}
+
+function renderPlans() {
+  const ten = $('ten-day-list');
+  ten.innerHTML = '';
+  state.tenDayPlans.forEach(plan => {
+    const div = document.createElement('div');
+    div.className = 'list-item';
+    div.innerHTML = `
+      <h4>${plan.name}</h4>
+      <p class="muted">${plan.days.map((d, i) => `Day ${i + 1}: ${d.outfits.length}`).join(' | ')}</p>
+      <div class="actions">
+        <button data-action="add" data-id="${plan.id}">Add outfit to day</button>
+        <button data-action="remove" data-id="${plan.id}">Remove outfit from day</button>
+      </div>
+    `;
+    ten.appendChild(div);
+  });
+
+  ten.querySelectorAll('button').forEach(btn => {
+    btn.addEventListener('click', () => {
+      const plan = state.tenDayPlans.find(p => p.id === btn.dataset.id);
+      if (!plan) return;
+      const day = Number(prompt('Day number (1-10):', '1'));
+      if (!day || day < 1 || day > 10) return;
+      if (btn.dataset.action === 'add') {
+        const label = prompt('Outfit label:', 'Daily');
+        if (!label) return;
+        plan.days[day - 1].outfits.push({ id: uid(), label });
+      } else {
+        plan.days[day - 1].outfits.pop();
+      }
+      persist();
+      renderPlans();
+    });
+  });
+
+  const travel = $('travel-list');
+  travel.innerHTML = '';
+  state.travelPlans.forEach(plan => {
+    const div = document.createElement('div');
+    div.className = 'list-item';
+    div.innerHTML = `
+      <h4>${plan.name}</h4>
+      <p class="muted">${plan.days.length} days | Base: ${plan.baseLocation || 'N/A'}</p>
+      <div class="actions">
+        <button data-action="location" data-id="${plan.id}">Set day location</button>
+        <button data-action="outfit" data-id="${plan.id}">Add travel outfit</button>
+      </div>
+    `;
+    travel.appendChild(div);
+  });
+
+  travel.querySelectorAll('button').forEach(btn => {
+    btn.addEventListener('click', () => {
+      const plan = state.travelPlans.find(p => p.id === btn.dataset.id);
+      if (!plan) return;
+      const day = Number(prompt(`Day number (1-${plan.days.length})`, '1'));
+      if (!day || day < 1 || day > plan.days.length) return;
+      if (btn.dataset.action === 'location') {
+        const loc = prompt('Location:', plan.baseLocation || '');
+        if (loc !== null) plan.days[day - 1].location = loc;
+      } else {
+        const label = prompt('Outfit label:', 'Event');
+        if (!label) return;
+        plan.days[day - 1].outfits.push({ id: uid(), label });
+      }
+      persist();
+      renderPlans();
+    });
+  });
+}
+
+function analyzeOutfitPhoto(name) {
+  return [
+    { name: `${name} - Top`, category: 'Tops' },
+    { name: `${name} - Bottom`, category: 'Bottoms' },
+    { name: `${name} - Shoes`, category: 'Shoes' },
+    { name: `${name} - Layer`, category: 'Outerwear' }
+  ];
+}
+
+$('start-btn').addEventListener('click', () => showScreen('screen-name'));
+
+$('name-continue').addEventListener('click', () => {
+  const name = $('user-name').value.trim();
+  if (!name) return alert('Please enter your name.');
+  state.userName = name;
+  persist();
+  showScreen('screen-details');
+});
+
+$('details-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  state.location = $('location').value.trim();
+  state.age = $('age').value;
+  state.calendarLink = $('calendar-link').value.trim();
+  persist();
+  showScreen('screen-photos');
+});
+
+$('photo-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  const closetName = $('default-closet-name').value.trim() || 'My Closet';
+  let closet = state.closets.find(c => c.name.toLowerCase() === closetName.toLowerCase());
+  if (!closet) {
+    closet = { id: uid(), name: closetName, favorite: false, disliked: false, items: [] };
+    state.closets.push(closet);
+  }
+  state.selectedClosetId = closet.id;
+
+  const itemFiles = Array.from($('item-photos').files || []);
+  itemFiles.forEach((file) => {
+    closet.items.push({ id: uid(), name: file.name, category: 'Accessories', notes: 'Uploaded individual item', favorite: false, disliked: false });
+  });
+
+  const outfitFiles = Array.from($('outfit-photos').files || []);
+  outfitFiles.forEach((file) => {
+    closet.items.push({ id: uid(), name: file.name, category: 'Outfit', notes: 'Uploaded full outfit photo', favorite: false, disliked: false });
+    analyzeOutfitPhoto(file.name).forEach((generated) => {
+      closet.items.push({ id: uid(), name: generated.name, category: generated.category, notes: 'Auto-generated from outfit photo', favorite: false, disliked: false });
+    });
+  });
+
+  state.onboardingComplete = true;
+  persist();
+  showApp();
+});
+
+$('home-date-picker').addEventListener('change', async () => {
+  try {
+    const chosenDate = $('home-date-picker').value;
+    const weather = await fetchWeather(state.location, chosenDate);
+    $('home-weather').textContent = weather.summary;
+    if (weather.daysOut > 10) {
+      $('date-warning').classList.remove('hidden');
+      $('date-warning').textContent = 'Heads up: this date is more than 10 days away, so weather forecast may be less accurate.';
+    } else {
+      $('date-warning').classList.add('hidden');
+      $('date-warning').textContent = '';
+    }
+  } catch (err) {
+    $('home-weather').textContent = `Weather unavailable: ${err.message}`;
+  }
+});
+
+$('closet-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  const name = $('closet-name').value.trim();
+  if (!name) return;
+  const closet = { id: uid(), name, favorite: false, disliked: false, items: [] };
+  state.closets.push(closet);
+  state.selectedClosetId = closet.id;
+  $('closet-form').reset();
+  persist();
+  renderClosets();
+  renderSelectedClosetItems();
+});
+
+$('item-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  const closet = selectedCloset();
+  if (!closet) return alert('Create or select a closet first.');
+  closet.items.push({
+    id: uid(),
+    name: $('item-name').value.trim(),
+    category: $('item-category').value,
+    notes: $('item-notes').value.trim(),
+    favorite: false,
+    disliked: false
+  });
+  $('item-form').reset();
+  persist();
+  renderSelectedClosetItems();
+  renderClosets();
+});
+
+$('ten-day-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  const name = $('ten-day-name').value.trim();
+  if (!name) return;
+  state.tenDayPlans.push({ id: uid(), name, days: Array.from({ length: 10 }, () => ({ outfits: [] })) });
+  $('ten-day-form').reset();
+  persist();
+  renderPlans();
+});
+
+$('travel-form').addEventListener('submit', (e) => {
+  e.preventDefault();
+  const name = $('travel-name').value.trim();
+  const days = Number($('travel-days').value);
+  const baseLocation = $('travel-location').value.trim();
+  if (!name || !days) return;
+  state.travelPlans.push({ id: uid(), name, baseLocation, days: Array.from({ length: days }, () => ({ location: '', outfits: [] })) });
+  $('travel-form').reset();
+  persist();
+  renderPlans();
+});
+
+document.querySelectorAll('.tab').forEach((tab) => {
+  tab.addEventListener('click', () => {
+    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
+    tab.classList.add('active');
+    const target = tab.dataset.tab;
+    document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
+    $(`panel-${target}`).classList.remove('hidden');
+  });
+});
+
+if (state.onboardingComplete) {
+  showApp();
+} else {
+  showScreen('screen-onboarding');
+}
 
EOF
)
