function Promise(callback) {
  this.state = 'pending';
  this.value;

  const noop = () => {};

  this.onPendingPromise = [];

  callback && callback.bind(this)(this.resolve.bind(this),this.reject.bind(this));

  return {
    __myPromise: true,
    then: this.then.bind(this),
    resolve: this.resolve,
    _resolve: this._resolve.bind(this),
    reject: this.reject.bind(this),
  }
}

Promise.prototype.resolve = function(v) {
  run(this, v)
}

// hack，一开始这个方法是resolve，
// 后来发现，resolve进去的值本身也需要解析，所以将方法改名为_resolve，
// 该方法仅用来当值解析完成值后，设置当前promsie的状态以及
// 解析该方法后面的promise
Promise.prototype._resolve = function(v) {
  if(this.state !== 'pending') return;
  const that = this;
  this.state = 'fulfilled'
  this.value = v;
  setTimeout(() => {
    this.onPendingPromise.forEach(item => {
      const promise = item.promise;
      let ret;
      try {
        if(typeof item.fufilledCallBack === 'function') {
          ret = item.fufilledCallBack(v);
          run(promise, ret);
          return;
        } else {
          promise._resolve(that.value);
        }
      } catch(err) {
        promise.reject(err);
      }
    })
  }, 0);
}
Promise.prototype.reject = function(v) {
  if(this.state !== 'pending') return;
  const that = this;
  this.state = 'rejected'
  this.value = v;
  setTimeout(() => {
    this.onPendingPromise.forEach(item => {
      const promise = item.promise;
      let ret;
      try {
        if(typeof item.rejectedCallBack === 'function') {
          ret = item.rejectedCallBack(that.value);
          run(promise, ret);
          return
        } else {
          promise.reject(v)
        }
      } catch(err) {
        promise.reject(err);
      }
    })
  }, 0);
  
}

// promise为Pending状态时候，要记录该promise的{
//   onFulfilledCallbacks,
//   onRejectedCallbacks,
// }
Promise.prototype.then = function(onFulfilled, onRejected) {
  const that = this;
  if(this.state === 'pending') {
    // 成功
    const promise = new Promise();
    that.onPendingPromise.push({promise, fufilledCallBack: onFulfilled, rejectedCallBack: onRejected});
    return promise;
  } else if(this.state === 'fulfilled'){
    let promise = new Promise();
    if(onFulfilled && typeof onFulfilled === 'function') {
      setTimeout(() => {
        let ret;
        try {
          ret = onFulfilled(that.value)
          promise.resolve(ret);
        } catch(err) {
          promise.reject(err);
        }
      }, 0);
    } else {
      promise.resolve(that.value);
    }
    return promise;
  } else if (this.state === 'rejected') {
    let promise = new Promise();
    if(onRejected && typeof onRejected === 'function') {
      setTimeout(() => {
        let ret;
        try {
          ret = onRejected(that.value)
          promise.resolve(ret);
        } catch(err) {
          promise.reject(err);
        }
      }, 0);
    } else {
      promise.reject(that.value);
    }
    return promise;
  }
}

Promise.resolve = function(v) {
  const pro = new Promise()
  run(pro, v);
  return pro;
}

Promise.reject = function(v) {
  return new Promise(function(ok, error) {
    error(v)
  })
}

Promise.defer = function() {
  const promise = new Promise();
  return {
    __myPromise: true,
    then: promise.then,
    resolve: promise.resolve,
    _resolve: promise._resolve,
    reject: promise.reject,
    promise: promise,
  }
}

// 这里利用了鸭式编程的思想，
// 即看起来像鸭子的东西就当做是鸭子
Promise.isPromise = function(x) {
  // typeof null === 'object'，这里是对下方条件的一个hack
  if(x === null) return;
  if(typeof x !== 'object' && typeof x!=='function') return;
  return  x.__myPromise
}

// 这是解析一个promise的重要的过程
// 即规范中的 [[Resolve]](promise, x)
function run(promise, x) {
  //如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
  if(promise === x) {
    promise.reject(new TypeError('类型错误'));
    return;
  }
  //如果 x 是一个promise, 采用其状态 [3.4]:
  if(Promise.isPromise(x)) {
    x.then(function(v) {
      promise._resolve(v);
    }, function(v) {
      promise.reject(v)
    })
    return;
  }
  //如果x是一个对象或一个函数：
  if(x!== null &&typeof x === 'object' || typeof x ==='function') {
    let then;
    let flag = false; //是否已经被调用
    try {
      then = x.then;
      if(typeof then === 'function') {
        
        then.call(x, function(y) {
          if(flag) return;
          flag = true;
          run(promise, y);
        }, function(r) {
          if(flag) return;
          flag = true;
          promise.reject(r)
        })
        return;
      }
    } catch(err) {
      if(flag) return;
      promise.reject(err);
    }
  }
  promise._resolve(x);
}

// 这里是支持nodeJs的方法，
// 主要是为了跑测试用例导出的接口
try {
  module.exports = {
    resolve: Promise.resolve,
    reject: Promise.reject,
    defer: Promise.defer,
  };
} catch(err) {
  console.log('---');
}
  

