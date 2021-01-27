/*
 * Explores recursively a directory and returns all the filepaths and folderpaths in the callback.
 * http://stackoverflow.com/a/5827895/4241030
 */

let filewalker;
module.exports = filewalker = function(dir, done) {
  const fs = require('fs'); const path = require('path'); let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          results.push(file); filewalker(file, function(err, res) {
            results = results.concat(res); if (!--pending) {
              done(null, results);
            }
          });
        } else {
          results.push(file); if (!--pending) done(null, results);
        }
      });
    });
  });
};
