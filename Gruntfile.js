module.exports = function(grunt) {
    grunt.initConfig({
        jshint: ["*/**.js", "*.js", "!node_modules/"],
        react: {
            default: {
                files: [
                    {
                    "tests/tests.js": "tests/tests.jsx",
                    },
                ],
            },
        },
    });
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-react");
};
