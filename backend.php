<?php

/***************************************************/
/***************** Change hashtags *****************/
/***************************************************/

$hashtag_to_search = "%23eurozonecrisis+OR+%23eurocrisis";





/***************************************************/
/************** Open 'tweets.geojson' **************/
/***************************************************/



$since_id = null;

if (file_exists('./tweets.geojson')) {
	$temp_tweets = file_get_contents('tweets.geojson', true);
	$geojson = json_decode($temp_tweets, true);
	
	$since_id = max(latest_tweet($geojson));
}
else {
	# Build GeoJSON feature collection array
	$geojson = array(
		'type'      => 'FeatureCollection',
    	'features'  => array()
	);
}




/***************************************************/
/*********** Configure search parameters ***********/
/***************************************************/


if ($since_id != null) {
	$API_parameters = '&include_entities=true&result_type=recent&count=100&since_id='.$since_id;
}
else {
	$API_parameters = '&include_entities=true&result_type=recent&count=100';
}
$api_URL = 'https://api.twitter.com/1.1/search/tweets.json?q='.$hashtag_to_search;

$token = '******************************************************';
$headers = array( 
	"Authorization: Bearer $token"
);




/***************************************************/
/************ Do the search on Twitter *************/
/***************************************************/



$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $api_URL.$API_parameters);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, "Eurozone Crisis / mailto:panos.bletsos@gmail.com");
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$data = curl_exec($ch);
$info = curl_getinfo($ch); 
$http_code = $info['http_code'];
curl_close($ch);





/***************************************************/
/*************** Decode the results ****************/
/***************************************************/



$json = json_decode($data, true);

if (!isset($json->errors)) {

	//DO-WHILE LOOP CONTROL
    if (isset($json->search_metadata->next_results)) {
      $API_query = $json->search_metadata->next_results;
      }
    else {
      $API_query = NULL;
      }

    /*//DEBUG
    echo '<pre>';
    print_r($json);
    echo '</pre>';*/

    foreach ($json['statuses'] as $tweet) {
    	$location = $tweet['user']['location'];
    	echo $location."</br>";

    	$coordinates = geocoding(str_replace(' ', '%20', $location));

    	print_r($coordinates);

    	if ($coordinates != -1) {
    		$feature = array(
        		'id' => $tweet['id'],
        		'type' => 'Feature', 
        		'geometry' => array(
            		'type' => 'Point',
           		 	# Pass Longitude and Latitude Columns here
            		'coordinates' => array($coordinates['lng'], $coordinates['lat'])
       			 	),
        		# Pass other attribute columns here
        		'properties' => array(
            		'name' => $tweet['user']['name'],
            		'screen_name' => $tweet['user']['screen_name'],
            		'text' => $tweet['text'],
            		'time' => strtotime($tweet['created_at'])
            	)
        	);
        	array_push($geojson['features'], $feature);
    	}
    }
    

    $geojson_encode = json_encode($geojson);
    $geojson_file = fopen('tweets.geojson', 'w');
    fputs($geojson_file, $geojson_encode);
    fclose($geojson_file);
}// //END error check in response
else { 
    echo "</br> Twitter over capacity problems - !ABORTING!";                  //////////////////
    echo "</br></br> DUMPING TWITTER JSON ----------- <br /> --------------- </br>";
    /*//DEBUG
    echo '<pre>';
    print_r($json);
    echo '</pre>';*/
    
    break; 
}





/***************************************************/
/************** Search for lat and lng *************/
/***************************************************/



function geocoding($place) {
	$api_key = "***********************************";

	$ch = curl_init();

	curl_setopt($ch, CURLOPT_URL, "https://maps.googleapis.com/maps/api/geocode/json?address=".$place."&key=".$api_key);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_USERAGENT, "Eurozone Crisis / mailto:panos.bletsos@gmail.com");
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	$data = curl_exec($ch);
	$info = curl_getinfo($ch); 
	$http_code = $info['http_code'];
	curl_close($ch);

	$json = json_decode($data, true);


	if ($json['status'] != 'OK') {
		return -1;
	}

	$location = array(
		"lat" => $json['results'][0]['geometry']['location']['lat'],
		"lng" => $json['results'][0]['geometry']['location']['lng']
	);

	return $location;
}




/***************************************************/
/***************** Get latest tweet ****************/
/***************************************************/



function latest_tweet($geojson) {
	$ids = array();

	foreach ($geojson['features'] as $feature) {
		array_push($ids, $feature['id']);
	}

	return $ids;
}

?>