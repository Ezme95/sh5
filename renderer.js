const { ipcRenderer } = require('electron');
const QRCode = require('qrcode');


let calendar; // Global calendar instance
let cachedEvents = []; //events from graph api fetch
let qrAppended = false;


window.onload = async () => {
  await ipcRenderer.invoke('start-device-auth');
};

// Showing the device code
ipcRenderer.on('device-code', (_, data) => {
  document.getElementById('message').innerHTML = `
    <p>${data.message}</p>
    <p><a href="${data.url}" target="_blank">${data.url}</a></p>
    <div class="code">${data.code}</div>
  `;
  document.getElementById('status').innerHTML = '';
});

if (!window.qrAlreadyRendered) {
  window.qrAlreadyRendered = true; // global marker

  window.addEventListener('DOMContentLoaded', () => {
    console.log("🟢 Rendering QR code...");
    const qrBox = document.getElementById('qr');
    qrBox.innerHTML = ''; // just in case

    const staticUrl = 'https://login.microsoftonline.com/common/oauth2/deviceauth';
    QRCode.toDataURL(staticUrl, { width: 200 }, (err, url) => {
      if (err) {
        console.error("❌ QR generation failed:", err);
        return;
      }

      const qrImg = document.createElement('img');
      qrImg.src = url;
      qrImg.alt = 'Scan to authenticate';
      qrImg.style.display = 'block';
      qrImg.style.margin = '10px auto';
      qrBox.appendChild(qrImg);
    });
  });
}


// Showing auth status
ipcRenderer.on('auth-status', (_, data) => {
  if (data.success) {
    document.getElementById('status').innerHTML = '<p style="color:green;">Authorization successful</p>';
  } else {
    document.getElementById('status').innerHTML = '<p style="color:red;">Authorization failed. Retrying...</p>';
  }
});
// Fetch Calendar from Microsoft Graph API

ipcRenderer.on('auth-success', async () => {
  const result = await ipcRenderer.invoke('fetch-calendar');
  if (result.success) {
    cachedEvents = result.events;

    // ✅ Now show dropdown and enable it
    const controls = document.getElementById('monthControls');
    const selector = document.getElementById('monthSelect');

    if (controls) controls.style.display = 'block';
    if (selector) selector.disabled = false;

    // ✅ Initial calendar render
    onMonthChange();
    // call fetch every five seconds
    autoFetch();
  } else {
    document.getElementById('status').innerHTML = `<p style="color:red;">Failed to load calendar: ${result.error}</p>`;
  }
});


// function displayCalendar(events) {
//   const calendarEl = document.getElementById('calendar');
//   calendarEl.innerHTML = '<h2> Your Events</h2>';

//   if (!events.length) {
//     calendarEl.innerHTML += '<p>No upcoming events found.</p>';
//     return;
//   }

//   let html = '<table border="1" cellpadding="8" cellspacing="0" style="width:100%; text-align:left;">';
//   html += '<tr><th>Date</th><th>Time</th><th>Subject</th><th>Organizer</th></tr>';

//   events.forEach(e => {
//     const dateTime = e.start?.dateTime || 'N/A';
//     const date = dateTime.split('T')[0];
//     const time = dateTime.split('T')[1]?.slice(0, 5) || 'N/A';
//     const subject = e.subject || 'Unknown';
//     const organizer = e.organizer?.emailAddress?.name ?? 'Unknown';

//     html += `<tr>
//       <td>${date}</td>
//       <td>${time}</td>
//       <td>${subject}</td>
//       <td>${organizer}</td>
//     </tr>`;
//   });

//   html += '</table>';
//   calendarEl.innerHTML += html;
// }

function onMonthChange() {
  const selector = document.getElementById('monthSelect');
  if (!cachedEvents || !selector) return;

  const selected = selector.value; // e.g., "2025-05"
  const [year, month] = selected.split('-').map(Number);

  const filtered = cachedEvents.filter(e => {
    const date = e.start?.dateTime?.split('T')[0];
    return date?.startsWith(`${year}-${String(month).padStart(2, '0')}`);
  });

  displayCalendar(filtered, year, month - 1); // month is 0-based
}

function displayCalendar(events, year, month) {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = `<h2>📅 ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>`;

  const eventsByDate = {};
  events.forEach(e => {
    const date = e.start?.dateTime?.split('T')[0];
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(e);
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - startDay.getDay());
  const endDay = new Date(lastDay);
  endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

  let html = '<table border="1" style="width: 100%; table-layout: fixed;">';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  html += '<tr>' + dayNames.map(d => `<th>${d}</th>`).join('') + '</tr><tr>';

  const day = new Date(startDay);
  while (day <= endDay) {
    const dateStr = day.toISOString().split('T')[0];
    const dayNum = day.getDate();
    const isCurrentMonth = day.getMonth() === month;

    html += `<td style="vertical-align: top; height: 120px; padding: 6px; background-color: ${isCurrentMonth ? '#fff' : '#f0f0f0'};">
      <strong>${dayNum}</strong><br/>`;

    const dayEvents = eventsByDate[dateStr] || [];
    if (dayEvents.length) {
      dayEvents.forEach(e => {
        const time = e.start?.dateTime?.split('T')[1]?.slice(0, 5) || '🕒';
        const subject = e.subject || 'No Title';
        const organizer = e.organizer?.emailAddress?.name ?? 'Unknown';

        html += `<div style="margin: 4px 0; font-size: 12px;">
          • ${time} <strong>${subject}</strong><br/>
          <span style="color:#555;">👤 ${organizer}</span>
        </div>`;
      });
    } else {
      html += `<span style="color:#aaa;">No events</span>`;
    }

    html += '</td>';

    if (day.getDay() === 6) {
      html += '</tr><tr>';
    }

    day.setDate(day.getDate() + 1);
  }

  html += '</tr></table>';
  calendarEl.innerHTML += html;
}

// fetch new aevery 5 seconds

function autoFetch() {
  setInterval(async () => {
    console.log("🔄 Refreshing calendar from Microsoft Graph...");
    const result = await ipcRenderer.invoke('fetch-calendar');
    if (result.success) {
      cachedEvents = result.events;
      onMonthChange(); // re-render the currently selected month
    } else {
      console.warn("⚠️ Calendar auto-refresh failed:", result.error);
    }
  }, 5000); // 5 seconds
}
