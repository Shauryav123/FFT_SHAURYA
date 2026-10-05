const http = require('http');
const fs = require('fs');  
const server = http.createServer((req, res) => {
  fs.readFile('main.htm',(err,data) => {
    if(err){
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  });
});

server.listen(3000);
console.log('Server is running on http://localhost:3000');
