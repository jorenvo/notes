const $ = require("gulp");
const $changed = require("gulp-changed");
const $tap = require("gulp-tap");
const $plumber = require("gulp-plumber");
const $postcss = require("gulp-postcss");
const $sourcemaps = require("gulp-sourcemaps");
const $rev = require("gulp-rev");
const $filter = require("gulp-filter");
const $revRewrite = require("gulp-rev-rewrite");
const $replace = require("gulp-replace");

const fs = require("fs");
const path = require("path");
const del = require("del");
const filename = require("file-name");
const log = require("fancy-log");
const run = require("npm-run");
const server = require("browser-sync").create();
const precss = require("precss");
const cssnano = require("cssnano");
const merge = require("merge-stream");

const files_org = "*/*.org";
const files_css = "css/*.css";
const css_build_dir = "assets";
const revisioned_assets_dir = "revisioned";
const emacs_eval_postamble =
    '(setq org-html-postamble-format \'(("en" "<p class=\\"creator\\">%c</p><p class=\\"author\\">Author: %a</p>")))';

$.task("default", $.series(clean, $.parallel(styles, render_org), rev));
$.task("work", $.series("default", $.parallel(serve, watch)));
$.task("org", render_org);
$.task("clean", $.parallel(clean, clean_html));
$.task("rev", rev);

function rev() {
    const assetFilter = $filter(["**/*", "!**/index.html"], { restore: true });
    const assetsRegex = `\\/notes\\/(?!${revisioned_assets_dir})(?!sw.js)(?=[^"])`;

    return $.src([
        "**/*.png",
        "**/*.svg",
        `**/${css_build_dir}/*.css`,
        `**/${css_build_dir}/sw-loader.js`,
        `**/${css_build_dir}/maps/*.map`,
        "**/index.html",
        "*/index.html",
        "!node_modules/**",
        `!${revisioned_assets_dir}/**`,
    ])
        .pipe(assetFilter)
        .pipe($rev()) // Rename all files except index.html
        .pipe(assetFilter.restore)
        .pipe($revRewrite()) // Substitute in new filenames
        .pipe(
            $replace(
                new RegExp(assetsRegex, "g"),
                `/notes/${revisioned_assets_dir}/`
            )
        )
        .pipe($replace("file://", ""))
        .pipe($replace(/<a (href="[^#/\.])/g, "<a target=\"_blank\" $1"))
        .pipe(
            $.dest(file => {
                if (file.extname === ".html") {
                    return file.base;
                } else {
                    return revisioned_assets_dir;
                }
            })
        );
}

function clean_html() {
    const to_delete = ["*.html", "*/*.html"];
    return del(to_delete);
}

function clean() {
    const to_delete = [
        `${css_build_dir}/*.css`,
        `${css_build_dir}/maps/*`,
        revisioned_assets_dir
    ];
    return del(to_delete);
}

function reload(done) {
    server.reload();
    done();
}

function watch() {
    $.watch(files_css, $.series($.parallel(clean_html, clean, render_org, styles), rev, reload));
    $.watch(files_org, $.series(render_org, rev, reload));
    return Promise.resolve();
}

function shell_escape_quote(s) {
    return s.replace(/'/g, "'\"'\"'");
}

function get_preamble(file_path) {
    return `
<div class="top">
  <a href="/notes/">notes</a> / ${filename(file_path).replace(/_/g, " ")}
  <div class="right">
      github:&nbsp;<a href="https://github.com/jorenvo">jorenvo</a> |
      email:&nbsp;<a href="mailto:joren@jvo.sh">joren@jvo.sh</a> |
      PGP:&nbsp;<a href="/publickey.txt">50A5 7A39 0DE1 1A6C</a> |
      keybase:&nbsp;<a href="https://keybase.io/jvo">jvo</a>
  </div><br/>
  <div class="right"><i>Published on %d</i></div>
</div>`;
}

function get_emacs_org_preamble(file_path) {
    // don't show breadcrumb for index
    if (file_path.endsWith("index.org")) {
        return "t";
    } else {
        return `(progn
(setq org-html-metadata-timestamp-format "%B %e %Y")
(setq org-html-preamble-format '(("en" "${get_preamble(
            file_path
        ).replace(/"/g, '\\"')}"))))`;
    }
}

function getFolders(dir) {
    return fs.readdirSync(dir).filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

function render_org(done) {
    var folders = getFolders(".");
    folders.push("."); // add current dir for index.org

    if (folders.length === 0) {
        return done();
    }
    var tasks = folders.map(function(folder) {
        return $.src(path.join(folder, "*.org"))
            .pipe(
                $changed(folder, {
                    transformPath: newPath =>
                        path.join(path.dirname(newPath), "index.html")
                })
            )
            .pipe(
                $tap(file => {
                    log(`Rebuilding ${file.path}`);
                    run.execSync(
                        `emacs ${
                            file.path
                        } --batch --eval '${shell_escape_quote(
                            get_emacs_org_preamble(file.path)
                        )}' --eval '${shell_escape_quote(
                            emacs_eval_postamble
                        )}' -f org-html-export-to-html --kill`
                    );
                })
            );
    });

    return merge(tasks);
}

function serve(done) {
    server.init({
        startPath: "/notes", // mimic github pages
        server: { baseDir: ".", routes: { "/notes": "." } },
        https: false
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
        .pipe($sourcemaps.write("maps", {sourceMappingURLPrefix: "/notes/assets"}))
        .pipe($.dest(css_build_dir));
}
