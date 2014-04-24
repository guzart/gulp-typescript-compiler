'use strict';

var gulp = require('gulp');
var tsc  = require('..');


function compile() {
  gulp
    .src('app/main.ts', { read: false })
    .pipe(tsc({
        resolve: true
    }))
    .pipe(gulp.dest('dist'))
    .on('close', run);
}

function start() {
  var clean = require('gulp-clean');
  var cleanPromise = gulp
    .src('dist', {read: false})
    .pipe(clean())
    .on('close', compile);
}

function run() {
  var exec = require('child_process').exec;
  exec('node dist/main.js', function (error, stdout, stderr) {
    console.log(stdout);
  });
}

start();
