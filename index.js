/* jshint latedef: false */
'use strict';

// var path = require('path');
// var es = require('event-stream');

var gutil = require('gulp-util');
var through = require('through2');
var ts = require('typescript-api');


module.exports = tsPugin;


function tsPugin(options) {

    var settings = buildSettings(options);
    var filename = 'typestring.ts';

    return through.obj(objectStream);


    function objectStream(file, enc, cb) {
    /* jshint validthis: true */

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
    }


    function buildSettings(opts) {
        var st = new ts.CompilationSettings();
        if (opts) {
            st.mapSourceFiles = opts.sourcemap === true;
        }
        return ts.ImmutableCompilationSettings.fromCompilationSettings(st);
    }


    function compile(input) {
        var logger = new ts.NullLogger();
        var compiler = new ts.TypeScriptCompiler(logger, settings);

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

        compiler.removeFile(filename);
        return output;
    }
}
