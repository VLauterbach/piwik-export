var express = require('express');
var app = express();
var util = require('util');

var piwikStats = require('./piwik-stats');

var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

app.set('view engine', 'ejs')

app.get("/", function(req, res) {
  res.render('statsForm', {months: MONTHS});
});

app.get('/stats', function(req,res) {
  var month = MONTHS.indexOf(req.query.month) + 1

  piwikStats.getPiwikStats(month, req.query.year, function(stats) {
    res.render('stats', {
      stats: stats,
      utils: piwikStats.utils
    });
  });
});

app.listen(3000, function() {
  console.log("Started piwik export app on port 3000");
})
