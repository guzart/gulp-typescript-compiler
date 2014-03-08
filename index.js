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

    return through.obj(objectStream);


    function objectStream(file, enc, cb) {
    /* jshint validthis: true */

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', error('Streaming not supported'));
            return cb();
        }

        try {
            var result = compile(file, settings);
            file.contents = new Buffer(result.contents);
            file.path = gutil.replaceExtension(file.path, '.js');
        } catch (err) {
            err.fileName = file.path;
            this.emit('error', error(err));
        }

        this.push(file);
        cb();
    }
}

function error(msg) {
    return new gutil.PluginError('gulp-typescript', msg);
}


function buildSettings(opts) {
    var st = new ts.CompilationSettings();
    if (opts) {
        st.mapSourceFiles = opts.sourcemap === true;
    }
    return ts.ImmutableCompilationSettings.fromCompilationSettings(st);
}


function compile(file, settings) {
    var logger = new ts.NullLogger();
    var compiler = new ts.TypeScriptCompiler(logger, settings);

    var snapshot = ts.ScriptSnapshot.fromString(file.contents.toString());
    compiler.addFile(file.path, snapshot);

    var iter = compiler.compile();

    var output = '';
    while (iter.moveNext()) {
        var current = iter.current().outputFiles[0];
        output += !!current ? current.text : '';
    }

    var diagnostics = compiler.getSemanticDiagnostics(file.path);
    if (!output && diagnostics.length) {
        error(diagnostics[0].text());
    }

    return { contents: output };
}
