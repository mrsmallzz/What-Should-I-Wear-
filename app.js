const state = {
  userName: localStorage.getItem('userName') || '',
  location: localStorage.getItem('location') || '',
  age: localStorage.getItem('age') || '',
  calendarLink: localStorage.getItem('calendarLink') || '',
  onboardingComplete: localStorage.getItem('onboardingComplete') === 'true',
  closets: JSON.parse(localStorage.getItem('closets') || '[]'),
  selectedClosetId: localStorage.getItem('selectedClosetId') || '',
  tenDayPlans: JSON.parse(localStorage.getItem('tenDayPlans') || '[]'),
  travelPlans: JSON.parse(localStorage.getItem('travelPlans') || '[]')
};

const $ = (id) => document.getElementById(id);

function persist() {
  localStorage.setItem('userName', state.userName);
  localStorage.setItem('location', state.location);
  localStorage.setItem('age', state.age);
  localStorage.setItem('calendarLink', state.calendarLink);
  localStorage.setItem('onboardingComplete', String(state.onboardingComplete));
  closets: JSON.parse(localStorage.getItem('closets') || '[]'),
  selectedClosetId: localStorage.getItem('selectedClosetId') || null,
  suggestions: [],
  tenDayPlans: JSON.parse(localStorage.getItem('tenDayPlans') || '[]'),
  travelPlans: JSON.parse(localStorage.getItem('travelPlans') || '[]'),
  mostRecentOutfit: localStorage.getItem('mostRecentOutfit') || 'None yet',
  calendarLink: localStorage.getItem('calendarLink') || ''
};

const ids = (id) => document.getElementById(id);

