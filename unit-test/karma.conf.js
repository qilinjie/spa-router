module.exports = function (config) {
    config.set({
        basePath: '.',
        frameworks: ['jasmine'],
        files: ['unitTest-built.js'],
        exclude: ['karma.conf.js'],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        captureTimeout: 60000,
        singleRun: false
    });
};