/***************************************************/
/************** Mapbox access token ****************/
/***************************************************/


L.mapbox.accessToken = 'pk.eyJ1IjoibW91a2VzIiwiYSI6Inp5NEdTeXMifQ.SQnMcSCdvZ3HXJByZDRLJg';




/***************************************************/
/******************** Load map *********************/
/***************************************************/


var map = L.mapbox.map('map', 'moukes.m5kkbpf8').setView([24.847, 19.336], 2);

// Check for size change.
setTimeout(function() {
         map.invalidateSize();
         map.setView([24.847, 19.336], 3);
}, 1000);






/***************************************************/
/***************** Create markers ******************/
/***************************************************/


var markers = new L.MarkerClusterGroup();






/***************************************************/
/*************** Name of the months ****************/
/***************************************************/


var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];



/***************************************************/
/**************** Scale the markers ****************/
/***************************************************/


function scaledPoint(feature, latlng) {
    var date = new Date(feature.properties.time * 1000);

    return L.marker(latlng)
    .bindPopup(
        feature.properties.text + '<span class="name user-info">— ' + feature.properties.name + " (@" + feature.properties.screen_name + ")" + '</span> <span class="date">' + monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + "</span>"
    );
}




/***************************************************/
/******************** Load data ********************/
/***************************************************/


d3.json('../tweets.geojson', function(err, data) {
    var tweetsLayer = L.geoJson(data, { pointToLayer: scaledPoint });

    //Place markers on map.
    markers.addLayer(tweetsLayer);
    map.addLayer(markers);

    setCalendar(data);

    /***************************************************/
    /******************* Set brush *********************/
    /***************************************************/

    function setCalendar(data) {
        $("body").on('touchstart', '.calendar-icon', function() {
            //$("#calendar").slideToggle();

            var filter;
            // If the user has selected no brush area, share everything.
            
            filter = function() { return true; }

            var filtered = data.features.filter(filter);
        
            //Remove old markers.
            map.removeLayer(markers);
            //Create new markers.
            markers = new L.MarkerClusterGroup();
            
            //Create new layer with filtered data.
            tweetsLayer = L.geoJson(filtered, { pointToLayer: scaledPoint });

            //Place new markers on map.
            markers.addLayer(tweetsLayer);
            map.addLayer(markers);
            
            //alert("YES");
        });


    }


    /***************************************************/
    /******************* Set brush *********************/
    /***************************************************/


    function setBrush(data) {
        var container = d3.select('#brush'),
            width = container.node().offsetWidth,
            margin = {top: 0, right: 0, bottom: 0, left: 0},
            height = 100;
    
        var timeExtent = d3.extent(data.features, function(d) {
            return new Date(d.properties.time * 1000);
        });

        var svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        var context = svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' +
                margin.left + ',' +
                margin.top + ')');

        //Timeline scale.
        var x = d3.time.scale()
            .range([0, width])
            .domain(timeExtent)
            .clamp(true);

        var brush = d3.svg.brush()
            .x(x)
            .on('brushend', brushend);

        //Create ticks at the bottom of timeline
        context.append("g")
        .attr("class", "x axis ticks")
        .attr("transform", "translate(0," + height / 2 + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .tickFormat(function(d) { return  d.getDate () + " " + monthNames[d.getMonth()]; })
          .ticks(5)
          .tickSize(0)
          .tickPadding(5));

        //Place circles at timeline
        context.selectAll('circle.quake')
            .data(data.features)
            .enter()
            .append('circle')
            .attr('transform', function(d) {
                return 'translate(' + [x(new Date(d.properties.time * 1000)), height / 3] + ')';
            })
            .attr('r', 10)
            .attr('opacity', 0.5)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .attr('fill', '#3B8686');

        context.append('g')
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('rect')
            .attr('y', -6)
            .attr('height', height);




        /***************************************************/
        /***************** brushend event ******************/
        /***************************************************/


        function brushend() {
            var filter;
            // If the user has selected no brush area, share everything.
            if (brush.empty()) {
                filter = function() { return true; }
            } else {
                // Otherwise, restrict features to only things in the brush extent.
                filter = function(feature) {
                    return (feature.properties.time * 1000) >= Math.floor(+brush.extent()[0]) &&
                    (feature.properties.time * 1000) <= Math.ceil((+brush.extent()[1]));
                };
            }
            var filtered = data.features.filter(filter);
        
            //Remove old markers.
            map.removeLayer(markers);
            //Create new markers.
            markers = new L.MarkerClusterGroup();
            
            //Create new layer with filtered data.
            tweetsLayer = L.geoJson(filtered, { pointToLayer: scaledPoint });

            //Place new markers on map.
            markers.addLayer(tweetsLayer);
            map.addLayer(markers);
        }
    }

    $('#calendar').on('tap', ".done", function() {

        var month = $('.header h1').text();

        var selectedDays = new Array;

        $('.selected').each(function(i, obj) {
            var dateString =  new Date($(obj).text() + " " + month);
            selectedDays[i] = dateString.getTime();
        });

        var filter;

        // If the user has selected no date, share everything.
        if (selectedDays[0] == null) {
            //Remove old markers.
            map.removeLayer(markers);

            console.log(selectedDays[0]);

            filter = function() { return true; }

            var filtered = data.features.filter(filter);
        
            //Create new markers.
            markers = new L.MarkerClusterGroup();
            
            //Create new layer with filtered data.
            tweetsLayer = L.geoJson(filtered, { pointToLayer: scaledPoint });

            //Place new markers on map.
            markers.addLayer(tweetsLayer);
            map.addLayer(markers);
        } else {
            //Remove old markers.
            map.removeLayer(markers);

            //Create new markers.
            markers = new L.MarkerClusterGroup();

            //Otherwise, show tweets of the selected date.
            for (var i = 0; i < selectedDays.length; i++) {
                filter = function(feature) {
                    return (feature.properties.time * 1000) >= selectedDays[i] && (feature.properties.time * 1000) <= (selectedDays[i] + 86400000);

                };

                var filtered = data.features.filter(filter);
            
                //Create new layer with filtered data.
                tweetsLayer = L.geoJson(filtered, { pointToLayer: scaledPoint });

                //Place new markers on map.
                markers.addLayer(tweetsLayer);
                map.addLayer(markers);
            }
        }
    });
});