function persist() {
  localStorage.setItem('closets', JSON.stringify(state.closets));
  localStorage.setItem('selectedClosetId', state.selectedClosetId || '');
  localStorage.setItem('tenDayPlans', JSON.stringify(state.tenDayPlans));
  localStorage.setItem('travelPlans', JSON.stringify(state.travelPlans));
  localStorage.setItem('mostRecentOutfit', state.mostRecentOutfit || 'None yet');
  localStorage.setItem('calendarLink', state.calendarLink || '');
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function selectedCloset() {
  return state.closets.find(c => c.id === state.selectedClosetId) || null;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function showApp() {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  $('app-shell').classList.remove('hidden');
  renderHome();
  renderClosets();
  renderSelectedClosetItems();
  renderPlans();
}

function weatherCodeToText(code) {
  const map = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog',
    61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Rain showers'
  };
  return map[code] || 'Variable';
}

async function fetchWeather(location, date) {
  if (!location || !date) return { summary: 'Missing location/date', daysOut: 0 };
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
  const geoData = await geo.json();
  if (!geoData.results || !geoData.results[0]) throw new Error('Location not found.');
  const { latitude, longitude } = geoData.results[0];

  const target = new Date(date);
  const today = new Date();
  const daysOut = Math.ceil((target - today) / 86400000);

  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`);
  const weatherData = await weather.json();
  const idx = weatherData.daily.time.indexOf(date);
  if (idx < 0) return { summary: `Forecast unavailable for ${date}`, daysOut };

  const code = weatherData.daily.weather_code[idx];
  const min = Math.round(weatherData.daily.temperature_2m_min[idx]);
  const max = Math.round(weatherData.daily.temperature_2m_max[idx]);
  return { summary: `${weatherCodeToText(code)} (${min}°C - ${max}°C)`, daysOut };
}

function renderHome() {
  $('home-name').textContent = state.userName || '-';
  $('home-location').textContent = state.location || '-';
  $('home-calendar').textContent = state.calendarLink ? `Linked (${state.calendarLink})` : 'Not linked';
}

function renderClosets() {
  const holder = $('closet-list');
  holder.innerHTML = '';
  if (!state.closets.length) {
    holder.innerHTML = '<p class="muted">No closets yet. Create one to get started.</p>';
    return;
  }

  state.closets.forEach(closet => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <h4>${closet.name} ${closet.id === state.selectedClosetId ? '<span class="pill">Selected</span>' : ''}</h4>
function renderHome() {
  ids('home-date').textContent = new Date().toLocaleDateString();
  ids('home-calendar').textContent = state.calendarLink ? `Linked (${state.calendarLink})` : 'Not linked';
  ids('home-recent').textContent = state.mostRecentOutfit;
}

function renderClosets() {
  const holder = ids('closet-list');
  holder.innerHTML = '';
  if (!state.closets.length) {
    holder.innerHTML = '<p class="muted">No closets yet. Create one to get started.</p>';
  }
  state.closets.forEach(closet => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const selectedBadge = closet.id === state.selectedClosetId ? '<span class="pill">Selected</span>' : '';
    const favoriteBadge = closet.favorite ? '<span class="pill">Favorite</span>' : '';
    const dislikeBadge = closet.disliked ? '<span class="pill">Disliked</span>' : '';
    div.innerHTML = `
      <h4>${closet.name} ${selectedBadge} ${favoriteBadge} ${dislikeBadge}</h4>
      <p class="muted">${closet.items.length} items</p>
      <div class="actions">
        <button data-action="select" data-id="${closet.id}">Select</button>
        <button data-action="favorite" data-id="${closet.id}">${closet.favorite ? 'Unfavorite' : 'Favorite'} closet</button>
        <button data-action="dislike" data-id="${closet.id}">${closet.disliked ? 'Undo dislike' : 'Dislike'} closet</button>
      </div>
    `;
    holder.appendChild(div);
  });

  holder.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const closet = state.closets.find(c => c.id === btn.dataset.id);
      if (!closet) return;
      if (btn.dataset.action === 'select') state.selectedClosetId = closet.id;
      if (btn.dataset.action === 'favorite') closet.favorite = !closet.favorite;
      if (btn.dataset.action === 'dislike') closet.disliked = !closet.disliked;
      persist();
      renderClosets();
      renderSelectedClosetItems();
    });
  });
}

function renderSelectedClosetItems() {
  const holder = ids('selected-closet-items');
  const closet = selectedCloset();
  holder.innerHTML = '';
  if (!closet) {
    holder.innerHTML = '<p class="muted">Select a closet to manage items.</p>';
    return;
  }
  if (!closet.items.length) {
    holder.innerHTML = `<p class="muted">No items in <strong>${closet.name}</strong> yet.</p>`;
    return;
  }

  closet.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <h4>${item.name} <span class="pill">${item.category}</span></h4>
      <p class="muted">${item.notes || 'No notes'}</p>
      <div class="actions">
        <button data-action="favorite" data-id="${item.id}">${item.favorite ? 'Unfavorite' : 'Favorite'} item</button>
        <button data-action="dislike" data-id="${item.id}">${item.disliked ? 'Undo dislike' : 'Dislike'} item</button>
        <button data-action="remove" data-id="${item.id}">Remove item</button>
      </div>
    `;
    holder.appendChild(div);
  });

  holder.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = closet.items.find(i => i.id === btn.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'favorite') item.favorite = !item.favorite;
      if (btn.dataset.action === 'dislike') item.disliked = !item.disliked;
      if (btn.dataset.action === 'remove') closet.items = closet.items.filter(i => i.id !== item.id);
      persist();
      renderSelectedClosetItems();
      renderClosets();
    });
  });
}

function weatherCodeToText(code) {
  const map = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog',
    61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 80: 'Rain showers'
  };
  return map[code] || 'Variable';
}

