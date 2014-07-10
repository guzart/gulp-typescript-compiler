'use strict';

var gulp   = require('gulp');
var tsc    = require('..');
var rimraf = require('gulp-rimraf');


function compile() {
  gulp.src('app/main.ts', { read: false })
    .pipe(tsc({
      target:    'es5',
      module:    'commonjs',
      sourcemap: true,
      resolve:   true
    }))
    .pipe(gulp.dest('dist'))
    .on('finish', run);
}

function start() {
  gulp.src('dist', { read: false })
    .pipe(rimraf())
    .on('finish', compile);
}

function run() {
  var exec = require('child_process').exec;
  exec('node dist/main.js', function (error, stdout, stderr) {
    console.log(stdout);
  });
}

start();
