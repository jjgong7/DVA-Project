/*
MoreApp Class
--------------
An class (and object) to hold the app global state and data
Various click events can go here and then flow
 back to change all the relevant charts.
One exception is that clicking on a Sankey node will change
 the associated autocomplete box. That select box then fires 
 its change event which flows here, then ensures the Sankey is changed.
*/
function MoreApp() {
	this.majors = []; // array of currently selected major IDs (ACS fod1p)
	this.careers = []; // array of currently selected career IDs (ACS soc1p)
	this.earnHistData = [];
	this.stateMapShapes = {};
	
	return this;
}
MoreApp.prototype.stateMapData = function(dat) {
	if (dat !== undefined) {
		this.stateMapShapes = dat;
	}
	else
		return this.stateMapShapes;
}
MoreApp.prototype.majorSelectorChanged = function(selectedMajors) {
	this.majors = selectedMajors;
	this.refreshSankey();
	this.refreshSimilarMajors();
	// TODO: this.refreshMajorEarnings();

};
MoreApp.prototype.careerSelectorChanged = function(selectedCareers) {
	this.careers = selectedCareers;
	this.refreshSankey();
	this.refreshCareerEarningsHistogram("All");
	this.refreshSimilarCareers();
	this.refreshColiMap();
};

MoreApp.prototype.ageFilterChanged = function(selectedAgeFilter) {
	this.age_filter = selectedAgeFilter;
	drawEarnHistogram("careerEarnings", this.earnHistData, ageRange=selectedAgeFilter);
	// TODO: this.refreshCareerEarningsLine();
};

MoreApp.prototype.refreshSankey = function() {
	// get sankey data
	if (this.majors.length > 0 || this.careers.length > 0) {
		sankeyURL = '/sankey?'
		if(this.majors.length > 0)
			sankeyURL += this.majors.map(m => "m="+m).join('&');
		if(this.careers.length > 0)
			sankeyURL += '&' + this.careers.map(c => "c="+c).join('&')

		d3.json(
			sankeyURL,
			function(dat) {
				createSankey(dat);
			}
		);
	}
	else {
		d3.select("div#sankeyChart > svg").remove();
	}
};

MoreApp.prototype.refreshCareerEarningsHistogram = function(ageFilter) {
	// get earnings data
	if (this.careers.length > 0) {
		earnURL = '/binned_earnings?';
		earnURL += this.careers.map(c => "c="+c).join('&');

		$("#careerEarnings").text("Loading...");
		mapp = this;
		d3.json(
			earnURL,
			function(dat){
				//Set global variable for dataset to filter locally
				mapp.earnHistData = dat;
				$("#careerEarnings").text("");
				$("#earnAgeButtons").show();
				drawEarnHistogram("careerEarnings", dat, ageRange='All')
				drawEarnLine("earnLine", dat);
			}
		);
	}
	else {
		d3.select("div#careerEarnings > svg").remove();
		d3.select("div#earnLine > svg").remove();
		$("#earnAgeButtons").hide();
		$("#careerEarnings").text("Select a career to see earnings.");
	}
};

MoreApp.prototype.refreshSimilarMajors = function() {
	// similar majors
	if (this.majors.length > 0) {
		var query = this.majors.map(m=>"m="+m).join('&');
		d3.json(
			'/similar_majors?'+query,
			function(majors) {
				d3.select("div#similarMajors > .card-body > ul").remove();
				var ul = d3.select("div#similarMajors > .card-body")
					.append("ul");
				ul.attr("id", "similarMajorsList")
					.attr("class", "list-inline");
				ul.selectAll("li").data(majors)
					.enter()
					.append("li")
						.attr("class", "list-inline-item")
					.append("a")
						.text((d, i) => d.major)
						.attr("href", "#")
						.on('click', function(m) {
							$("select#majorsSelect").val(m.major_id).trigger('change');
						})
					;
				$("div#similarMajors").show();
			}
		);
	} else {
		$("div#similarMajors").hide();
	}
};

MoreApp.prototype.refreshColiMap = function() {
	d3.select("#coli_map > svg").remove();
	if (this.careers.length > 0) {
		var url = "/state_coli_earn?" + this.careers.map(c => 'c='+c).join('&');
		var mapShapes = this.stateMapData();
		d3.json(
			url,
		    function(coli) {
		    	createColiMap("coli_map", mapShapes, coli);
		    }
		);
		$("#mapRow").show();
	}
	else {
		$("#mapRow").hide();
	}
};

MoreApp.prototype.refreshSimilarCareers = function() {
	// similar careers
	if (this.careers.length > 0) {
		d3.json(
			'/similar_careers?'+this.careers.map(c=>"c="+c).join('&'),
			function(careers) {
				d3.select("div#similarCareers > .card-body > ul").remove();
				var ul = d3.select("div#similarCareers > .card-body")
					.append("ul");
				ul.attr("id", "similarCareersList")
					.attr("class", "list-inline");
				ul.selectAll("li").data(careers)
					.enter()
					.append("li")
						.attr("class", "list-inline-item")
					.append("a")
						.text((d, i) => d.career)
						.attr("href", "#")
						.on('click', function(c) {
							$("select#careersSelect").val(c.career_id).trigger('change');
						})
					;
				$("div#similarCareers").show();
			}
		);
	} else {
		$("div#similarCareers").hide();
	}
}

// This runs after the page is done loading in the browser.
function initApp() {
	$("#earnAgeButtons").hide();
	$("#mapRow").hide();
	// set up app obj
	app = new MoreApp();

	// set up majors autocomplete filter/selector
	d3.json(
		'/majors',
		function(dat) {
			// Collect majors list from backend and bind them to
			// the autocomplete.
			$("select#majorsSelect")
				.select2({
					"placeholder": "find a major",
					"data": dat,
					"maximumSelectionLength": 5,
					"width": "100%"
				})
				.on('change', function(e) {
					var sel = $("select#majorsSelect").select2('data');
					app.majorSelectorChanged(
						sel.map(e => e.id)
					);
				})
				.val(["2102","6107","5200"]).trigger('change'); // TODO: Show random major on page load? (Currently Psychology)
		}
	);
	// set the careers filter, same.
	d3.json(
		'/careers',
		function(dat) {
			// Collect careers list from backend and bind them to
			// the autocomplete.
			$("select#careersSelect")
				.select2({
					"placeholder": "find a career",
					"data": dat,
					"maximumSelectionLength": 5,
					"width": "100%"
				})
				.on('change', function(e) {
					var sel = $("select#careersSelect").select2("data");
					app.careerSelectorChanged(sel.map(e => e.id));
				})
				.val(null).trigger('change');
		}
	);

	d3.json("/static/us.json", function(dat) {
		app.stateMapData(dat);
	});

	$("#earnAgeButtons > button").on('click', function(b) {
		app.ageFilterChanged($(b.target).text());
		return false;
	})
}

function clearCareers() {
	$("select#careersSelect").val(null).trigger('change');
}
function clearMajors() {
	$("select#majorsSelect").val(null).trigger('change');
}

// run it when web page is loaded and ready
$(document).ready(initApp);