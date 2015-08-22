//=========================================================
// Variables
//=========================================================

var app = require('app');
var ipc = require('ipc');
var robot = require('robotjs');
var Window = require('browser-window');
var EventEmitter = require('events').EventEmitter;
var globalShortcut = require('global-shortcut');
var mainWindow;

var shortcuts = {
	regular: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'],
	control: ['Shift+Z', 'CmdOrCtrl+F2', 'CmdOrCtrl+F3', 'CmdOrCtrl+F4', 'CmdOrCtrl+F5', 'CmdOrCtrl+F6', 'CmdOrCtrl+F7', 'CmdOrCtrl+F8'],
	alt: ['Alt+F1', 'Alt+F2', 'Alt+F3', 'Alt+F4', 'Alt+F5', 'Alt+F6', 'Alt+F7', 'Alt+F8']
};

var settings = {
	inputs: [],
	after: 'none',
	scheme: 'regular'
};

//=========================================================
// Setup
//=========================================================

app.on('ready', makeWindow);
app.on('window-all-closed', close);

ipc.on('input-changed', inputChanged);
ipc.on('after-changed', afterChanged);
ipc.on('scheme-changed', schemeChanged);

//=========================================================
// Main functions
//=========================================================

function makeWindow() {
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

	requestSettingsFromWindow();
}

function close() {
	app.quit();
}

/**
 * Handler for the ipc input-change event
 * @param event
 * @param {{index: number, value: string}} arg
 */
function inputChanged(event, arg) {
	var value = arg.value;
	var shortcut = shortcuts[settings.scheme][arg.index];

	settings.inputs[arg.index] = value;
	unregister(shortcut);

	if (value) register(shortcut, typeFunction(value));
}

function afterChanged(event, after) {
	settings.after = after;
}

function schemeChanged(event, scheme) {
	console.log('scheme changed');
	var oldScheme = settings.scheme;
	settings.scheme = scheme;
	unregisterAll(oldScheme);
	registerAll();
}

//=========================================================
// Helper functions
//=========================================================

function requestSettingsFromWindow() {
	mainWindow.send('settings?');
	mainWindow.once('settings', function(setts) {
		settings = setts;
	});
}

function unregisterAll(scheme) {
	shortcuts[scheme].map(unregister);
}

function registerAll() {
	console.log('registering all');
	shortcuts[settings.scheme].forEach(function(accelerator, index) {
		if (settings.inputs[index]) {

			register(accelerator, typeFunction(settings.inputs[index]));
		}
	});
}

function unregister(accelerator) {
	if (globalShortcut.isRegistered(accelerator)) {
		console.log('unregistering '+accelerator);
		globalShortcut.unregister(accelerator);
	}
}

function register(accelerator, fn) {
	console.log('registering ' + accelerator);
	globalShortcut.register(accelerator, fn);
}

function typeFunction(string) {
	return function() {
		robot.typeString(string);
		if (settings.after === 'enter') robot.keyTap('enter');
		if (settings.after === 'tab') robot.keyTap('tab');
	};
}