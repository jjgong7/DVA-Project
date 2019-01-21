/*
References used:
“Choropleth”. Mike Bostock.  https://bl.ocks.org/mbostock/4060606.
*/

/*
 TODO:
  - Color map by a major/career (or group's?) median earnings TIMES the Coli index, not just the index.
  - Separate map setup from map data update. (Use D3 enter()/update pattern)
 */
function createColiMap (elemId, us_geojson, coli){

    //Dimensions for the Choropleth
	var margin2 = {top: 20, right: 20, bottom: 20, left: 20},
	    width2 = 1100 - margin2.left - margin2.right,
	    height2 = 600 - margin2.top - margin2.bottom;

	//Ad svg to canvas
	var svg2 = d3.select("#"+elemId).append("svg")
	            .attr("width", width2 + margin2.left + margin2.right)
	            .attr("height", height2 + margin2.top + margin2.bottom)
	            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


	var path = d3.geo.path();
  var coli_list = {};

  //Created object of arrays. Keys are state and arrays are different counties with median age. 
  coli.forEach(function (d) {
    coli_list[+d.state_id] = [d.median_adjusted, d.state, d.median_earnings, d.weight, d.projection];
  });

  var fmt = d3.format("$,.0f");
  var fmtPercent = d3.format(",.1%")
  var fmtComma = d3.format(",d")

  //Create d3 tooltip
  var tip1 = d3.tip()
    .attr("class", "tooltip")
    .html(function(d) {
       info = coli_list[+d.id]
       var s = (info === undefined || info[0] == null) ? "[Insufficient Data]" : 
        "State: " + info[1] + "<br />" +
        "CoLI-Adjusted Median Wage: " + (info[0] == null ? "[Insufficient Data]" : fmt(info[0])) + "<br />" +
        "Unadjusted Median Wage: " + (info[2] == null ? "[Insufficient Data]" : fmt(info[2])) + "<br />" + 
        "Workers: " + fmtComma(info[3]) + "<br />" +
        "Growth Projection: " + (info[4] == null? "[Insufficient Data]" : fmtPercent(info[4]));
       return s;
    })
    .offset([0,0]);  //Offset the tooltip relative to calculated position [top, left]

  //Call tiptool on svg
  svg2.call(tip1);

  var wages = Object.entries(coli_list).map(c=>c[1][0]).filter(f=>f != null);
  //On threshold scale, first color is from NaN to 0, so we only need 8 to create colors for our legend
  var colors = ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"];
 //Threshold scale, with domain from 85.1 to 188.3, and range for 9 colors
  var color = d3.scale.quantile()
    .domain(wages)
    .range(colors);

//Add the color values for states based on median earnings and also tiptool
  svg2.append("g")
     .attr("class", "states")
     .selectAll("path")
     .data(topojson.feature(us_geojson, us_geojson.objects.states).features)
  .enter().append("path")
     .attr("d", path)
     .style("fill", function(d) {
          return coli_list[+d.id] !== undefined ? color(coli_list[+d.id][0]) : color(0);})
     .on("mouseover", tip1.show)
     .on("mouseout", tip1.hide);

  //Add map of the U.S.
  svg2.append("path")
     .datum(topojson.mesh(us_geojson, us_geojson.objects.states, function(a, b) { return a !==b; }))
     .attr("class", "states")
     .attr("d", path);

  //Set coordinates for the legend and legend size
  var l_x = width2 - width2/5,
      l_y = height2/2.8 + margin2.top,
      l_size = 20;

  //Append legend in svg
  var legend = svg2.append("g")
                  .attr("class", "legend");

  //Append legend color boxes
  var legend_box = legend.selectAll(".legend")
                  .data(colors)
                 .enter().append("rect")
                  .attr("x", l_x)
                  .attr("y", function(d, i){ return l_y + (i * l_size);})
                  .attr("width", l_size)
                  .attr("height", l_size)
                  .style("fill", function(d) { return d;})
                  .style("stroke", "black")
                  .style("stroke-width", 0.75);

  //Append legend text
  var legend_text = legend.selectAll("text").data([d3.min(wages)].concat(color.quantiles()))
                 .enter().append("text")
                  .attr("x", l_x + l_size+10)
                  .attr("y", function(d, i) { return l_y + 14 + (i * l_size);})
                  .text(function(d) {return fmt(d);});
  var legend_title = legend.append("text")
                  .attr("x", l_x)
                  .attr("y", l_y - 10)
                  .text("Median Earnings");
}