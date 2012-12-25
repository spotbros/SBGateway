var util = require("util");
var dgram = require("dgram");
var udpsrv = dgram.createSocket("udp4");
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var currentRequests = 0;
var requestQueue = new Array();
var udpPort = 7779;
var maxConcurrentRequets = 1000;
var maxWaitingRequests = 5000;
var serverip="127.0.0.1";
var requestTimeoutMS=10000;
http.globalAgent.maxSockets = maxConcurrentRequets;

function json_decode(msg)
{
	try{
		return JSON.parse(msg);
	}
	catch(e)
	{return false;}
}

function json_encode(msg)
{
	try{
		return JSON.stringify(msg);
	}
	catch(e)
	{return false;}
}

function enqueueRequest(request)
{
	if (requestQueue.length < maxWaitingRequests)
	{
		requestQueue.push(request);
		tryDequeueAndCompleteRequest();
	}
	else {
		util.log("currentRequests: "+currentRequests+" QRatio: "+requestQueue.length+"/"+maxWaitingRequests);
		util.log("Just dropped this request");
	}
}
function processRequest(res) 
{
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
				util.log("OK "+chunk);
				if(res.statusCode!=200)
				{}
		});
		res.on('end', function() {
		    currentRequests--;
				tryDequeueAndCompleteRequest();
		  });
		res.on('close',function(){
			currentRequests--;
			tryDequeueAndCompleteRequest();
		});
}
function tryDequeueAndCompleteRequest()
{
	util.log("currentRequests: "+currentRequests+" QRatio: "+requestQueue.length+"/"+maxWaitingRequests);
	if ((currentRequests < maxConcurrentRequets) && (requestQueue.length > 0))
	{
		currentRequests++;
		var request = requestQueue.shift();
		var post_data = querystring.stringify({'params' : json_encode(request['params'])});
		var post_options = {
		      host: request['host'],
		      port: request['port'],
		      path: request['path']+"?"+post_data,
		      method: 'POST',
		      headers: {
		          'Contentent-Type': 'application/json',
		          'Content-Length': post_data.length
		      }
		}
		var post_req = http.request(post_options, processRequest);
		post_req.on('socket', function (socket) {
		    socket.setTimeout(requestTimeoutMS);  
		    socket.on('timeout', function() {
		        post_req.abort();
		    });
		});
		post_req.on('error', function(e) {
			util.log('ERROR with request: ' + e.message);
			currentRequests--;
			tryDequeueAndCompleteRequest();
		});
		post_req.write(post_data);
		post_req.end();
	}
}


udpsrv.on("message", function (msg, rinfo) {
	if((request=json_decode(msg))!=false)
	{
		if(
				request.hasOwnProperty('fromSBCode') &&
				request.hasOwnProperty('toSBCode') &&
				request.hasOwnProperty('host') &&
				request.hasOwnProperty('path') &&
				request.hasOwnProperty('params') &&
				request.hasOwnProperty('port') 				
			)
			{
				util.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
				enqueueRequest(request);
			}
			else
			{
				util.log("Malformed request! this is a valid JSON but some properties are missing "+msg+". Request dropped");				
			}
	}
	else
	{
		util.log("Malformed request! this is not valid JSON "+msg+". Request dropped");
	}
});

udpsrv.on("listening", function () {
var address = udpsrv.address();
util.log("SBGateway::UDP server started on ip/port: " + address.address +"/"+ address.port);
});

udpsrv.bind(udpPort,serverip);


