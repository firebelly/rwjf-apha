/**
 * IdeaController
 *
 * Server-side logic for managing Ideas
 */

var chokidar = require('chokidar'),
    glob = require('glob'),
    path = require('path');

// custom app config (mostly for photos_base_url and photos_dir)
var conf = sails.config.custom;

// watch /queue/ dir for files added/removed
var watcher = chokidar.watch(conf.photos_dir + '/queue/', {
  ignored: /[\/\\]\./, 
  persistent: true
});

// if image is added, broadcast with socket
watcher.on('add', function(file) { 
  var filename = path.basename(file);
  var image = { src: conf.photos_base_url + '/queue/' + filename, name: filename };
  console.log('File', file, 'has been added');
  sails.sockets.blast('photos', { verb: 'add', image: image });
});

// similarly, if image is deleted tell Angular
watcher.on('unlink', function(file) { 
  console.log('File', file, 'has been unlinked');
  var filename = path.basename(file);
  var image = { src: conf.photos_base_url + '/queue/' + filename, name: filename };
  sails.sockets.blast('photos', { verb: 'unlink', image: image });
});

module.exports = {

  // list of ideas page
  index: function(req, res) {
    Idea.count().exec(function countCB(error, found) { 
      var numIdeas = found; 
      Idea.find(function foundIdeas (err, ideas) {
        if (err) {
          res.send(400);
        } else {
          if (req.wantsJSON) {
            return res.json(ideas);
          }
          else {
            return res.view({
              ideas: ideas, 
              formMode: 'list',
              numIdeas: numIdeas
            });
          }
        }
      });

    });
  },

  // edit idea page, not currently used
  edit: function(req, res, next) {
    var numIdeas; 
    Idea.count().exec(function countCB(error, found) { numIdeas = found; });
    Idea.findOne(req.param('id'), function foundIdea(err, idea) {
      if (err) return next(err);
      if (!idea) return next();
      res.view('idea/create', {
        idea: idea,
        formMode: 'edit',
        numIdeas: numIdeas
      });
    });
  },

  // new idea page
  new: function(req, res) {
    Idea.count().exec(function countCB(error, found) { 
      var numIdeas = found; 
      res.view('idea/create', {
        idea: {},
        formMode: 'create',
        numIdeas: numIdeas
      });
    });
  },

  // spits out json list of images in /queue/ directory for initial form load
  photos: function(req, res) {
    glob(conf.photos_dir + '/' + req.param('id') + '/*', function (er, files) {
      photos = [];
      _.each(files, function(file) {
        var filename = path.basename(file);
        photos.push({ src: conf.photos_base_url + '/' + req.param('id') + '/' + filename, name: filename });
      });
      res.json(photos);
    });
  },
};
