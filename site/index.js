var quickconnect = require('rtc-quickconnect');
var captureConfig = require('rtc-captureconfig');
var media = require('rtc-media');
var crel = require('crel');
var append = require('fdom/append');
var onChange = require('fdom/on')('change');
var qsa = require('fdom/qsa');
var tweak = require('fdom/classtweak');

// local & remote video areas
var layout = qsa('.layout')[0];
var local = qsa('.local')[0];
var remotes = qsa('.remote');

// peers
var peerMedia = {};

// use google's ice servers
var iceServers = [
  { url: 'stun:stun.l.google.com:19302' }
];

// render a remote video
function renderRemote(id, stream) {
  var activeStreams;

  // create the peer videos list
  peerMedia[id] = peerMedia[id] || [];

  activeStreams = Object.keys(peerMedia).filter(function(id) {
    return peerMedia[id];
  }).length;

  console.log('current active stream count = ' + activeStreams);
  peerMedia[id] = peerMedia[id].concat(media(stream).render(remotes[activeStreams % 2]));
}

function removeRemote(id) {
  var elements = peerMedia[id] || [];

  // remove old streams
  console.log('peer ' + id + ' left, removing ' + elements.length + ' elements');
  elements.forEach(function(el) {
    el.parentNode.removeChild(el);
  });
  peerMedia[id] = undefined;
}

// capture local media
var localMedia = (function(opts) {
  if (!opts)
    opts = {
      constraints: captureConfig('camera microphone:off min:1280x720').toConstraints()
    };
  var video = media(opts);

  // render our local media to the target element
  video.render(local);

  // once the local media is captured broadcast the media
  video.once('capture', function(stream) {
    // handle the connection stuff
    quickconnect(location.href, {
      room: '/',
      iceServers: iceServers
    })
    .broadcast(stream)
    .on('stream:added', renderRemote)
    .on('stream:removed', removeRemote);
  });

  return video;
})();


// get the sources
MediaStreamTrack.getSources(function(sources) {
  var devices = append.to(layout, crel('select', { 'class': 'devices'}));

  // get the cameras
  var cameras = sources.filter(function(info) {
    return info && info.kind === 'video';
  });

  // create videos
  var videos = cameras.map(function(info, idx) {
    //return media(capture('camera:' + idx).toConstraints({ sources: sources }));
    return crel('option', 'Camera ' + idx);
  }).map(append.to(devices));

  onChange(devices, function(err, el) {
    var index = el.target.selectedIndex;
    localMedia.stop();
    console.log(localMedia);
    localMedia({
      constraints: captureConfig('camera:' + index+ ' microphone:off min:1280x720').toConstraints({ sources: sources })
    });
  });
});

