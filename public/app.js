/*
 * EVENTLY — VANILLA JAVASCRIPT SPA
 *
 * This file deliberately uses only browser APIs. Data is kept in localStorage,
 * so the app works without a backend and survives page refreshes.
 */
const EVENTS_KEY = 'evently_events';
const REGISTRATIONS_KEY = 'evently_registrations';
let events = [];
let registrations = [];
let currentView = 'dashboard';
let selectedEventId = null;

// Read JSON from localStorage. Returning a fallback prevents a broken/empty
// value from crashing the app when a student is experimenting in DevTools.
function readStore(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (error) { console.warn('Could not read localStorage:', error); return fallback; }
}

// Write the current in-memory array back to localStorage. Every create, edit,
// delete, and registration action calls this function before re-rendering.
function saveStore() {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
}

// Seed once so a first-time visitor immediately has useful content to explore.
function seedData() {
  if (localStorage.getItem(EVENTS_KEY)) return;
  const today = new Date();
  const plusDays = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
  events = [
    { id:'evt-1', name:'Design Forward 2025', description:'A focused day of talks and workshops for people shaping the future of digital products.', date:plusDays(8), time:'09:30', venue:'The Foundry, London', category:'Conference', capacity:120, status:'Upcoming' },
    { id:'evt-2', name:'Green City Meetup', description:'Local makers and urban thinkers share practical ideas for more sustainable neighborhoods.', date:plusDays(15), time:'18:00', venue:'Civic Hall, Bristol', category:'Community', capacity:60, status:'Upcoming' },
    { id:'evt-3', name:'Product Lab: Spring', description:'An intimate product strategy lab with hands-on exercises, peer feedback, and open discussion.', date:plusDays(-3), time:'10:00', venue:'Studio 04, Manchester', category:'Workshop', capacity:35, status:'Completed' }
  ];
  registrations = [
    { id:'reg-1', event_id:'evt-1', name:'Maya Patel', email:'maya@example.com', phone:'+44 7700 900123', registration_date:plusDays(-4), status:'Confirmed' },
    { id:'reg-2', event_id:'evt-1', name:'Jon Bell', email:'jon@example.com', phone:'+44 7700 900124', registration_date:plusDays(-2), status:'Confirmed' },
    { id:'reg-3', event_id:'evt-2', name:'Aisha Khan', email:'aisha@example.com', phone:'+44 7700 900125', registration_date:plusDays(-1), status:'Confirmed' }
  ];
  saveStore();
}

function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char])); }
function formatDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
function initials(name) { return name.split(' ').map((part) => part[0]).slice(0,2).join('').toUpperCase(); }
function countFor(eventId) { return registrations.filter((registration) => registration.event_id === eventId && registration.status === 'Confirmed').length; }
function getEvent(id) { return events.find((event) => event.id === id); }

// One rendering function swaps the HTML inside #app. This is the SPA pattern:
// navigation never reloads the document; it simply changes the active view.
function render() {
  const app = document.querySelector('#app');
  const labels = { dashboard:'Dashboard', events:'Browse events', 'event-detail':'Event details', 'event-form': selectedEventId ? 'Edit event' : 'Add event', participants:'Participants' };
  document.querySelector('#page-label').textContent = labels[currentView] || 'Dashboard';
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === currentView));
  if (currentView === 'dashboard') app.innerHTML = dashboardTemplate();
  if (currentView === 'events') app.innerHTML = eventsTemplate();
  if (currentView === 'event-detail') app.innerHTML = detailTemplate();
  if (currentView === 'event-form') app.innerHTML = eventFormTemplate();
  if (currentView === 'participants') app.innerHTML = participantsTemplate();
}

