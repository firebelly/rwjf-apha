/**
 * ExportController.js
 *
 * @description :: Server-side logic for exporting data
 */

var json2csv = require('json2csv');
var moment = require('moment');

module.exports = {
  csv: function (req, res) {
    Idea.find().sort({createdAt: 'DESC'}).exec(function foundIdeas (err, ideas) {
      if (err) console.log(err);
      var config = {
        fields : [
          'idea_name',
          'idea_content',
          'action_areas',
          'outcome_areas',
          'first_name',
          'middle',
          'last_name',
          'photo',
          'organization',
          'email',
          'twitter',
          'num_likes',
          'num_views',
        ],
        data: ideas
      };

      json2csv(config, function(err, csv) {
        if (err) console.log(err);
        var filename = "rwjf-" + moment().format("YYYY-MM-DD") + ".csv";
        res.attachment(filename);
        res.end(csv, 'UTF-8');
      });

    });   
  },
  _config: {}
}
