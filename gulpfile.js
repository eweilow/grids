/*
    grids
    Copyright (C) 2015  Erik Weilow

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var minifycss = require("gulp-minify-css");
var postcss = require("gulp-postcss");
var size = require("gulp-size");
var rimraf = require('gulp-rimraf');
var sourcemaps = require("gulp-sourcemaps");

var autoprefixer = require("autoprefixer");

var scss_source = "./src/*.scss";
var scss_target = "./lib/css/";

var css_target_files = scss_target + "*.css";

gulp.task("scss:clean", function () {
  return gulp.src(scss_target + "*.css", { read: false })
    .pipe(rimraf());
});

gulp.task("scss", ["scss:clean"], function () {
  var preSize = size({ title: "before" });
  var postSize = size({ title: "after" });
  gulp.src(scss_source)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(preSize)
    .pipe(postcss([autoprefixer({ browsers: ["last 2 version"] })]))
    .pipe(minifycss({ compatibility: "ie8" }))
    .pipe(postSize)
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(scss_target));
});

gulp.task("build", ["scss"], function(){
  
});