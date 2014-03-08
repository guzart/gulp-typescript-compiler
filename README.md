gulp-typescript-compiler
===============

Typescript plugin for gulp

    var gulp = require('gulp');
    var tsc  = require('gulp-typescript-compiler');
    gulp.task('default', function () {
      return gulp
        .src('app/{,/*}*.ts')
        .pipe(tsc({
            module: 'commonjs',
            target: 'ES5',
            sourcemap: true
        }))
        .pipe(gulp.dest('dist'));
    });
