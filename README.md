gulp-typescript-compiler
===============

Typescript plugin for gulp

    var gulp = require('gulp');
    var tsc  = require('gulp-typescript-compiler');

    gulp.task('default', function () {
      return gulp
        .src('app/**/*.ts')
        .pipe(tsc({
            module: '',
            target: 'ES3',
            sourcemap: false,
            logErrors: true
        }))
        .pipe(gulp.dest('dist'));
    });

## Options

* **module**: Specify module code generation: 'commonjs' or 'amd'. _default("")_
* **target**: Specify ECMAScript target version: 'ES3', or 'ES5'. _default("ES5")_
* **sourcemap**: Generates corresponding .map file. _default(true)_
* **logErrors**: Log errors to console. _default(true)_
