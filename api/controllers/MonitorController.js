/**
 * MonitorController
 *
 * @description :: Server-side logic for managing monitors
 */

module.exports = {

  // new monitor page
  new: function(req, res) {
    Monitor.create()
    .exec(function(err, monitor) {
      if (err) {
        return console.log(err);
      }
      else {
        Monitor.publishCreate(monitor);
        res.redirect('/monitor/'+monitor.id);
      }
    });
  },
  refresh: function(req, res, next) {
    Monitor.findOne(req.param('id'), function foundMonitor (err, monitor) {
      if (err) return next(err);
      if (!monitor) return next();
      monitor.refresh();
      Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor (err, refreshed_monitor) {
        if (req.wantsJSON) {
          return res.json(refreshed_monitor);
        }
        else {
          res.redirect('/monitor/'+monitor.id);
        }
      });
    });
  },
  show: function(req, res, next) {
    Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor (err, monitor) {
      if (err) return next(err);
      if (!monitor) return next();
      req.session.monitor = monitor;
      console.log(req.session);
      res.view('monitor/show', {
        monitor: monitor,
        layout: false
      });
    });
  }

  
};
