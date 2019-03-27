import * as log from "fancy-log";
import * as gulp from "gulp";
import * as sass from "gulp-sass";
import * as sourcemaps from "gulp-sourcemaps";

import { create } from "browser-sync";
const browserSync = create();

const sassSrc = "public/editor/sass/**/*.scss";
const sassDest = "public/editor/css/";
const compileSass = () =>
{
    return gulp.src(sassSrc)
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(sassDest));
};
gulp.task("sass", compileSass);

const watch = (done, shouldStream?) =>
{
    gulp.watch(sassSrc, shouldStream ? () => compileSass().pipe(browserSync.stream()) : compileSass);
    log.info("Watching for file changes...");
    done();
};
gulp.task("watch", watch);

gulp.task("stream", (done) =>
{
    browserSync.init(
    {
        proxy: "http://localhost"
    });
    watch(done, true);
});

gulp.task("default", gulp.series(compileSass, watch));
