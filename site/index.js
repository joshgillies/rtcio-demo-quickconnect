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

var startStream = function startStream(opts) {
  if (!opts)
    opts = {
      constraints: captureConfig('camera microphone:off min:1280x720').toConstraints()
    };
  // capture local media
  var localMedia =  media(opts);

  // render our local media to the target element
  localMedia.render(local);

  // once the local media is captured broadcast the media
  localMedia.once('capture', function(stream) {
    // handle the connection stuff
    quickconnect(location.href, {
      room: '/',
      iceServers: iceServers
    })
    .broadcast(stream)
    .on('stream:added', renderRemote)
    .on('stream:removed', removeRemote);
  });
};

// get the sources
MediaStreamTrack.getSources(function(sources) {

  // get the cameras
  var cameras = sources.filter(function(info) {
    return info && info.kind === 'video';
  });

  if (cameras.length === 1)
    return startStream();

  var devices = append.to(document.body, crel('form', { 'class': 'devices' }, crel('select', crel('option', 'Select an available input device'))));

  // create videos
  var videos = cameras.map(function(info, idx) {
    //return media(capture('camera:' + idx).toConstraints({ sources: sources }));
    return crel('option', info.label || 'Camera ' + (idx + 1));
  }).map(append.to(qsa('.devices select')[0]));

  onChange(devices, function(err, el) {
    var index = el.target.selectedIndex;
    startStream({
      constraints: captureConfig('camera:' + index + ' microphone:off min:1280x720').toConstraints({ sources: sources })
    });
    devices.remove();
  });
});


