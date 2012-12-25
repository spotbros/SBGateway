<?php
$server_ip = '127.0.0.1';
$server_port = 7779;
$beat_period = 1000;//00000;
$urls = array();
$urls[]=array("fromSBCode"=>"1111111","toSBCode"=>"AAAAAAA","host"=>"127.0.0.1","path"=>"www.google.com","port"=>80,"params"=>"aaaaaaaaaaaaaaaaa");
$urls[]=array("fromSBCode"=>"2222222","toSBCode"=>"BBBBBBB","host"=>"127.0.0.1","path"=>"www.apple.com","port"=>80,"params"=>"bbbbbbbbbbbbbbbbb");
$urls[]=array("fromSBCode"=>"3333333","toSBCode"=>"CCCCCCC","host"=>"127.0.0.1","path"=>"www.amazon.com","port"=>80,"params"=>"cccccccccccccccc");
$urls[]=array("fromSBCode"=>"3333333","toSBCode"=>"CCCCCCC","host"=>"127.0.0.1","path"=>"www.gizmodo.com","port"=>80,"params"=>"cccccccccccccccc");
print "Sending heartbeat to IP $server_ip, port $server_port\n";
print "press Ctrl-C to stop\n";
if ($socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP)) 
{
	while (1) {
		$message=json_encode($urls[rand(0,count($urls)-1)]);
		socket_sendto($socket, $message, strlen($message), 0, $server_ip, $server_port);
		print "Sent $message\n";
		usleep($beat_period);
	}
} 
else {
	print("can't create socket\n");
}
?>