gulp-typescript-compiler
===============

Typescript plugin for gulp

    var gulp = require('gulp');
    gulp.task('default', function () {
      return gulp
        .src('app/{,/*}*.ts')
        .pipe($.typescript({
            sourcemap: true
        }))
        .pipe(gulp.dest('dist'));
    });
