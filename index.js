/* jshint latedef: false */
'use strict';

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var ts = require('typescript-api');

module.exports = tsPugin;

function tsPugin(options) {

    var settings = buildSettings(options);

    return through.obj(objectStream);


    function objectStream(file, enc, cb) {
        /* jshint validthis: true */

        var _this = this;

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            _this.emit('error', pluginError('Streaming not supported'));
            return cb();
        }

        var sourcemap;
        try {
            var data = compile(file, settings);
            file.contents = new Buffer(data.contents);
            file.path = gutil.replaceExtension(file.path, '.js');
            if (options.sourcemap) {
                sourcemap = buildSourcemapFile(file, data.sourcemap);
            }
            data.errors.forEach(function (errorData) {
                if (options.logErrors !== false) {
                    logError(errorData);
                } else {
                    _this.emit('error', pluginError(errorData.message));
                }
            });
        } catch (err) {
            err.fileName = file.path;
            _this.emit('error', pluginError(err));
        }

        _this.push(file);
        if (sourcemap) {
            _this.push(sourcemap);
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

function logError(error) {
    gutil.log(
        gutil.colors.red('Error:'),
        error.message.replace(/\.$/, ''),
        'on',
        gutil.colors.cyan(path.relative(process.cwd(), error.path)),
        gutil.colors.magenta('line ' + error.line)
    );
}

function pluginError(msg) {
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
    var result, ix, current;
    while (it.moveNext()) {
        result = it.current();

        for (ix = 0; ix < result.outputFiles.length; ix++) {
            current = result.outputFiles[ix];
            if (!current) { continue; }
            if (/\.map$/.test(current.name)) {
                sourcemap += current.text;
            } else {
                output += current.text;
            }
        }
    }

    var errors = [];
    var diagnostics = compiler.getSemanticDiagnostics(file.path);
    diagnostics = diagnostics.concat(compiler.getSyntacticDiagnostics(file.path));
    diagnostics.forEach(function (d) {
        errors.push({ path: file.path, message: d.text(), line: d.line() });
    });

    return { contents: output, sourcemap: sourcemap, errors: errors };
}
