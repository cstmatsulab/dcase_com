module.exports = function (grunt) {
    'use strict';
    require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg      : grunt.file.readJSON('package.json'),
        bower    : grunt.file.readJSON('bower.json'),
        distdir  : 'dist',
        srcdir   : 'src',
        builddir : '.work/.tmp',
        name     : grunt.file.readJSON('package.json').name || 'trumbowyg-ng',   // module name

        // Clean
        clean      : {
            dist : {
                src : [
                    '<%= builddir %>',
                    '<%= distdir %>'
                ]
            }
        },

        // Copy files
        copy : {
            // Copy concatened JS file from builddir to dist/
            dist : {
                files : {
                    '<%= distdir %>/<%= name %>.js' : '<%= builddir %>/<%= name %>.js'
                }
            }
        },

        // Concatenation
        concat     : {
            dist : {
                files : {
                    '<%= builddir %>/<%= name %>.js' : [
                        '<%= srcdir %>/<%= name %>.js',
                        '<%= srcdir %>/**/*.js',
                        '!<%= srcdir %>/**/*.spec.js'
                    ]
                }
            }
        },

        // ngMin
        ngAnnotate: {
            dist: {
                files: {
                    '<%= builddir %>/<%= name %>.js' : ['<%= builddir %>/<%= name %>.js']
                }
            }
        },

        // Obfuscate
        uglify   : {
            js : {
                options : {
                    banner : '/*! <%= name %> - <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files   : {
                    '<%= distdir %>/<%= name %>.min.js' : ['<%= builddir %>/<%= name %>.js']
                }
            }
        },

        // ... and its prefixed vendor styles
        autoprefixer: {
            options: {
                browsers: ['last 3 versions', 'ie >= 9', '> 5%']
            },
            dist: {
                files: {
                    '<%= distdir %>/<%= name %>.css' : ['<%= builddir %>/<%= name %>.css']
                }
            }
        },

        // JS Check
        jshint     : {
            options : {
                jshintrc : '.jshintrc',
                reporter: require('jshint-stylish')
            },
            js      : [
                '<%= srcdir %>/*.js',
                '<%= srcdir %>/*/*.js',
                '!<%= srcdir %>/**/*.spec.js'
            ]
        },

        // Check complexity
        complexity : {
            generic : {
                src     : [
                    '<%= srcdir %>/**/*.js',
                    '!<%= srcdir %>/**/*.spec.js'
                ],
                options : {
                    errorsOnly      : false,
                    cyclomatic      : 12,
                    halstead        : 45,
                    maintainability : 82
                }
            }
        },

        // Watch
        delta : {
            dist: {
                files : ['<%= srcdir %>/**/*', '!<%= srcdir %>/**/*.spec.js'],
                tasks: ['buildProd']
            },
            test: {
                files : ['<%= srcdir %>/**/*.spec.js'],
                tasks: ['test']
            }
        },

        // To release
        bump       : {
            options : {
                pushTo        : 'origin master',
                files         : [
                    'package.json',
                    'bower.json'
                ],
                updateConfigs : ['pkg', 'bower'],
                commitFiles   : ['-a']
            }
        },

        // Testing
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        }
    });

    grunt.registerTask('buildProd', [
        'clean',
        'jshint',
        'complexity',
        'concat:dist',
        'ngAnnotate',
        'uglify',
        'copy:dist'
    ]);

    grunt.registerTask('default', ['buildProd']);

    grunt.task.renameTask('watch', 'delta');
    grunt.registerTask('watch', ['buildProd', 'delta']);

    grunt.registerTask('test', ['karma']);

    /**
     * --type=patch
     * --type=minor
     * --type=major
     */
    grunt.registerTask('release', 'Release', function () {
        var type = grunt.option('type') || 'patch';
        grunt.task.run(['test', 'bump-only:' + type, 'buildProd', 'bump-commit']);
    });

};
