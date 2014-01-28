'use strict';

var http = require('http'),
  path = require('path'),
  fs = require('fs'),
  Q = require('q');

//把/x.x.x/ => /src/
function getSrcPath(pathStr){
  return pathStr.replace(/\/\d+.\d+.\d+\//, '/src/');
}

//获取文件的磁盘绝对路径
function getFilePath(root, pathStr){
  var filePath;
  pathStr = getSrcPath(pathStr);
  //pathStr => /fi/insure/src/xx.js, 所以要slice(3)
  filePath = pathStr.split('/').slice(3).join(path.sep);
  return path.join(root, filePath);
}

function file(options){
  this.options = options;
}

file.prototype.fetch = function(paths){
  var _self = this,
    fetchList = [];
  if(Array.isArray(paths)){
    paths.forEach(function(p){
      fetchList.push(_self.fetchFile(p));
    });
  }
  else{
    fetchList.push(_self.fetchFile(paths));
  }
  return fetchList;
};
/**
 * 获取单个文件
 * @param  {[type]} pathStr [description]
 * @return {[type]}      [description]
 */
file.prototype.fetchFile = function(pathStr){
  var _self = this,
    deferred = Q.defer();
  //如果存在本地文件，则取本地文件，否则取线上文件
  _self.existsLocalFile(pathStr).then(function(filePath){
    _self._fetchLocalFile(filePath, deferred);
  }, function(){
    _self._fetchRemoteFile(pathStr, deferred);
  });
  return deferred.promise;
};

/**
 * 是否存在本地文件
 * 存在且为文件时，才是可接受的
 * @return {[type]} [description]
 */
file.prototype.existsLocalFile = function(pathStr){
  var _self = this,
    deferred = Q.defer(),
    root = _self.options.root,
    filePath = getFilePath(root, pathStr);
  fs.exists(filePath, function(exists){
    if(exists){
      fs.stat(filePath, function(err, stats){
        if(err){
          deferred.reject(err);
          return;
        }
        if(stats.isFile()){
          deferred.resolve(filePath);
        }
        else{
          deferred.reject();
        }
      })
    }
    else{
      deferred.reject();
    }
  });
  return deferred.promise;
};

//读取本地文件
file.prototype._fetchLocalFile = function (filePath, deferred){
  fs.readFile(filePath, function(err, data){
    if(err){
      deferred.reject(err);
    }
    else{
      //添加文件路径
      var prepend = new Buffer('/**' + filePath + '**/\n'),
        //在文件尾添加一个换行
        append = new Buffer('\n');
      // deferred.resolve(Buffer.concat([prepend, data, append]));
      deferred.resolve(data);
    }
  });
};


//获取远程文件
file.prototype._fetchRemoteFile = function (pathStr, deferred){
  var options = {
    protocol: 'http:',
    hostname: 'a.tbcdn.cn',
    // port: 80,
    pathname: '/g' + pathStr,
    method: 'GET',
    path: '/g' + pathStr
  };

  var req = http.request(options, function(res) {
    var chunks = [];
    // chunks.push(new Buffer('/**' + url.format(options) + '**/\n'));
    res.on('data', function (chunk) {
      chunks.push(chunk);
    });
    res.on('end', function(){
      // chunks.push(new Buffer('\n'));
      var data = Buffer.concat(chunks);
      deferred.resolve(data);
    })
  });

  req.on('error', function(err) {
    deferred.reject(err);
  });
  req.end();
};


module.exports = file;