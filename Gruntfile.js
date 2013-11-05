module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            js: {
                files: ["assets/officesnake.combined.js", "src/*.js"],
                tasks: ["uglify"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.registerTask("default", "watch");
}
