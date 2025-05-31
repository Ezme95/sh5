const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PublicClientApplication } = require('@azure/msal-node');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

const config = {
  auth: {
    clientId: 'e9068adb-383f-4ffa-966a-1cf99443e6fc',
    authority: 'https://login.microsoftonline.com/common',
  },
};

const pca = new PublicClientApplication(config);
let mainWindow;
let accessToken = null; //initializing param for accessToken

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true, // make full screen
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// 🔁 Auth loop
ipcMain.handle('start-device-auth', async () => {
  while (true) {
    const request = {
      deviceCodeCallback: (res) => {
        mainWindow.webContents.send('device-code', {
          message: res.message,
          url: res.verificationUri,
          code: res.userCode,
        });
      },
      scopes: [
        'https://graph.microsoft.com/Calendars.Read',  // ✅ calendar read access
        'https://graph.microsoft.com/User.Read',       // optional: user profile
        'offline_access'                               // optional: refresh token
      ]
    };

    try {
      const response = await pca.acquireTokenByDeviceCode(request); //POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/devicecode
      accessToken = response.accessToken; //store access token globally
      console.log("✅ Authorization successful");
      console.log("🔑 Token response:", response);
      mainWindow.webContents.send('auth-success', {
        accessToken: response.accessToken, 
        idToken: response.idToken,
        scopes: response.scopes,
        expiresOn: response.expiresOn
      });
      return response;
    } catch (err) {
      console.error("❌ Authorization failed:", err.message);
      mainWindow.webContents.send('auth-status', { success: false });
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait before retry
    }
  }
});

// Microsoft graph fetch
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

function getGraphClient(token) {
  return Client.init({
    authProvider: (done) => done(null, token)
  });
}

//Get Calendar
// ipcMain.handle('fetch-calendar', async () => {
//   if (!accessToken) {
//     return { success: false, error: "No access token available." };
//   }

//   try {
//     const client = getGraphClient(accessToken);
//     const events = await client.api('/me/events').top(10).get();
//     return { success: true, events: events.value };
//   } catch (err) {
//     console.error("❌ Calendar fetch failed:", err);
//     return { success: false, error: err.message || "Unknown error"};
//   }
// });
ipcMain.handle('fetch-calendar', async () => {
  if (!accessToken) {
    return { success: false, error: "No access token available." };
  }

  try {
    const client = getGraphClient(accessToken);

    let events = [];
    let response = await client
      .api('/me/events')
      .top(100)
      .select('subject,body,bodyPreview,organizer,attendees,start,end,location')
      .orderby('start/dateTime')
      .get();

    events = events.concat(response.value);

    while (response['@odata.nextLink']) {
      response = await client.api(response['@odata.nextLink']).get();
      events = events.concat(response.value);
    }

    return { success: true, events };
  } catch (err) {
    console.error("❌ Calendar fetch failed:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
});

