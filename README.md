gulp-typescript-compiler
===============

Typescript plugin for gulp

    var gulp = require('gulp');
    var tsc  = require('gulp-typescript-compiler');
    gulp.task('default', function () {
      return gulp
        .src('app/{,/*}*.ts')
        .pipe(tsc({
            sourcemap: true
        }))
        .pipe(gulp.dest('dist'));
    });
