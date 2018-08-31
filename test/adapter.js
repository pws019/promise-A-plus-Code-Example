// exports.Promise = {
//   resolve: Promise.resolve,
//   reject: Promise.reject,
//   deferred: Promise.def,
// };


const Promise = require('../index');

exports.resolved = Promise.resolve;
exports.rejected = Promise.reject;
exports.deferred = Promise.defer;
