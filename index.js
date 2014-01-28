'use strict';

var url = require('url'),
  mime = require('mime'),
  Q = require('q'),
  File = require('./lib/file');

module.exports = function(options){

  //获取请求文件路径
  function normalizePath(urlStr){
    if(!urlStr){
      return;
    }
    var uri = url.parse(urlStr),
      pathname = uri.pathname,
      query = uri.query || '',
      path = query.split('?')[1],
      paths = [];
    //http://g.tbcdn.cn/??a.js,b.js，这种形式的路径
    if(path){
      // path => a.ja,b.js
      path.split(',').forEach(function(item){
        paths.push(pathname + item);
      })
    }
    //http://g.tbcdn.cn/p/a.js?t=12,这种形式url
    else{
      //pathname => /p/a.js
      paths.push(pathname);
    }

    return paths;
  }


  //获取响应的contentType
  function getContentType(url){
    var result = /\.[^\.]+$/.exec(url) || [],
      ext = result[0] || '';
    //ext => ['.css?t=123']
    //url有可能带有参数.css?t=123,所要去掉后面的这些
    ext = ext.replace(/\?\S*$/, '');
    if(ext){
      return mime.lookup(ext.toLowerCase());
    }
    return '';
  }


  return function(req, res, next) {
    var paths = normalizePath(req.url.replace(/-min./g, '.')),  //去掉-min, 使用源文件
      contentType = getContentType(req.url),
      file = new File(options);
    
    //等所有的内容都完成后，依次添加
    Q.all(file.fetch(paths)).done(function(data){
      res.setHeader("Content-Type", contentType);
      data.forEach(function(item, index){
        res.write(item);
      });
      res.end();
    });
  }


}