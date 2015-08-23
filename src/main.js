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
	regular: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']
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
ipc.on('open-dev-tools', devTools);

//=========================================================
// Main functions
//=========================================================

function devTools() {
	mainWindow.openDevTools();
}

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
	//mainWindow.openDevTools();

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

//=========================================================
// Helper functions
//=========================================================

function requestSettingsFromWindow() {
	mainWindow.send('settings?');
	mainWindow.once('settings', function(setts) {
		settings = setts;
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