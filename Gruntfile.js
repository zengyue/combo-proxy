'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    connect: {
      server: {
        options: {
          // port: 8000, //默认就是8000端口
          keepalive: true,
          hostname: '*', 
          middleware: function(connect, options){
            return [];
          }
        }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-connect');

  //开发时本地代理
  grunt.registerTask('dev', [ 'connect']);
};
