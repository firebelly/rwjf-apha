/**
* Monitor.js
*
* @description :: RWJF Monitor model
*/

module.exports = {

  attributes: {
    paused: { type: 'boolean', defaultsTo: false },
    socketId: { type: 'string', defaultsTo: '' },
    ping: { type: 'integer', defaultsTo: 0 },
    idea: { 
      model: 'idea',
    }
  },
  findFreshIdea: function(id, cb) {
    Monitor.findOne(id).exec(function (err, thisMonitor) {
      if (err) return cb(err);
      if (!thisMonitor) return cb(new Error('Monitor not found.'));

      Idea.find().where({ published: true, monitor: null }).sort({ num_views: 'ASC' }).limit(1).exec(function foundIdeas(err, ideas) {
        if (err) return cb(err);
        if (ideas.length === 0) {
          sails.log.error('All ideas are being shown');
          return cb();
        }
        var idea = ideas[0];
        idea.num_views++;
        idea.monitor = thisMonitor.id;
        idea.save();
        // save and return monitor
        thisMonitor.idea = idea.id;
        thisMonitor.save(cb);
      });
    });
  }
};
