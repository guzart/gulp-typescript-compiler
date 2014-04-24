gulp-typescript-compiler
===============

## Information

<table>
<tr>
<td>Package</td><td>gulp-typescript-compiler</td>
</tr>
<tr>
<td>Description</td>
<td>Typescript plugin for gulp.<br>
Based of <a href="https://github.com/sindresorhus/gulp-typescript">gulp-typescript</a> and
<a href="https://github.com/gavinhungry/typestring">typestring</a>
</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.10</td>
</tr>
</table>

## Usage

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

**or just the entry point to your app**

    var gulp = require('gulp');
    var tsc  = require('gulp-typescript-compiler');

    gulp.task('default', function () {
      return gulp
        .src('app/main.ts', {read: false})
        .pipe(tsc({
            resolve: true
        }))
        .pipe(gulp.dest('dist'));
    });

#### options.resolve

Type: `boolean`  
Default: `false`  
_optional_

Specify if the file(s) should resolve required files.
By setting this to true the plugin will add to the buffered files
all the other imported files.

#### options.module

Type: `string`  
Default: `'commonjs'`  
_optional_

Specify module code generation: 'commonjs' or 'amd'.

#### options.target

Type: `string`  
Default: `'ES5'`  
_optional_

Specify ECMAScript target version: 'ES3', or 'ES5'.

#### options.sourcemap

Type: `boolean`  
Default: `true`  
_optional_

Generates corresponding .map file.

#### logErrors

Type: `boolean`  
Default: `true`  
_optional_

Log any _syntactic_ errors to console.
