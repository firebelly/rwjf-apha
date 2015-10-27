/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {
  // clear out monitors & ideas on startup
  Monitor.destroy({ id: { '!': null } }).exec(function(err, updated) {
    if (err) return cb(err);
    console.log('Monitors cleared...');
    Idea.update({ id: { '!': null }}, { monitor: null }).exec(function(err, updated) {
      if (err) return cb(err);
      console.log('Ideas cleared...');
      sails.sockets.blast('monitor', { verb: 'restarted' });
      cb();
    });
  });
};
