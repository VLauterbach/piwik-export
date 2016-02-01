var async = require('async');
var fs = require('fs');
var PiwikClient = require('piwik-client');

var config = require('./config.json');

var myClient = new PiwikClient(config.piwikUrl, config.piwikToken, {
	cert: fs.readFileSync(config.certPath),
	key: fs.readFileSync(config.keyPath),
	strictSSL: config.strictSSL
} )

var idSite = config.piwikSiteId;
var agencies = config.agencies;
var period = 'month';

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
		  date: getPiwikDate(),
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
			date: getPiwikDate(),
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
			date: getPiwikDate(),
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
		date: getPiwikDate(),
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
		date: getPiwikDate(),
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
		date: getPiwikDate(),
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
		date: getPiwikDate(),
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
		date: getPiwikDate(),
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
				date: getPiwikDate(),
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
			date: getPiwikDate(),
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
			date: getPiwikDate(),
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
	var output = [];
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
	output.push(line);
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
		output.push(line);
	}

	return output;
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

function sortData(data, sortBy) {
	data.sort(function(obj1, obj2) {
		if(obj1[sortBy] > obj2[sortBy]) {
			return -1;
		} else {
			return 1;
		}
	});

	return data;
}

function getHeaders(data) {
	var headers = [];
	for(var c = 0; c < data.length; c++) {
		for(header in data[c]) {
			if(headers.indexOf(header) == -1) {
				headers.push(header);
			}
		}
	}

	return headers;
}

var date = null;

function getPiwikDate() {
	return date;
}

function setPiwikDate(month, year) {
	if(month < 10) {
		month = "0" + month;
	}
	date = year + '-' + month + "-15"
}


function getPiwikStats(month, year, callback) {
	agencyUniques = {};
	crossAgencyInfo = {};
	applicationLaunches = [];
	listingReviews = [];
	listingReviewViews = [];
	listingsApproved = [];
	applicationFavorites = [];
	agencyUsers = {};

	setPiwikDate(month, year);

	async.parallel(asyncTasks, function() {
		callback({
			applicationLaunches: sortData(applicationLaunches, 'launches'),
			listingReviews: sortData(listingReviews, 'reviews'),
			listingReviewViews: sortData(listingReviewViews, 'views'),
			listingsApproved: listingsApproved,
			applicationFavorites: sortData(applicationFavorites, 'favorites'),
			agencyUsers: agencyUsers
		})
	})
}

exports.getPiwikStats = getPiwikStats
exports.utils = {
	getHeaders: getHeaders
};