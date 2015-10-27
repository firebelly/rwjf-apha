/**
* Idea.js
*
* @description :: RWJF Idea model
*/

var fs = require('fs-extra');
var conf = sails.config.custom;

module.exports = {

  schema: false,
  
  attributes: {
    idea_name: { type: 'string' },
    idea_content: { type: 'string' },
    action_areas: { type: 'array' },
    outcome_areas: { type: 'array' },
    photo: { type: 'string' },
    no_photo: { type: 'boolean' },
    first_name: { type: 'string' },
    middle: { type: 'string' },
    last_name: { type: 'string' },
    organization: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    published: { type: 'boolean' },
    num_likes: { type: 'integer', defaultsTo: 0 },
    num_views: { type: 'integer', defaultsTo: 0 },
    monitor: { type: 'string', defaultsTo: null }
  },

  // move queue directory of photos to photos/idea.id, recreate /queue for next idea
  afterCreate: function(idea, cb) {
    fs.move(conf.photosDir + '/queue', conf.photosDir + '/' + idea.id, function (err) {
      if (err) cb(err);
      console.log('Moved queue to ' + conf.photosDir + '/' + idea.id + ' OK!');
      fs.mkdir(conf.photosDir + '/queue', function (err) {
        if (err) cb(err);
        console.log('Made dir '+conf.photosDir + '/queue' + ' OK!');
      });
    });
    cb();
  },
  afterDestroy: function(destroyedRecords, cb) {
    _.each(destroyedRecords, function(record) {
      fs.remove(conf.photosDir + '/' + record.id, function (err) {
        if (err) cb(err);
      });
    });
    cb();
  },
  afterValidate: function(values, cb) {
    // console.log('afterValidate', values);
    if (values.first_name) {
      values.full_name = [values.first_name, values.middle, values.last_name].join(' ');
    }
    if (values.photo) {
      values.photo_url = conf.photosBaseURL + '/' + values.id + '/' + values.photo;
    } else if (values.no_photo) {
      values.photo_url = '/images/no-photo.png';
    }
    cb();
  }

};
