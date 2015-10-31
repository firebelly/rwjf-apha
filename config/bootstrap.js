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
  // Clear out Monitors on startup
  Idea.update({ id: { '!': null }}, { monitor: null }).exec(function(err, updated) {
    if (err) return cb(err);
    sails.log.info('All Idea monitors cleared on startup...');
    cb();
  });
};