function heading(eyebrow, title, description, action = '') { return `<div class="view-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>${action}</div>`; }
function eventCard(event) { const count = countFor(event.id); return `<article class="event-card"><div class="event-banner ${event.category === 'Community' ? 'teal' : event.category === 'Workshop' ? 'orange' : ''}"><span class="category">${escapeHTML(event.category)}</span><span class="status ${event.status.toLowerCase()}">${event.status}</span><h3>${escapeHTML(event.name)}</h3></div><div class="event-body"><p class="event-meta"><span>▣ ${formatDate(event.date)}</span><span>◷ ${event.time}</span></p><p class="event-description">${escapeHTML(event.description)}</p><div class="event-footer"><span class="capacity">${count} / ${event.capacity} registered</span><button class="card-action" data-action="details" data-id="${event.id}">View details →</button></div></div></article>`; }
function dashboardTemplate() { const upcoming = events.filter((event) => event.status !== 'Completed').slice(0,3); return `${heading('Good morning, admin','Make every gathering count.','Plan, manage, and keep an eye on your events from one calm workspace.','<button class="btn btn-primary" data-action="new-event">＋ Create event</button>')}<div class="stats-grid"><div class="stat-card"><div class="stat-top">Total events <span class="stat-icon">◫</span></div><div class="stat-value">${events.length}</div><span class="stat-note">Across all statuses</span></div><div class="stat-card"><div class="stat-top">Registrations <span class="stat-icon">◎</span></div><div class="stat-value">${registrations.length}</div><span class="stat-note">All-time sign ups</span></div><div class="stat-card"><div class="stat-top">Upcoming events <span class="stat-icon">↗</span></div><div class="stat-value">${events.filter(e=>e.status==='Upcoming').length}</div><span class="stat-note">Ready to welcome guests</span></div></div><div class="section-head"><h2>Coming up next</h2><button class="text-link" data-action="browse">View all events →</button></div><div class="upcoming-grid">${upcoming.length ? upcoming.map(eventCard).join('') : '<div class="empty">No upcoming events yet.</div>'}</div>`; }
function eventsTemplate() { return `${heading('Event directory','Find your next moment.','Browse your complete event calendar and open an event to manage registrations.','<button class="btn btn-primary" data-action="new-event">＋ Add event</button>')}<div class="toolbar"><label class="search"><input id="search-events" type="search" placeholder="Search by event name..." aria-label="Search by event name"></label><select id="filter-category" aria-label="Filter by category"><option value="">All categories</option>${[...new Set(events.map(e=>e.category))].map(c=>`<option>${escapeHTML(c)}</option>`).join('')}</select><select id="filter-status" aria-label="Filter by status"><option value="">All statuses</option><option>Upcoming</option><option>Ongoing</option><option>Completed</option></select></div><div id="events-results" class="events-grid">${events.map(eventCard).join('')}</div>`; }
function detailTemplate() { const event = getEvent(selectedEventId); if (!event) return '<div class="empty">Event not found.</div>'; const full = countFor(event.id) >= Number(event.capacity); return `${heading('Event details',escapeHTML(event.name),'Everything you need to know before joining this event.','<div class="heading-actions"><button class="btn btn-ghost" data-action="back-events">← Back</button><button class="btn btn-ghost" data-action="edit-event" data-id="${event.id}">Edit</button><button class="btn btn-danger" data-action="delete-event" data-id="${event.id}">Delete</button></div>')}<div class="detail-layout"><section class="detail-panel"><div class="detail-hero"><span class="category">${escapeHTML(event.category)} · ${event.status}</span><h1>${escapeHTML(event.name)}</h1></div><h2>About this event</h2><p class="detail-copy">${escapeHTML(event.description)}</p><div class="detail-facts"><div class="fact"><span>Date</span><strong>${formatDate(event.date)}</strong></div><div class="fact"><span>Time</span><strong>${event.time}</strong></div><div class="fact"><span>Venue</span><strong>${escapeHTML(event.venue)}</strong></div><div class="fact"><span>Availability</span><strong>${countFor(event.id)} of ${event.capacity} seats</strong></div></div></section><section class="form-panel"><h2>Register your place</h2><form id="registration-form"><div class="field"><label for="reg-name">Full name</label><input id="reg-name" name="name" required placeholder="e.g. Alex Morgan"></div><div class="field"><label for="reg-email">Email address</label><input id="reg-email" name="email" type="email" required placeholder="alex@example.com"></div><div class="field"><label for="reg-phone">Phone number</label><input id="reg-phone" name="phone" required pattern="[0-9+() -]{7,}" placeholder="+44 7700 900000"></div><p class="form-note">${full ? 'This event is currently full. You can still join the waitlist.' : 'You will receive a confirmation after submitting this form.'}</p><div class="form-actions"><button class="btn btn-primary" type="submit">${full ? 'Join waitlist' : 'Confirm registration'} →</button></div></form></section></div>`; }
function eventFormTemplate() { const event = selectedEventId ? getEvent(selectedEventId) : {}; return `${heading(selectedEventId ? 'Admin workspace':'Admin workspace',selectedEventId ? 'Edit event':'Create a new event','Keep your event details clear and useful for every attendee.','<button class="btn btn-ghost" data-action="back-events">Cancel</button>')}<section class="form-panel"><form id="event-form"><div class="form-grid"><div class="field full"><label for="event-name">Event name</label><input id="event-name" name="name" required value="${escapeHTML(event.name || '')}" placeholder="e.g. Design Forward 2025"></div><div class="field full"><label for="event-description">Description</label><textarea id="event-description" name="description" required placeholder="What should attendees know?">${escapeHTML(event.description || '')}</textarea></div><div class="field"><label for="event-date">Date</label><input id="event-date" name="date" type="date" required value="${event.date || ''}"></div><div class="field"><label for="event-time">Start time</label><input id="event-time" name="time" type="time" required value="${event.time || ''}"></div><div class="field"><label for="event-venue">Venue</label><input id="event-venue" name="venue" required value="${escapeHTML(event.venue || '')}" placeholder="Venue or online link"></div><div class="field"><label for="event-category">Category</label><select id="event-category" name="category"><option ${event.category==='Conference'?'selected':''}>Conference</option><option ${event.category==='Workshop'?'selected':''}>Workshop</option><option ${event.category==='Community'?'selected':''}>Community</option><option ${event.category==='Networking'?'selected':''}>Networking</option></select></div><div class="field"><label for="event-capacity">Capacity</label><input id="event-capacity" name="capacity" type="number" min="1" required value="${event.capacity || ''}" placeholder="100"></div><div class="field"><label for="event-status">Status</label><select id="event-status" name="status"><option ${event.status==='Upcoming'?'selected':''}>Upcoming</option><option ${event.status==='Ongoing'?'selected':''}>Ongoing</option><option ${event.status==='Completed'?'selected':''}>Completed</option></select></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">${selectedEventId ? 'Save changes' : 'Create event'} →</button></div></form></section>`; }
function participantsTemplate() { return `${heading('Admin workspace','Participant list','Review every registration and quickly filter by event.')}<section class="table-panel"><div class="table-filter"><h2>${registrations.length} registrations</h2><select id="filter-event"><option value="">All events</option>${events.map(e=>`<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('')}</select></div><div class="table-wrap"><table><thead><tr><th>Participant</th><th>Event</th><th>Registered</th><th>Status</th><th>Contact</th></tr></thead><tbody id="participants-results">${participantRows()}</tbody></table></div></section>`; }
function participantRows(eventId = '') { const list = registrations.filter(r => !eventId || r.event_id === eventId); return list.length ? list.map(r => { const event = getEvent(r.event_id); return `<tr><td><div class="person"><span class="mini-avatar">${initials(r.name)}</span>${escapeHTML(r.name)}</div></td><td>${escapeHTML(event?.name || 'Deleted event')}</td><td>${formatDate(r.registration_date)}</td><td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td><td>${escapeHTML(r.email)}<br>${escapeHTML(r.phone)}</td></tr>`; }).join('') : '<tr><td colspan="5"><div class="empty">No registrations match this filter.</div></td></tr>'; }

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
function go(view, id = null) { currentView = view; selectedEventId = id; render(); window.scrollTo({top:0, behavior:'smooth'}); }
function refreshEventResults() { const query = document.querySelector('#search-events')?.value.toLowerCase() || ''; const category = document.querySelector('#filter-category')?.value || ''; const status = document.querySelector('#filter-status')?.value || ''; const filtered = events.filter(e => e.name.toLowerCase().includes(query) && (!category || e.category === category) && (!status || e.status === status)); document.querySelector('#events-results').innerHTML = filtered.length ? filtered.map(eventCard).join('') : '<div class="empty">No events match your search.</div>'; }

// Event delegation keeps listeners simple: the app listens once on the root
// and identifies clicked buttons through data-action/data-id attributes.
document.addEventListener('click', (event) => {
  const nav = event.target.closest('.nav-link');
  if (nav) {
    go(nav.dataset.view);
    document.querySelector('#sidebar')?.classList.remove('open');
    return;
  }

  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'details') go('event-detail', target.dataset.id);
  if (action === 'new-event') go('event-form');
  if (action === 'browse' || action === 'back-events') go('events');
  if (action === 'edit-event') go('event-form', target.dataset.id);
  if (action === 'delete-event') {
    const eventToDelete = getEvent(target.dataset.id);
    if (!eventToDelete) return;
    if (!window.confirm(`Delete “${eventToDelete.name}”? This cannot be undone.`)) return;
    events = events.filter((item) => item.id !== target.dataset.id);
    registrations = registrations.filter((registration) => registration.event_id !== target.dataset.id);
    saveStore();
    showToast('Event deleted.');
    go('events');
  }
});

document.querySelector('.icon-button')?.addEventListener('click', () => showToast('You are all caught up.'));
document.addEventListener('input', (event) => { if (event.target.id === 'search-events') refreshEventResults(); });
document.addEventListener('change', (event) => { if (['filter-category','filter-status'].includes(event.target.id)) refreshEventResults(); if (event.target.id === 'filter-event') document.querySelector('#participants-results').innerHTML = participantRows(event.target.value); });
document.addEventListener('submit', (event) => { event.preventDefault(); const form = event.target; const data = Object.fromEntries(new FormData(form));
  if (form.id === 'registration-form') { const full = countFor(selectedEventId) >= Number(getEvent(selectedEventId).capacity); registrations.push({ id:`reg-${Date.now()}`, event_id:selectedEventId, ...data, registration_date:new Date().toISOString().slice(0,10), status:full ? 'Waitlisted' : 'Confirmed' }); saveStore(); showToast(full ? 'Added to the waitlist.' : 'Registration confirmed.'); go('event-detail', selectedEventId); }
  if (form.id === 'event-form') { const eventData = {...data, capacity:Number(data.capacity)}; if (selectedEventId) events = events.map(e => e.id === selectedEventId ? {...e, ...eventData} : e); else events.push({id:`evt-${Date.now()}`, ...eventData}); saveStore(); showToast(selectedEventId ? 'Event updated.' : 'Event created.'); go('events'); }
});

document.querySelector('#menu-button').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
seedData(); events = readStore(EVENTS_KEY); registrations = readStore(REGISTRATIONS_KEY); render();
