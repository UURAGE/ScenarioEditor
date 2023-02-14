import browserSync from "browser-sync";
import gulp from "gulp";
import autoprefixer from "gulp-autoprefixer";
import eslint from "gulp-eslint-new";
import sassFactory from "gulp-sass";
import stylelint from "gulp-stylelint";
import * as sassCompiler from "sass-embedded";

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
    console.log("Watching for file changes...");
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