async function fetchWeather(location, date) {
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
  const geoData = await geo.json();
  if (!geoData.results || !geoData.results[0]) throw new Error('Location not found.');
  const { latitude, longitude, name, country } = geoData.results[0];

  const target = new Date(date);
  const today = new Date();
  const daysOut = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + (14 * 86400000)).toISOString().slice(0, 10);

  const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`);
  const weatherData = await weather.json();

  const idx = weatherData.daily.time.indexOf(date);
  if (idx < 0) {
    return { summary: `Forecast unavailable for ${date}`, daysOut, locationLabel: `${name}, ${country}` };
  }

  const code = weatherData.daily.weather_code[idx];
  const min = weatherData.daily.temperature_2m_min[idx];
  const max = weatherData.daily.temperature_2m_max[idx];
  return {
    summary: `${weatherCodeToText(code)} (${Math.round(min)}°C - ${Math.round(max)}°C)`,
    daysOut,
    locationLabel: `${name}, ${country}`
  };
}

function suggestOutfits(context) {
  const closet = selectedCloset();
  const items = closet ? closet.items : [];
  const tops = items.filter(i => i.category === 'Tops');
  const bottoms = items.filter(i => i.category === 'Bottoms');
  const shoes = items.filter(i => i.category === 'Shoes');
  const jacket = items.find(i => ['Jackets', 'Outerwear'].includes(i.category));
  const vibe = context.vibeCustom || context.vibePreset;

  const makeLook = (i) => {
    const t = tops[i % Math.max(1, tops.length)]?.name || (i === 1 ? 'Button-up shirt' : 'Classic tee');
    const b = bottoms[i % Math.max(1, bottoms.length)]?.name || (i === 1 ? 'Tailored trousers' : 'Dark jeans');
    const s = shoes[i % Math.max(1, shoes.length)]?.name || (i === 1 ? 'Loafers' : 'Sneakers');
    const outer = jacket ? ` + ${jacket.name}` : '';
    return {
      id: uid(),
      name: `Outfit ${i + 1}: ${vibe} mood`,
      details: `${t} + ${b}${outer} + ${s}. Weather fit for ${context.weather}.`,
      liked: false,
      disliked: false
    };
  };

  return [makeLook(0), makeLook(1), makeLook(2)];
}

function renderSuggestions() {
  const wrap = ids('suggestions');
  wrap.innerHTML = '';
  const tpl = ids('suggestion-template');
  state.suggestions.forEach(s => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('h4').textContent = s.name;
    node.querySelector('.details').textContent = s.details;
    const status = node.querySelector('.status');
    if (s.liked) status.textContent = 'You liked this outfit.';
    if (s.disliked) status.textContent = 'You disliked this outfit.';

    node.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const sug = state.suggestions.find(x => x.id === s.id);
        if (!sug) return;
        const action = btn.dataset.action;
        if (action === 'view') alert(`${sug.name}\n\n${sug.details}`);
        if (action === 'save-existing') {
          const closet = selectedCloset();
          if (!closet) return alert('Select a closet first.');
          closet.items.push({ id: uid(), name: sug.name, category: 'Outfit', notes: sug.details, favorite: false, disliked: false });
          state.mostRecentOutfit = sug.name;
          renderSelectedClosetItems();
          renderClosets();
          renderHome();
        }
        if (action === 'save-new') {
          const name = prompt('Name the new closet:');
          if (!name) return;
          const closet = { id: uid(), name, favorite: false, disliked: false, items: [{ id: uid(), name: sug.name, category: 'Outfit', notes: sug.details }] };
          state.closets.push(closet);
          state.selectedClosetId = closet.id;
          state.mostRecentOutfit = sug.name;
          renderClosets();
          renderSelectedClosetItems();
          renderHome();
        }
        if (action === 'rename') {
          const next = prompt('Rename outfit:', sug.name);
          if (next) sug.name = next;
        }
        if (action === 'like') { sug.liked = true; sug.disliked = false; }
        if (action === 'dislike') { sug.disliked = true; sug.liked = false; }
        persist();
        renderSuggestions();
      });
    });

    wrap.appendChild(node);
  });
}

function renderPlans() {
  const tenWrap = ids('ten-day-list');
  tenWrap.innerHTML = '';
  state.tenDayPlans.forEach(plan => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const dayBlocks = plan.days.map((d, idx) => `<li>Day ${idx + 1}: ${d.outfits.map(o => o.label).join(', ') || 'No outfits'}</li>`).join('');
    div.innerHTML = `
      <h4>${plan.name}</h4>
      <ul>${dayBlocks}</ul>
      <div class="actions">
        <button data-action="add" data-id="${plan.id}">Add outfit to day</button>
        <button data-action="remove" data-id="${plan.id}">Remove outfit from day</button>
      </div>
    `;
    tenWrap.appendChild(div);
  });

  tenWrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = state.tenDayPlans.find(p => p.id === btn.dataset.id);
      if (!plan) return;
      const day = Number(prompt('Day number (1-10):', '1'));
      if (!day || day < 1 || day > 10) return;
      if (btn.dataset.action === 'add') {
        const label = prompt('Outfit label (Dinner, Daily, Brunch, Formal, etc):', 'Daily');
        if (!label) return;
        const name = prompt('Outfit name:', 'Look');
        plan.days[day - 1].outfits.push({ id: uid(), name, label });
      } else {
        const label = prompt('Enter label to remove:', 'Daily');
        plan.days[day - 1].outfits = plan.days[day - 1].outfits.filter(o => o.label !== label);
      }
      persist();
      renderPlans();
    });
  });

  const travelWrap = ids('travel-list');
  travelWrap.innerHTML = '';
  state.travelPlans.forEach(plan => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const days = plan.days.map((d, idx) => `Day ${idx + 1}: ${d.location || plan.baseLocation || 'No location'} (${d.outfits.length} outfits)`).join(' | ');
    div.innerHTML = `
      <h4>${plan.name}</h4>
      <p>${days}</p>
      <div class="actions">
        <button data-action="location" data-id="${plan.id}">Set day location</button>
        <button data-action="outfit" data-id="${plan.id}">Add event/travel outfit</button>
      </div>
    `;
    travelWrap.appendChild(div);
  });

  travelWrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = state.travelPlans.find(p => p.id === btn.dataset.id);
      if (!plan) return;
      const day = Number(prompt(`Day number (1-${plan.days.length})`, '1'));
      if (!day || day < 1 || day > plan.days.length) return;
      if (btn.dataset.action === 'location') {
        const loc = prompt('Location for this day:', plan.baseLocation || '');
        if (loc !== null) plan.days[day - 1].location = loc;
      } else {
        const label = prompt('Event/Outfit label:', 'Event');
        if (!label) return;
        plan.days[day - 1].outfits.push({ id: uid(), label });
      }
      persist();
      renderPlans();
    });
  });
}

ids('questionnaire-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const location = ids('location').value.trim();
  const date = ids('outfit-date').value;
  const vibePreset = ids('vibe-preset').value;
  const vibeCustom = ids('vibe-custom').value.trim();
  const age = ids('age').value;
  const calendar = ids('calendar-link').value.trim();
  const ownedLabel = ids('owned-label').value.trim();
  const targetLabel = ids('target-label').value.trim();
  const targetNotOwned = ids('target-not-owned').checked;

  state.calendarLink = calendar;
  persist();
  renderHome();

  try {
    ids('weather-info').textContent = 'Loading weather forecast...';
    const weather = await fetchWeather(location, date);
    ids('weather-info').textContent = `${weather.locationLabel}: ${weather.summary}`;
    ids('home-weather').textContent = weather.summary;

    const warning = ids('date-warning');
    if (weather.daysOut > 10) {
      warning.classList.remove('hidden');
      warning.textContent = 'Heads up: this date is more than 10 days away, so forecast accuracy may be lower.';
    } else {
      warning.classList.add('hidden');
      warning.textContent = '';
    }

    state.suggestions = suggestOutfits({
      weather: weather.summary,
      vibePreset,
      vibeCustom,
      age,
      ownedLabel,
      targetLabel,
      targetNotOwned
    });
    renderSuggestions();
  } catch (err) {
    ids('weather-info').textContent = `Weather unavailable: ${err.message}`;
  }
});

ids('closet-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = ids('closet-name').value.trim();
  if (!name) return;
  const closet = { id: uid(), name, favorite: false, disliked: false, items: [] };
  state.closets.push(closet);
  state.selectedClosetId = closet.id;
  ids('closet-name').value = '';
  persist();
  renderClosets();
  renderSelectedClosetItems();
});

ids('item-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const closet = selectedCloset();
  if (!closet) return alert('Select or create a closet first.');
  closet.items.push({
    id: uid(),
    name: ids('item-name').value.trim(),
    category: ids('item-category').value,
    notes: ids('item-notes').value.trim(),
    favorite: false,
    disliked: false
  });
  ids('item-form').reset();
  persist();
  renderSelectedClosetItems();
  renderClosets();
});

ids('ten-day-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = ids('ten-day-name').value.trim();
  if (!name) return;
  state.tenDayPlans.push({
    id: uid(),
    name,
    days: Array.from({ length: 10 }, () => ({ outfits: [] }))
  });
  ids('ten-day-name').value = '';
  persist();
  renderPlans();
});

ids('travel-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = ids('travel-name').value.trim();
  const daysCount = Number(ids('travel-days').value);
  const baseLocation = ids('travel-location').value.trim();
  if (!name || !daysCount) return;
  state.travelPlans.push({
    id: uid(),
    name,
    baseLocation,
    days: Array.from({ length: daysCount }, () => ({ location: '', outfits: [] }))
  });
  ids('travel-form').reset();
  persist();
  renderPlans();
});

renderHome();
renderClosets();
renderSelectedClosetItems();
renderPlans();
