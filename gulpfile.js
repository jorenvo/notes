const $ = require("gulp");
const $changed = require("gulp-changed"); // todo replace with gulp-cached
const $cache = require("gulp-cached");
const $tap = require("gulp-tap");
const $plumber = require("gulp-plumber");
const $postcss = require("gulp-postcss");
const $sourcemaps = require("gulp-sourcemaps");

const del = require("del");
const log = require("fancy-log");
const run = require("npm-run");
const server = require("browser-sync").create();
const precss = require("precss");
const cssnano = require("cssnano");

const files_org = ["index.org", "*/*.org"];
const files_css = "css/*.css";
const css_build_dir = "assets";
const emacs_eval =
    '(setq org-html-postamble-format \'(("en" "<p class=\\"creator\\">%c</p><p class=\\"author\\">Author: %a</p>")))';

$.task("default", $.series(clean, $.parallel(styles, render_org)));
$.task("work", $.series("default", $.parallel(serve, watch)));
$.task("clean", clean);

function clean() {
    return del([`${css_build_dir}/*.css`, `${css_build_dir}/maps/*`]);
}

function reload(done) {
    server.reload();
    done();
}

function watch() {
    $.watch(files_css, $.series(styles, reload));
    $.watch(files_org, $.series(render_org, reload));
}

function render_org() {
    return $.src(files_org)
        .pipe($cache("org"))
        .pipe(
            $tap(file => {
                log(`Rebuilding ${file.path}`);
                run.execSync(
                    `emacs ${file.path} --batch --eval '${emacs_eval.replace(
                        "'",
                        "'\"'\"'"
                    )}' -f org-html-export-to-html --kill`
                );
            })
        );
}

function serve(done) {
    server.init({
        startPath: "/notes", // mimic github pages
        server: { baseDir: ".", routes: { "/notes": "." } },
        https: true
    });
    done();
}

function styles() {
    return $.src("css/style.css")
        .pipe($sourcemaps.init())
        .pipe($changed(css_build_dir)) // only changed files will be passed on
        .pipe($plumber()) // https://gist.github.com/floatdrop/8269868
        .pipe(
            $postcss([
                precss,

                // minimize CSS
                cssnano({
                    autoprefixer: { browsers: ["last 2 version"], add: true }, // adds vendor prefixes to CSS
                    discardComments: { removeAll: true }
                })
            ])
        )
        .pipe($sourcemaps.write("maps"))
        .pipe($.dest(css_build_dir));
}