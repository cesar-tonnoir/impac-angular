'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var pkg = require('../bower.json');
var run = require('run-sequence');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @git <%= pkg.repository.url %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'del']
});

// builds html templates into angular $templateCache setters in a new module's .run() function.
gulp.task('partials', function () {
  return gulp.src([
    path.join(conf.paths.src, '/components/**/*.html')
  ])
    // TODO: No combination of below's options work; all break the templates.
    //       Look into how to successfully minify impac-angulars templates.
    // .pipe($.minifyHtml({
    //   empty: true,
    //   spare: true,
    //   quotes: true,
    //   loose: true
    // }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'impac.components.templates', // module name
      standalone: true, // creates a new module
      // Shorten component $templaceCache paths for simpler dynamic selection, and
      // cleaner includes.
      transformUrl: function (url) {
        // e.g widgets/accounts-balance/accounts-balance.tmpl.html
        var separator = ~url.indexOf('\\') ? '\\' : '/';
        var parentFolderName  = url.split(separator).slice(0, 1);
        var fileName          = url.split(separator).slice(-1);
        // if html file is a modal, return full path for semantic purposes.
        if (fileName[0].indexOf('.modal.') >= 0) {
          return url;
        }
        // e.g widgets/accounts-balance.tmpl.html
        return parentFolderName + '/' + fileName;
      }
    }))
    .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('images', function () {
  return gulp.src([
    path.join(conf.paths.src, '/images/**/*')
  ]).pipe($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(path.join(conf.paths.dist, '/images/')));
});

// Clean up  the tmp and build directory
gulp.task('clean', function (asyncCallback) {
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')], asyncCallback);
});

gulp.task('build', ['version', 'scripts', 'locales', 'styles', 'images', 'partials'], function() {
  // Source files for final dist build - NOTE: order is important.
  var buildSourceFiles = [
    path.join(conf.paths.src, 'impac-angular.prefix'),
    path.join(conf.paths.src, 'impac-angular.module.js'),
    path.join(conf.paths.tmp, 'partials/*.js'),
    path.join(conf.paths.tmp, 'scripts/**/*.js'),
    path.join(conf.paths.src, 'impac-angular.suffix'),
    path.join(conf.paths.lib, '*.js'),
    path.join(conf.paths.dist, 'impac-angular.css')
  ];

  var jsFilter = $.filter(['**/*', '!**/*.css', '!**/*.json'], { restore: true });
  var cssFilter = $.filter('**/*.css', { restore: true });

  return gulp.src(buildSourceFiles)
    .pipe(jsFilter)
    .pipe($.concat('impac-angular.js'))
    .pipe($.header(banner, { pkg: pkg } ))  // Add details about the current version
    .pipe($.ngAnnotate())
    .pipe(gulp.dest(conf.paths.dist)) // Output impac-angular.js
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }))
    .pipe($.ngAnnotate())
    .pipe($.uglify()).on('error', conf.errorHandler('Uglify'))
    .pipe($.rename('impac-angular.min.js'))
    .pipe($.header(banner, { pkg: pkg } ))  // Add details about the current version
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.minifyCss({ processImport: false, compatibility: 'ie8' }))
    .pipe($.rename('impac-angular.min.css'))
    .pipe(cssFilter.restore)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

// Run clean first to ensure all only current src files are included in dist (especially relevant for images)
gulp.task('build:dist', ['clean'], function (callback) {
  run(['build'], function () {
    callback();
  });
});
