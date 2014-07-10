/* jshint latedef: false */
'use strict';

var fs      = require('fs');
var path    = require('path');
var gutil   = require('gulp-util');
var through = require('through2');
var ts      = require('typescript-api');

var settings;
var batchCompiler;

module.exports = tsPlugin;

function tsPlugin(options) {

    settings = buildSettings(options);
    if (!settings.noResolve()) {
        batchCompiler = new ts.BatchCompiler(ts.IO);
        batchCompiler.logger = new ts.NullLogger();
        batchCompiler.compilationSettings = settings;
    }

    return through.obj(objectStream);


    function objectStream(file, enc, cb) {
        /* jshint validthis: true */

        var _this = this;

        if (file.isNull() && settings.noResolve()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            _this.emit('error', pluginError('Streaming not supported'));
            return cb();
        }

        var inputFiles = [file];
        var outputFiles = [];
        if (!settings.noResolve()) {
            inputFiles = resolveFile(file);
        }

        try {
            inputFiles.forEach(function (input) {
                var data = compile(input, settings);
                if (data.file) { outputFiles.push(data.file); }
                if (data.sourcemap) { outputFiles.push(data.sourcemap); }
                data.errors.forEach(function (errorData) {
                    if (options.logErrors !== false) {
                        logError(errorData);
                    } else {
                        _this.emit('error', pluginError(errorData.message));
                    }
                });
            });

            outputFiles.forEach(function (rf) {
                _this.push(rf);
            });
        } catch (err) {
            err.fileName = file.path;
            _this.emit('error', pluginError(err));
            _this.push(file);
        }

        cb();
    }
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
        var target = (opts.target || 'es5').toLowerCase();
        st.codeGenTarget = target === 'es3' ? 0 : target === 'es5' ? 1 : opts.target;

        var module = (opts.module || 'commonjs').toLowerCase();
        st.moduleGenTarget = module === 'commonjs' ? 1 : module === 'amd' ? 2 : 0;

        st.mapSourceFiles = opts.sourcemap !== false;

        st.noResolve = opts.resolve !== true;
    }
    st.gatherDiagnostics = true;
    return ts.ImmutableCompilationSettings.fromCompilationSettings(st);
}

function resolveFile(file) {
    var result = [];
    var content, output;

    batchCompiler.resolvedFiles = [];
    batchCompiler.inputFiles = [file.path];
    batchCompiler.resolve();
    batchCompiler.resolvedFiles.forEach(function (rf) {
        if (!/\.d\.ts$/.test(rf.path)) {
            content = fs.readFileSync(rf.path, {encoding: 'utf8'});
            output = new gutil.File({
                base: file.base,
                cwd: file.cwd,
                path: rf.path,
                contents: new Buffer(content)
            });
            result.push(output);
        }
    });

    return result;
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
    var diagnostics = [];
    if (settings.gatherDiagnostics) {
        diagnostics = diagnostics.concat(compiler.getSyntacticDiagnostics(file.path));
        // XXX: tsc does has a lot of work in order to resolve all the files, and I couldn't
        // find a way to use the BatchCompiler API without reimplementing lot of code.
        // I believe this resolution is what makes tsc "slow", which is fine if you want to compile once
        // but if you are compiling a large project, using browserify for development then it's not
        // good.
        //
        // diagnostics = diagnostics.concat(compiler.getSemanticDiagnostics(file.path));
    }
    diagnostics.forEach(function (d) {
        errors.push({ path: file.path, message: d.text(), line: d.line() });
    });


    var cFile = new gutil.File({
        base: file.base,
        cwd: file.cwd,
        path: gutil.replaceExtension(file.path, '.js'),
        contents: new Buffer(output)
    });

    var smFile;
    if (sourcemap !== '') {
        smFile = new gutil.File({
            base: file.base,
            cwd: file.cwd,
            path: gutil.replaceExtension(file.path, '.js.map'),
            contents: new Buffer(sourcemap)
        });
    }

    return { file: cFile, sourcemap: smFile, errors: errors };
}
