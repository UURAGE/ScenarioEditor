import * as eslint from "@doamatto/gulp-eslint";
import * as log from "fancy-log";
import * as gulp from "gulp";
import * as autoprefixer from "gulp-autoprefixer";
import * as sassFactory from "gulp-sass";
import * as stylelint from "gulp-stylelint";
import * as sassCompiler from "node-sass";

import * as browserSync from "browser-sync";

const sass = sassFactory(sassCompiler);

const jsSrc = "public/editor/js/**/*.js";
const lintJS = () =>
{
    return gulp.src(jsSrc)
        .pipe(eslint())
        .pipe(eslint.format());
};
gulp.task("lint_js", lintJS);

const prefixerOptions: autoprefixer.Options =
{
    flexbox: "no-2009"
};
const sassSrc = "public/editor/sass/**/*.scss";
const sassDest = "public/editor/css/";
const lintSass = () =>
{
    return gulp.src(sassSrc)
        .pipe(stylelint(
        {
            failAfterError: false,
            reporters: [{ formatter: "string", console: true }]
        }));
};
gulp.task("lint_sass", lintSass);
const compileSass = () =>
{
    return gulp.src(sassSrc, { sourcemaps: true })
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer(prefixerOptions))
        .pipe(gulp.dest(sassDest, { sourcemaps: '.' }));
};
const processSass = gulp.series(lintSass, compileSass);
gulp.task("sass", processSass);

const watch = (done, browserSyncInstance?: browserSync.BrowserSyncInstance) =>
{
    gulp.watch(jsSrc, lintJS);
    gulp.watch(
        sassSrc,
        gulp.series(lintSass, browserSyncInstance ? () => compileSass().pipe(browserSyncInstance.stream()) : compileSass)
    );
    log.info("Watching for file changes...");
    done();
};
gulp.task("watch", watch);

gulp.task("stream", (done) =>
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
