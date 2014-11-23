module.exports = function(grunt) {
 
  // Project configuration.
  grunt.initConfig({
    // This line makes your node configurations available for use
    //pkg: grunt.file.readJSON('package.json'),
    // This is where we configure JSHint
    jst: {
        compile: {
            options: {
                prettify: true,
                amd: true,
                processName: function(filepath) {
                    var spl = filepath.split('/');
                    return spl[spl.length-1].replace('.html', '');
                }
            },
            files: {
                "js/templates.js": ["js/templates/*.html"]
            }
        }
    }
  });
  // Each plugin must be loaded following this pattern
  grunt.loadNpmTasks('grunt-contrib-jst');
};
