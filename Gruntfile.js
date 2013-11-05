module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            dist: {
                src: ["src/*.js"],
                dest: "dist/<%= pkg.name %>.js"
            }
        },
        uglify: {
            options: {
                mangle: true
            },
            dist: {
                files: {
                    "dist/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"]
                }
            }
        },
        watch: {
            files: ["src/*.js"],
            tasks: ["concat", "uglify"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-concat");
};
