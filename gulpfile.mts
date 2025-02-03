import * as path from "node:path";

import browserSync from "browser-sync";
import gulp from "gulp";
import autoprefixer from "gulp-autoprefixer";
import eslint from "gulp-eslint-new";
import sassFactory from "gulp-sass";
import stylelint from "gulp-stylelint-esm";
import tap from "gulp-tap";
import * as sassCompiler from "sass-embedded";
import type { RawSourceMap } from "source-map-js";
import type { TaskCallback } from "undertaker";
import type Vinyl from "vinyl";

const sass = sassFactory(sassCompiler);

const jsDir = "public/editor/js/";
const jsSrc = jsDir + "**/*.js";
const lintJS = () =>
    gulp.src(jsSrc)
        .pipe(eslint({ cwd: path.resolve(process.cwd(), jsDir) }))
        .pipe(eslint.format());
gulp.task("lint_js", lintJS);

const prefixerOptions: autoprefixer.Options =
{
    flexbox: "no-2009"
};
const sassDir = "public/editor/sass/";
const sassSrc = sassDir + "**/*.scss";
const sassDest = "public/editor/css/";
const lintSass = () =>
    gulp.src(sassSrc)
        .pipe(stylelint(
        {
            quietDeprecationWarnings: true,
            failAfterError: false,
            reporters: [{ formatter: "string", console: true }]
        }));
gulp.task("lint_sass", lintSass);
const toPosixPath = path.sep !== path.posix.sep ?
    (relativePath: string) => path.posix.join(...relativePath.split(path.sep)) :
    (relativePath: string) => relativePath;
const compileSass = () =>
    gulp.src(sassSrc, { sourcemaps: true })
        .pipe(sass().on("error", sass.logError.bind(sass)))
        .pipe(tap((file: Vinyl & { sourceMap?: RawSourceMap }) =>
        {
            if (file.sourceMap?.sources.length)
            {
                const relativeInitialPath = toPosixPath(path.relative(sassDir, file.history[0]!));
                const prefixPath = path.posix.dirname(relativeInitialPath);
                const prefix = prefixPath === '.' ? null : prefixPath + '/';
                file.sourceMap.sources = file.sourceMap.sources.map((source) =>
                {
                    if (prefix && source.startsWith(prefix))
                    {
                        source = source.substring(prefix.length);
                    }
                    if (source.startsWith('data:'))
                    {
                        return relativeInitialPath;
                    }
                    else if (source.startsWith('file:'))
                    {
                        const uriComponent = decodeURIComponent(new URL(source).pathname);
                        const absolutePath = path.sep === '\\' && uriComponent.startsWith('/') && uriComponent[2] === ':' ?
                            uriComponent.substring(1) : uriComponent;
                        return toPosixPath(path.relative(sassDir, absolutePath));
                    }
                    else
                    {
                        return source;
                    }
                });
            }
        }))
        .pipe(autoprefixer(prefixerOptions))
        .pipe(gulp.dest(sassDest, { sourcemaps: '.' }));
const processSass = gulp.series(lintSass, compileSass);
gulp.task("sass", processSass);

const watch = (done: TaskCallback, browserSyncInstance?: browserSync.BrowserSyncInstance) =>
{
    gulp.watch(jsSrc, lintJS);
    gulp.watch(
        sassSrc,
        gulp.series(lintSass, browserSyncInstance ? () => compileSass().pipe(browserSyncInstance.stream()) : compileSass)
    );
    console.log("Watching for file changes...");
    done();
};
gulp.task("watch", watch);

gulp.task("stream", (done: TaskCallback) =>
{
    const browserSyncInstance = browserSync.create();
    browserSyncInstance.init(
    {
        proxy: "http://localhost"
    });
    watch(done, browserSyncInstance);
});

const build = gulp.parallel(lintJS, processSass);
gulp.task("build", build);

gulp.task("default", gulp.series(build, watch));
