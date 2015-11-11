var async = require('async');
var PiwikClient = require('piwik-client');
var myClient = new PiwikClient('https://localhost/piwik/', 'c51d5b51e167a8478a47bd4f1720428a' )

var idSite = 1;
var agencies = ['ORG','AAA','BBB','CCC'];
var period = 'week';
var date = '2015-09-24';

var agencyUniques = {};
var crossAgencyInfo = {};
var applicationLaunches = [];
var listingReviews = [];
var listingReviewViews = [];
var listingsApproved = [];
var applicationFavorites = [];
var agencyUsers = {};

var asyncTasks = [];

agencies.forEach(function(agency) {
	asyncTasks.push(function(callback) {
		myClient.api({
		  method: 'ClientCertificates.getAgencyInformation',
		  idSite: idSite,
		  period: period,
		  date: date,
		  segment: 'agency==' + agency
		}, function(err, responseObject) {
			var agency = responseObject[0]['label'];
			if(agencyUniques[agency] === undefined) {
				agencyUniques[agency] = {};
			}

		    agencyUniques[agency]['uniqueVisitors'] = responseObject[0]['nb_users'];
		    agencyUniques[agency]['visits'] = responseObject[0]['nb_visits'];

		    callback();
		});
	});

	asyncTasks.push(function(callback) {
		myClient.api({
			method: 'ClientCertificates.getNewUsers',
			idSite: idSite,
			period: period,
			date: date,
			segment: 'agency==' + agency
		}, function(err, responseObject) {
			if(agencyUniques[agency] === undefined) {
				agencyUniques[agency] = {};
			}

			if(responseObject.length > 0){
				agencyUniques[agency]['newUsers'] = responseObject[0]['nb_visits'];
			} else {
				agencyUniques[agency]['newUsers'] = 0;
			}

			callback();
		})
	});

	asyncTasks.push(function(callback) {
		myClient.api({
			method:'Events.getCategory',
			idSite: idSite,
			period: period,
			date: date,
			segment: 'eventCategory==Applications;agency!=' + agency + ';eventName==' + agency,
		}, function(err, responseObject) {
			if(crossAgencyInfo[agency] === undefined) {
				crossAgencyInfo[agency] = {};
			}
			if(responseObject.length > 0) {
				crossAgencyInfo[agency]['launches'] = responseObject[0]['nb_events'];
			} else {
				crossAgencyInfo[agency]['launches'] = 0;
			}
			callback();
		})
	});

});

asyncTasks.push(function(callback) {
	myClient.api({
		method:'Events.getAction',
		idSite: idSite,
		period: period,
		date: date,
		segment:'eventCategory==Applications',
		expanded: 1
	}, function(err, responseObject) {
		for(var c = 0; c < responseObject.length; c++) {
			applicationLaunches.push({
				application: responseObject[c].label,
				launches: responseObject[c].nb_events,
				agency: responseObject[c].subtable[0].label
			})
		}

		callback();
	})
});

asyncTasks.push(function(callback) {
	myClient.api({
		method:'Events.getAction',
		idSite: idSite,
		period: period,
		date: date,
		segment:'eventCategory==Listing Review',
		expanded: 1
	}, function(err, responseObject) {
		for(var c = 0; c < responseObject.length; c++) {
			var config = {
				application: responseObject[c].label,
				reviews: responseObject[c].nb_events
			};

			if(responseObject[c].subtable !== undefined) {
				config['agency'] = responseObject[c].subtable[0].label
			}

			listingReviews.push(config)
		}

		callback();
	});
})

asyncTasks.push(function(callback) {
	myClient.api({
		method:'Events.getAction',
		idSite: idSite,
		period: period,
		date: date,
		segment:'eventCategory==Listing Review View',
		expanded: 1
	}, function(err, responseObject) {
		for(var c = 0; c < responseObject.length; c++) {
			var config = {
				application: responseObject[c].label,
				views: responseObject[c].nb_events
			};

			if(responseObject[c].subtable !== undefined) {
				config['agency'] = responseObject[c].subtable[0].label
			}

			listingReviewViews.push(config)
		}

		callback();
	});
});

asyncTasks.push(function(callback) {
	myClient.api({
		method:'Events.getAction',
		idSite: idSite,
		period: period,
		date: '2015-10-12',
		segment:'eventCategory==Listing Approval',
		expanded: 1
	}, function(err, responseObject) {
		for(var c = 0; c < responseObject.length; c++) {
			var config = {
				application: responseObject[c].label
			};

			if(responseObject[c].subtable !== undefined) {
				config['agency'] = responseObject[c].subtable[0].label
			}

			listingsApproved.push(config)
		}

		callback();
	});
});

