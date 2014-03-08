'use strict';

var path = require('path');
var Buffer = require('buffer').Buffer;
var gutil = require('gulp-util');
var through = require('through2');
var ts = require('typescript-api');


// var es = require('event-stream');
// var Buffer = require('buffer').Buffer;

module.exports = function (opt) {
    var filename = 'typestring.ts';

    function compile(input) {
        // var logger = ;
        // var settings = ;
        var compiler = new ts.TypeScriptCompiler();
        
        var snapshot = ts.ScriptSnapshot.fromString(input);
        compiler.addFile(filename, snapshot);

        var iter = compiler.compile();

        var output = '';
        while (iter.moveNext()) {
            var current = iter.current().outputFiles[0];
            output += !!current ? current.text : '';
        }

        var diagnostics = compiler.getSemanticDiagnostics(filename);
        if (!output && diagnostics.length) {
            throw new Error(diagnostics[0].text());
        }
        gutil.log('input: ' + input);
        gutil.log('output: ' + output);
        return output;
    }


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
};