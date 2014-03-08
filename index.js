'use strict';

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var ts = require('typescript-api');


// var es = require('event-stream');
// var Buffer = require('buffer').Buffer;


var filename = 'typestring.ts';




module.exports = function (opt) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-typescript', 'Streaming not supported'));
            return cb();
        }

        try {
            file.contents = new Buffer(compile(file.contents.toString()));
            file.path = gutil.replaceExtension(file.path, '.js');
        } catch (err) {
            err.fileName = file.path;
            this.emit('error', new gutil.PluginError('gulp-typescript', err));
        }

        this.push(file);
        cb();
    });

    function compile(input) {
        // var compiler = new TypeScript.TypeScriptCompiler(new );
        return input;
    }
};