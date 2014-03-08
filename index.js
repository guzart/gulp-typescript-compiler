/* jshint latedef: false */
'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var ts = require('typescript-api');

module.exports = tsPugin;

function tsPugin(options) {

    var settings = buildSettings(options);

    return through.obj(objectStream);


    function objectStream(file, enc, cb) {
    /* jshint validthis: true */
        var sourcemap;

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', error('Streaming not supported'));
            return cb();
        }

        try {
            var data = compile(file, settings);
            file.contents = new Buffer(data.contents);
            file.path = gutil.replaceExtension(file.path, '.js');
            if (options.sourcemap) {
                sourcemap = buildSourcemapFile(file, data.sourcemap);
            }
        } catch (err) {
            err.fileName = file.path;
            this.emit('error', error(err));
        }

        this.push(file);
        if (sourcemap) {
            this.push(sourcemap);
        }

        cb();
    }
}

function buildSourcemapFile(source, content) {
    return new gutil.File({
        base: source.base,
        cwd: source.cwd,
        path: gutil.replaceExtension(source.path, '.js.map'),
        contents: new Buffer(content)
    });
}


function error(msg) {
    return new gutil.PluginError('gulp-typescript', msg);
}


function buildSettings(opts) {
    var st = new ts.CompilationSettings();
    if (opts) {
        var target = (opts.target || 'es3').toLowerCase();
        st.codeGenTarget = target === 'es3' ? 0 : target === 'es5' ? 1 : opts.target;

        var module = (opts.module || '').toLowerCase();
        st.moduleGenTarget = module === 'commonjs' ? 1 : module === 'amd' ? 2 : 0;

        st.mapSourceFiles = opts.sourcemap === true;
    }
    return ts.ImmutableCompilationSettings.fromCompilationSettings(st);
}


function compile(file, settings) {
    var logger = new ts.NullLogger();
    var compiler = new ts.TypeScriptCompiler(logger, settings);

    var snapshot = ts.ScriptSnapshot.fromString(file.contents.toString());
    compiler.addFile(file.path, snapshot);

    var it = compiler.compile();

    var output = '';
    var sourcemap = '';
    while (it.moveNext()) {
        var result = it.current();
        for (var i = 0; i < result.outputFiles.length; i++) {
            var current = result.outputFiles[i];
            if (!current) { continue; }
            if (/\.map$/.test(current.name)) {
                sourcemap += current.text;
            } else {
                output += current.text;
            }
        }
    }

    var diagnostics = compiler.getSemanticDiagnostics(file.path);
    if (!output && diagnostics.length) {
        error(diagnostics[0].text());
    }

    return { contents: output, sourcemap: sourcemap };
}
