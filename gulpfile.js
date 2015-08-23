var exec = require('child_process').exec;
var zip = require('gulp-zip');
var del = require('del');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sequence = require('run-sequence');
var packager = require('electron-packager');
var vulcanize = require('gulp-vulcanize');
var winInstaller = require('electron-windows-installer');

var VERSION = require('./src/package.json').version;
var TEMP_BUILD_DIR = 'vulcanized';
var BUILD_DIR = 'build';
var DIST_DIR = 'dist';
var ICO = __dirname + '/assets/auto-typer-logo.ico';

gulp.task('make-installer', function() {
	return winInstaller({
		appDirectory: BUILD_DIR + '/xiv-auto-typer-win32-ia32',
		outputDirectory: DIST_DIR,
		iconUrl: ICO,
		exe: 'Xiv-Auto-Typer.exe',
		setupExe: 'Xiv-Auto-Typer-Setup-'+VERSION+'.exe',
		authors: 'Mccxiv Software',
		title: 'Xiv Auto Typer',
		setupIcon: ICO
	});
});

gulp.task('run-development', function(cb) {
	exec('"src/node_modules/.bin/electron" ./src', cb);
});

gulp.task('run-vulcanized', function(cb) {
	exec('"src/node_modules/.bin/electron" '+TEMP_BUILD_DIR, cb);
});

gulp.task('vulcanize', function() {
	return gulp.src('src/index.html')
		.pipe(vulcanize({
			excludes: [],
			inlineScripts: true,
			inlineCss: true,
			stripExcludes: false
		}))
		.pipe(gulp.dest(TEMP_BUILD_DIR));
});

gulp.task('copy-files', function() {
	return gulp.src(['src/main.js', 'src/package.json'])
		.pipe(gulp.dest(TEMP_BUILD_DIR));
});

gulp.task('copy-modules', function() {
	return gulp.src(['src/node_modules/robotjs/**'])
		.pipe(gulp.dest(TEMP_BUILD_DIR+'/node_modules/robotjs/'));
});

gulp.task('copy-assets', function() {
	return gulp.src(['src/assets/**'])
		.pipe(gulp.dest(TEMP_BUILD_DIR+'/assets'));
});

gulp.task('clean-up-before', function(cb) {
	del([TEMP_BUILD_DIR, BUILD_DIR, DIST_DIR], cb);
});

gulp.task('clean-up-after', function(cb) {
	del([TEMP_BUILD_DIR, BUILD_DIR, 'dist/RELEASES', 'dist/**/*.nupkg'], cb);
});

gulp.task('package', function(cb) {
	var opts = {
		dir: 'vulcanized',
		name: 'Xiv-Auto-Typer',
		platform: 'all',
		arch: 'ia32',
		version: '0.30.2',
		'app-version': VERSION,
		icon: ICO,
		'version-string': {
			CompanyName: 'Mccxiv Software',
			LegalCopyright: 'Copyright 2015 Andrea Stella. All rights reserved',
			ProductVersion: VERSION,
			FileVersion: VERSION,
			FileDescription: 'Xiv Auto Typer',
			ProductName: 'Xiv Auto Typer'
		},
		out: BUILD_DIR
	};
	packager(opts, cb);
});

gulp.task('copy-build-to-dist', function() {
	return gulp.src('build/Xiv-Auto-Typer-win32-ia32/**')
		.pipe(gulp.dest('dist/Xiv-Auto-Typer-win32/'));
});

gulp.task('make-zip-windows', function() {
	return gulp.src('build/Xiv-Auto-Typer-win32-ia32/**/*')
		.pipe(rename(function(path) {
			path.dirname = path.dirname === '.'? 'Xiv-Auto-Typer' : 'Xiv-Auto-Typer/'+path.dirname;
		}))
		.pipe(zip('Xiv-Auto-Typer-win32-'+VERSION+'.zip'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('build', function(cb) {
	sequence('clean-up-before',
		['vulcanize', 'copy-files', 'copy-modules', 'copy-assets'],
		'package',
		['make-installer', 'make-zip-windows', 'copy-build-to-dist'],
		'clean-up-after', cb);
});

gulp.task('default', ['build']);