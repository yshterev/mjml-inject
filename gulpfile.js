var gulp = require('gulp');
var fs = require('fs');
var loader = require('gulp-load-plugins');
var plugins = loader({
	scope: 'devDependencies',
	replaceString: 'gulp-',
	camelize: true
});
var through = require('through2');

/**
 * Functions
 */

function matchRegEx(content) {
	var regex = /{{(.+?)}}/gi;
	var match = content.match(regex);

	return match;
}

function injectMJML(content, callback) {
	var match = matchRegEx(content);
	var filename = '';

	if (match === null) {
		callback(content);
		return;
	}

	filename = match[0].replace('{{', '').replace('}}', '');

	fs.readFile('src/templates/' + filename, 'utf8', function(err, data) {
		if(err) {
			throw err;
		}
		var regex = RegExp('{{' + filename + '}}', 'g');
		var result = content.replace(regex, data);

		injectMJML(result, callback);
	});
}

 function mjmlTemplates() {
	var stream = null;

	stream = through.obj(function(file, enc, callback) {
		var that = this;
		var content = file.contents.toString('utf8');

		if (file.isBuffer() === false) {
			callback();
			return;
		}

		injectMJML(content, function(finalContent) {
			file.contents = new Buffer(finalContent);
			that.push(file);
			callback();
		});
	});

	return stream;
 }

gulp.task('mjml', function() {
	return gulp.src('src/*.mjml')
		.pipe(mjmlTemplates())
		.pipe(plugins.mjml())
		.pipe(gulp.dest('dist/'));
});

function changeEvent(evt) {
	plugins.util.log(plugins.util.colors.cyan(evt.path.substring(evt.path.lastIndexOf('\\') + 1), 'was', plugins.util.colors.magenta(evt.type)));
}

gulp.task('watch', ['mjml'], function() {
	gulp.watch('src/**/*.mjml', ['mjml']).on('change', function(evt) {
		changeEvent(evt);
	});
});

gulp.task('default', ['mjml']);