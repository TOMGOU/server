const net = require('net'),
  colors = require('colors'),
  fs = require('fs'),
  url = require('url'),
  mime = require('./mime'),
  http = require('http'),
  path = require('path');
  Ip = require('./ip')

module.exports = {
  checkPort (port) { // 监测端口
    return new Promise((resolve, reject) => {
      let server = net.createServer().listen(port);
      server.on('listening', () => { // 执行这块代码说明端口未被占用
        server.close();
        resolve(true, port);
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') { // 端口已经被使用
          console.log(`${port}端口已经被占用 !`.underline.red);
          reject();
        }
      });
    });
  },
  createServer (port) { // 创建静态资源服务
    http.createServer((req, res) => {
      let pathName = url.parse(req.url).pathname;  // 获取文件名'/xxx'
      // 对中文进行解码,防止乱码
      pathName = decodeURI(pathName);
      // 重定向: 考虑定义标准的url,以'/'结尾.
      if (path.extname(pathName) === '') {  // 没有扩展名
        if (pathName.charAt(pathName.length - 1) !== '/') {
          pathName += '/';
          let redirect = encodeURI('http://' + req.headers.host + pathName); // 记得encodeURI,不然中文目录报错
          res.writeHead(301, {
            location: redirect
          });
        }
      }
      // 获取资源的绝对路径
      let realFilePath = path.resolve(process.cwd() + pathName);
      // 获取对应文件的文档类型
      let ext = path.extname(pathName); // 获取后缀名,如'.html'
      ext = ext ? ext.slice(1) : 'notKnow';  // 取掉.符号
      let maxAge = 60 * 60 * 24 * 365;
      if (ext.match(/^(gif|png|jpg|js|css)$/ig)) {
        let expires = new Date();
        expires.setTime(expires.getTime() + maxAge * 1000);
        // 设置响应头
        res.setHeader('Expires', expires.toUTCString());
        res.setHeader('Cache-Control', 'max-age=' + maxAge);
      }
      // 定义未知文档的类型MIME
      let contentType = mime[ext] || 'text/plain'; // 后缀名存在就进行映射,不存在就是'text/plain'
      // 判断文件是否存在
      fs.stat(realFilePath, (err, stats) => {
        // err
        if (err) {
          // 也可以定制自己的404页面
          res.writeHead(404, { 'content-type': 'text/html' });
          res.end('<h3>404 Not Found</h3>');
        }
        if (!stats) return;
        // 存在
        if (stats.isFile()) {
          res.writeHead(200, { 'content-type': contentType });
          // 开始读取文件
          let stream = fs.createReadStream(realFilePath);
          // 读取时候错误处理
          stream.on('error', () => {
            res.writeHead(500, { 'content-type': contentType });
          });
          // 返回文件内容
          stream.pipe(res);
        }
        // 路径是目录的情况,列出当前目录下文件
        if (stats.isDirectory()) {
          let html = '<head><meta charset="utf-8"></head>';
          // 读写该目录下的内容 files是文件数组
          fs.readdir(realFilePath, (err, files) => {
            if (err) {
              console.log('目录文件读取失败'.red);
            } else {
              let tpath = '';
              for (let i = 0; i < files.length; i++) {
                tpath = realFilePath.replace(process.cwd(), '');
                // html += '<div><a href=''+ tpath + '/' + files[i] + ''>' + files[i] + '</a></div>';
                html += `<div><a href='${tpath}/${files[i]}'>${files[i]}</a></div>`;
              }
            }
            res.writeHead(200, { 'content-type': 'text/html' });
            res.end(html);
          });
        }
      });
    }).listen(port, () => {
      console.log(`开启服务成功 >>>>> url: http://localhost:${port}  ||  http://${Ip.ip}:${port}`.green);
    });
  }
}