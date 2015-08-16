var app = require('app');
var ipc = require('ipc');
var robot = require('robotjs');
var Window = require('browser-window');
var globalShortcut = require('global-shortcut');
var mainWindow;
var controlScheme = 1;
var shortcuts = [
	['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'],
	['CmdOrCtrl+F1', 'CmdOrCtrl+F2', 'CmdOrCtrl+F3', 'CmdOrCtrl+F4', 'CmdOrCtrl+F5', 'CmdOrCtrl+F6', 'CmdOrCtrl+F7', 'CmdOrCtrl+F8']
];

app.on('ready', load);
app.on('ready', registerShortcuts);
app.on('window-all-closed', close);


function registerShortcuts() {
	shortcuts[controlScheme].forEach(function(shortcut, index) {
		globalShortcut.register(shortcut, function() {
			getString(index, function(string) {
				type(string);
			});
		})
	});
}

/**
 * Asks client window for the user's string at a certain index
 * @param index
 */
function getString(index, cb) {
	ipc.once('string', function(event, arg) {
		console.log(arg);
		cb(arg);
	});
	mainWindow.send('string?', index);
}

function load() {
	var windowOpts = {
		'use-content-size': true,
		resizable: true,
		width: 550,
		height: 600,
		title: 'Xiv Auto Typer',
		'auto-hide-menu-bar': true
	};

	mainWindow = new Window(windowOpts);
	mainWindow.loadUrl('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();

	mainWindow.on('closed', function() {
		mainWindow = null;
	});
}

function close() {
	app.quit();
}

function type(string) {
	robot.typeString(string);
}