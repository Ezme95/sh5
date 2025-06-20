# Project sh5 
This project implements device authorization flow on a IoT device using Microsoft as the OAuth 2.0 provider. Following successful authorization, the user is to view their calendar events (Microsoft Outlook) on the IoT device through the integration of the Microsoft Graph API. 

**Author: Team SH5**

**Date: 31.05.2025**

_Refer to the Supplmentary Document 02: Technical Manual for guidance._

## Repo Contents

**sh5/**	  => Contains the source code and related project files. The program is launched from here via terminal.

**Auto Boot**	  => Folder containing the script to configure auto-boot, as well its source file

**README.txt**	  => A text file describing the project, structure, and setup.

**index.html**	  => The main HTML file used by Electron to render the application's user interface.

**main.js**	  => The Electron main process file. Manages the app window, system interactions, and handles authentication logic via MSAL.

**render.js**	  => The renderer process JavaScript file. Handles UI rendering, DOM manipulation, QR generation, and periodic calendar fetching (every 5 seconds).

**package.json**  => Defines the app's metadata, startup script, and dependencies. Do not update manually.

**package-lock.json** => Locks down exact versions of dependencies to ensure consistent installs. Do not update manually.

## Installation

### 1. Clone the repository
 **-> https://github.com/Ezme95/sh5**

git clone https://github.com/Ezme95/sh5
cd sh5

### 2. Install dependencies
_======(Linux / Raspberry OS)======_

**Node.js and npm**

sudo apt install nodejs npm
node -v
npm -v


**Microsoft Authentication Library for Node.js**
	
 npm install @azure/msal-node

**Electron for ARM64 Linux**
	
 npm install electron --platform=linux --arch=arm64

**Electron as dev dependency **
	
 npm install --save-dev electron@latest --force
	
 npm install --force

**Node Fetch v2 (for compatibility)**

npm install node-fetch@2

**Node.js file system module (typically built-in)**
	
 npm install fs

**Install Microsoft Graph client**
	
 npm install @microsoft/microsoft-graph-client

**Microsoft Authentication Library (MSAL) for token storage**
	
 npm install @azure/msal-node-extensions

**Universal fetch API for Node and browser**
	
 npm install isomorphic-fetch

**QR for Node Package Manager (npm)**
	
 npm install qrcode

_======(Windows)======_

**fnm**
	
 winget install Schniz.fnm

**fnm install 22**

	winget install Schniz.fnm
 
	fnm install 22

**Check Node and npm version**
	
 node -v
 
	npm -v

**Electron 22**

	npm install electron@22 --save-dev

**Microsoft Graph API**

	npm install @microsoft/microsoft-graph-client

**Isomorphic-fetch**

	npm install isomorphic-fetch

**Microsoft Authentication Library (MSAL)**

	npm install @azure/msal-node

**Microsoft Authentication Library (MSAL) for token storage**

	npm install @azure/msal-node-extensions

**QR code for Node Package Manager (npm)**

	npm install qrcode

### 3. Run

 Go to project directory and run
 
	npm start

Example: 

pi@pi-desktop:~/sh5$ npm start
