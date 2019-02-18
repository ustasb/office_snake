module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    concat: {
      dist: {
        src: ["public/js/*.js"],
        dest: "public/dist/<%= pkg.name %>.js"
      }
    },
    uglify: {
      options: {
        compress: true,
        mangle: {
          toplevel: true,
        },
      },
      dist: {
        files: {
          "public/dist/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"]
        }
      }
    },
  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-concat");

  grunt.registerTask('default', ['concat', 'uglify']);
};
