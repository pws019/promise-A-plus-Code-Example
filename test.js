var value = {
    value: "value"
  };
var other = {
  other: "other"
};
var sentinel = {
  sentinel: "sentinel"
};
var sentinel2 = {
    sentinel2: "sentinel2"
  };
const dummy = {
  dummy: 'dummy'
};

var promise = Promise.resolve(dummy).then(function () {
    return promise;
});

promise.then(null, function (reason) {
    console.log(reason instanceof TypeError);
});