const net = require('net'),
  colors = require('colors'),
  fs = require('fs'),
  url = require('url'),
  mime = require('./mime'),
  http = require('http'),
  path = require('path'),
  Ip = require('./ip'),
  express = require('express'),
  app = express(),
  curPath = process.cwd()

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
    app.use(express.static(curPath))
    app.listen(port, () => {
      console.log(`开启服务成功 >>>>> url: http://localhost:${port}  ||  http://${Ip.ip}:${port}`.green);
    });
  }
}