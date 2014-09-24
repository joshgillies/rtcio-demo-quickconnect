var fs = require('fs');
var path = require('path');
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var app = express();
var server = require('http').Server(app);
var browserify = require('browserify-middleware');
var serverPort = parseInt(process.env.PORT, 10) || 3000;

// static assets
var siteRoot = path.resolve(__dirname, 'site');
//
// create the switchboard
var switchboard = require('rtc-switchboard')(server);

// convert stylus stylesheets
app.use(stylus.middleware({
  src: __dirname + '/site',
  compile: function(str, sourcePath) {
    return stylus(str)
      .set('filename', sourcePath)
      .set('compress', false)
      .use(nib());
  }
}));

browserify.settings.development('debug', true);

// force development mode for browserify given this is a demo
browserify.settings('mode', 'development');

// serve the rest statically
app.use(browserify(siteRoot));
app.use(express.static(siteRoot));

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());

app.get('/', function(req, res, next) {
  res.writeHead(200);
  fs.createReadStream(path.resolve(siteRoot, 'index.html')).pipe(res);
});


// start the server
server.listen(serverPort, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }

  console.log('running @ http://localhost:' + serverPort + '/');
});
