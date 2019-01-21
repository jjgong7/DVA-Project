/*
Citation: http://bl.ocks.org/d3noob/c9b90689c1438f57d649
*/

// Prep data for the sankey
function tidySankeyData(data, majors=[], careers=[]) {
	//set up graph in same style as original example but empty
  	var graph = {"nodes" : [], "links" : []};
  	var nodes = {};
  	data.forEach(function (d) {
			nodes[d.major_id] = { "id": d.major_id, "name": d.major, "nodeType": "m" };
			nodes[d.career_id] = { "id": d.career_id, "name": d.career, "nodeType": "c" };
			graph.links.push(
				{ "source": d.major_id,
	              "target": d.career_id,
	              "value": +d.weight
	            }
	        );
		});

  	// only unique nodes
    graph.nodes = Object.entries(nodes).map(e => e[1]);
    graph.links.forEach(function (d, i) {
    	graph.links[i].source = graph.nodes.findIndex(x => x.id == graph.links[i].source);
    	graph.links[i].target = graph.nodes.findIndex(x => x.id == graph.links[i].target);
    });
    
    return graph;
}

function updateSankey(svg, sankey, graphData) {

	var units = "people";
		path = sankey.link();
	var formatNumber = d3.format(",.0f"),    // zero decimal places
	    format = function(d) { return formatNumber(d) + " " + units; },
	    color = d3.scale.category20();

	sankey
	    .nodes(graphData.nodes)
	    .links(graphData.links)
	    .layout(10);

	d3.select("g#sankeyLinks").remove();
	d3.select("g#sankeyNodes").remove();
	svg.append("g").attr("id", "sankeyLinks");
	svg.append("g").attr("id", "sankeyNodes");

	// add in the links
	var link = d3.select("g#sankeyLinks").selectAll("path.link")
	      .data(graphData.links)
		.enter().append("path")
	      .attr("class", "link")
	      .attr("d", path)
	      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
	      .sort(function(a, b) { return b.dy - a.dy; })
		  .append("title")
	        .text(function(d) {
	    		return d.source.name + " → " + 
	                d.target.name + "\n" + format(d.value); });
	
	// add in the nodes
	var node = d3.select("g#sankeyNodes").selectAll("g.node")
	      .data(graphData.nodes)
		.enter().append("g")
	      .attr("class", "node")
	      .attr("transform", function(d) { 
			  return "translate(" + d.x + "," + d.y + ")"; });
	
	// add the rectangles for the nodes
	node.append("rect")
	    .attr("height", function(d) { return d.dy; })
	    .attr("width", sankey.nodeWidth())
	    .style("fill", function(d) {
	    	console.log(d.id);
	    	if (d.id == "xm" || d.id == "xc") {
	    		return d.color = "#AAAAAA";
	    	}
	    	else if (d.nodeType == "m") {
	    		return d.color = "#970404"
	    	}
	    	else {
	    		return d.color = "#FF9B06";
	    	}
	    })
	    .style("stroke", function(d) { 
			return d3.rgb(d.color).darker(2); })
	    .on("click", function(d, i) {
	    	var selectBox = $("select#" + ((d.nodeType == "c")? "careers" : "majors") + "Select");
	    	var sels = selectBox.val();
	    	if (sels.length == 1 && sels[0] == d.id) {
	    		selectBox.val(null).trigger('change');
	    	}
	    	else if (d.name[0] != '(') {
		    	selectBox.val(d.id).trigger('change');
		    }
	    })
	    .append("title")
	      .text(function(d) {
			  return d.name + "\n" + format(d.value); });

	// add in the title for the nodes
	node.append("text")
	      .attr("x", -6)
	      .attr("y", function(d) { return d.dy / 2; })
	      .attr("width", "50px")
	      .attr("dy", ".35em")
	      .attr("text-anchor", "end")
	      .attr("transform", null)
	      .text(function(d) { return d.name.split(' ').join("\n"); })
	    .filter(function(d) { return d.nodeType == "m"; })
	      .attr("x", 6 + sankey.nodeWidth())
	      .attr("text-anchor", "start");
}

// Sets up the chart
function createSankey(cmData) {
	
	var margin = {top: 10, right: 10, bottom: 10, left: 10},
	    width = 400 - margin.left - margin.right,
	    height = 600 - margin.top - margin.bottom;

	d3.select("#sankeyChart > svg").remove();

	// append the svg canvas to the page
	var svg = d3.select("#sankeyChart").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", 
	          "translate(" + margin.left + "," + margin.top + ")");

	svg.append("g").attr("id", "sankeyLinks");
	svg.append("g").attr("id", "sankeyNodes");

	// Set the sankey diagram properties
	var sankey = d3.sankey()
	    .nodeWidth(10)
	    .nodePadding(5)
	    .size([width, height]);

	var tidyData = tidySankeyData(cmData);
	updateSankey(svg, sankey, tidyData);
}