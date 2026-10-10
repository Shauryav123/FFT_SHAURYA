const http = require('http');
const fs = require('fs');  
const server = http.createServer((req, res) => {
    if(req.url === '/'){
      fs.readFile('home.htm', (err, data) => {
        if(err){
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.write('<h1>404 Not Found</h1>');
          res.end();
        }
        else{
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
          res.end();
        }
      });
    }
    else if(req.url === '/orders'){
      fs.readFile('orders.htm', (err, data) => {
        if(err){
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.write('<h1>404 Not Found</h1>');
          res.end();
        }
        else{
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
          res.end();
        }
      });
    }
    else if(req.url === '/cart'){
      fs.readFile('cart.htm', (err, data) => {
        if(err){
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.write('<h1>404 Not Found</h1>');
          res.end();
        }
        else{
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(data);
          res.end();
        }
      });
    }
});

server.listen(3000);
console.log('Server is running on http://localhost:3000');
