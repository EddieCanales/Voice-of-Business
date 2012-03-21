$(function() {
	//setup initial map view
	$('#map,#loading-overlay,#noresults-overlay').height($(window).height() - 80);
	$('#map,#loading-overlay,#noresults-overlay').width($(window).width());

	var myLatlng = new google.maps.LatLng(
		//40.078363, -82.945379
		//39.994263, -83.067208,
		40.9148583, -98.3807433
	);
	var myOptions = {
		zoom: 4,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		maxZoom: 15
	};
	
	var map = new google.maps.Map(document.getElementById("map"), myOptions);

	var markers= [];

	var manta_social_success= function(data, textStatus, xhr) {
		for(var i=0; i<markers.length; i++) {
			markers[i].setVisible(false);
		}
		markers= [];
		if(data.total) {
			$('#noresults-overlay').removeClass('show');
		}
		else {
			$('#noresults-overlay').addClass('show');
		}

		var comps= data.results;

		if(data.LatLngBounds && data.LatLngBounds.sw && data.LatLngBounds.sw.latitude) {
			var bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(data.LatLngBounds.sw.latitude, data.LatLngBounds.sw.longitude),
				new google.maps.LatLng(data.LatLngBounds.ne.latitude, data.LatLngBounds.ne.longitude)
			);
			map.fitBounds(bounds);
		}

		var place_pin= function(comp_i,lat_long) {
			//alert('placing pin for: '+ comp_i);
			var marker= new google.maps.Marker({
				map:map,
				animation: google.maps.Animation.DROP,
				position: lat_long,
				title: comps[comp_i].company_name,
				icon: 'vob-pin.png'
			});
			markers.push(marker);
			var html= '<div><b>' + comps[comp_i].company_name + '</b><br/>' + comps[comp_i].twitter_name + '</div>';
			var infowin= new google.maps.InfoWindow({
				content: '<div class="bubble-wrapper">'+html+'<div class="bubble-loading">listening...</div></div>'
			});
			google.maps.event.addListener(
				marker,
				'click',
				function() {
					(function(idx) {
					 	var success= function(tweets, textStatus, xhr) {
							var html= '';
							html+= '<img style="height:48px;width:48px" src="'+tweets[0].user.profile_image_url+'" />';
							html+= '<div>';
							html+= '<b>' + comps[idx].company_name + '</b>';
							html+= '<br/><iframe allowtransparency="true" frameborder="0" scrolling="no" style="width:300px; height:20px;" src="//platform.twitter.com/widgets/follow_button.html?screen_name='+comps[idx].twitter_name+'"></iframe>';
							html+= '</div>';
							infowin.setContent('<div class="bubble-wrapper">'+html+'</div>');
							if(tweets.length) {
								html+= '<div class="bubble-tweets">';
								for(var i=0; i<tweets.length; i++) {
									html+= '<p class="bubble-tweet">'+tweets[i].text+'<br/><i>'+tweets[i].created_at+'</i></p>';
								}
								html+= '</div>';
							}
							else {
								html+= '<div class="bubble-no-tweets">[no tweets]</div>';
							}
							infowin.setContent('<div class="bubble-wrapper">'+html+'</div>');
						};
						$.ajax({
							data: {
								screen_name: comps[idx].twitter_name,
								count: 2
							},
							url: 'http://api.twitter.com/1/statuses/user_timeline.json',
							jsonp: 'callback',
							success: success,
							error: function(xhr, textStatus, errorThrown) {
								alert('error: '+textStatus);
							},
							dataType: 'jsonp'
						});
					})(comp_i);

					infowin.open(map,marker);
				}
			);
		};

		var place_all_pins= function() {
			for(var i=0; i<comps.length; i++) {
				if(comps[i].latitude && comps[i].longitude) {
					place_pin(i, new google.maps.LatLng(comps[i].latitude,comps[i].longitude));
				}
			}
			$('#loading-overlay').removeClass('show');
		};
		place_all_pins();
	};

	var search_voices= function() {
		$('#noresults-overlay').removeClass('show');
		$('#loading-overlay').addClass('show');
		$.ajax({
			data: {
				"search": $('#search-term').val(),
				"location": $('#location').val(),
				"include_social": 1,
				"filters": "twitter.1",
				"pg_size": 100,
				"distance": 20,
				"sort": "distance"
			},
			url: 'http://api.manta.com/api/radial_search',
			jsonp: 'jsonp_callback',
			success: manta_social_success,
			error: function(xhr, textStatus, errorThrown) {
				alert('error: '+textStatus);
			},
			dataType: 'jsonp'
		});
		return false;
	};

	$('.vob-search-form').submit(search_voices);
});