asyncTasks.push(function(callback) {
	myClient.api({
		method:'Events.getAction',
		idSite: idSite,
		period: period,
		date: '2015-10-12',
		segment:'eventCategory==Favorited Applications',
		expanded: 1
	}, function(err, responseObject) {
		for(var c = 0; c < responseObject.length; c++) {
			var config = {
				application: responseObject[c].label,
				favorites: responseObject[c].nb_events
			};

			if(responseObject[c].subtable !== undefined) {
				config['agency'] = responseObject[c].subtable[0].label
			}

			applicationFavorites.push(config)
		}

		callback();
	});
})

agencies.forEach(function(userAgency) {
	agencies.forEach(function(appAgency) {
		asyncTasks.push(function(callback) {
			myClient.api({
				method: 'ClientCertificates.getAgencyInformation',
				idSite: idSite,
				period: period,
				date: date,
				segment: 'eventCategory==Applications;agency==' + userAgency + ';eventName==' + appAgency
			}, function(err, responseObject) {
				if(agencyUsers[userAgency] === undefined) {
					agencyUsers[userAgency] = {};
				}

				if(responseObject.length > 0) {
					agencyUsers[userAgency][appAgency] = responseObject[0]['nb_users'];
				} else {
					agencyUsers[userAgency][appAgency] = 0;
				}
				callback();
			});
		});
	})

	asyncTasks.push(function(callback) {
		myClient.api({
			method: 'ClientCertificates.getAgencyInformation',
			idSite: idSite,
			period: period,
			date: date,
			segment: 'agency==' + userAgency
		}, function(err, responseObject) {
			if(agencyUsers[userAgency] === undefined) {
				agencyUsers[userAgency] = {};
			}

			if(responseObject.length > 0) {
				agencyUsers[userAgency]['Visitors Total'] = responseObject[0]['nb_users'];
			} else {
				agencyUsers[userAgency]['Visitors Total'] = 0;
			}
			callback();
		});
	});

	asyncTasks.push(function(callback) {
		myClient.api({
			method: 'ClientCertificates.getAgencyInformation',
			idSite: idSite,
			period: period,
			date: date,
			segment: 'eventCategory==Applications;agency==' + userAgency
		}, function(err, responseObject) {
			if(agencyUsers[userAgency] === undefined) {
				agencyUsers[userAgency] = {};
			}

			if(responseObject.length > 0) {
				agencyUsers[userAgency]['Launching Apps'] = responseObject[0]['nb_users'];
			} else {
				agencyUsers[userAgency]['Launching Apps'] = 0;
			}
			callback();
		});
	});
})

function outputSingleTable(data, sortBy) {
	var headers = [];
	for(header in data[0]) {
		headers.push(header);
	}

	var line = '';
	for(var c = 0; c < headers.length; c++) {
		if(c > 0) {
			line += ',';
		}
		line += headers[c];
	}
	console.info(line);

	data.sort(function(obj1, obj2) {
		if(obj1[sortBy] > obj2[sortBy]) {
			return -1;
		} else {
			return 1;
		}
	});

	for(var c = 0; c < data.length; c++) {
		line = '';
		for(var x = 0; x < headers.length; x++) {
			if(x > 0) {
				line += ',';
			}
			line += data[c][headers[x]];
		}
		console.info(line);
	}
}

function output2DTable(data) {
	var headers = ['']; 
	var keys = Object.keys(data);
	for(header in data[keys[0]]) {
		headers.push(header);
	}

	var line = '';
	for(var c = 0; c < headers.length; c++) {
		if(c > 0) {
			line += ',';
		}
		line += headers[c];
	}
	console.info(line);

	for(key in data) {
		line = key;
		for(var c = 1; c < headers.length; c++) {
			line += ','
			line += data[key][headers[c]];
		}
		console.info(line);
	}
}

async.parallel(asyncTasks, function() {
	console.info("-- APPLICATION LAUNCHES --");
	outputSingleTable(applicationLaunches, 'launches');
	console.info();	

	console.info("-- LISTING REVIEWS --");
	outputSingleTable(listingReviews, 'reviews');
	console.info();	

	console.info("-- LISTING REVIEW VIEWS --");
	outputSingleTable(listingReviewViews, 'views');
	console.info();	
	
	console.info("-- LISTINGS APPROVED --");
	outputSingleTable(listingsApproved);
	console.info();	

	console.info("-- APPLICATION FAVORITES --");
	outputSingleTable(applicationFavorites);
	console.info();	
	
	console.info("-- CROSS APP AGENCY USE --")
	output2DTable(agencyUsers);
	console.info();
});
