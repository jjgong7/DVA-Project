/*
References used:
“X-Value Mouseover”. Mike Bostock. https://bl.ocks.org/mbostock/3902569.
“Simple graph with filled area in v4”. D3noob. https://bl.ocks.org/d3noob/119a138ef9bd1d8f0a8d57ea72355252.
“Ordinal line chart”. Nikhil S.  https://bl.ocks.org/nsonnad/bbbabe4c3393d4f3bf8db90c32a38fc3.
*/

function weightedQuartiles(vals) {
    // array of arrays where the first two elems are bin low and bin hi, 3rd is weight.
    var totalWeight = vals.map(d => d[2]).reduce((a,b)=>a+b);
    vals = vals.sort((a,b)=>a[0]-b[0]);
    var cumulWeight = 0;
    var results = {}
    for (var i=0; i<vals.length; i++) {
        v = vals[i];
        if (cumulWeight <= .25*totalWeight && .25*totalWeight <= cumulWeight+v[2])
            results["p25"] = v[0] + (.25*totalWeight - cumulWeight)*(v[1]-v[0])/v[2];
        if (cumulWeight <= .50*totalWeight && .50*totalWeight <= cumulWeight+v[2])
            results["p50"] = v[0] + (.50*totalWeight - cumulWeight)*(v[1]-v[0])/v[2];
        if (cumulWeight <= .75*totalWeight && .75*totalWeight <= cumulWeight+v[2])
            results["p75"] = v[0] + (.75*totalWeight - cumulWeight)*(v[1]-v[0])/v[2];

        cumulWeight += v[2];
    }
    return results;
}

function createEarnLineData(dat, ages, binWidth) {
    d = [];
    for(i=0; i<ages.length; i++) {
        pcts = weightedQuartiles(dat.filter(f=>f.age==ages[i]).map(d => [d.x, d.x+binWidth, d.y]));
        d.push({"Age_Range": ages[i], "Wage_25": pcts["p25"], "Wage_50":pcts["p50"], "Wage_75": pcts["p75"]});
    }
    return d;
}

function drawEarnLine(elemId, dat) {

    //Delete earn line first
    d3.select("#"+elemId).selectAll("svg").remove()

    //Dimensions for Line Chart
    var margin1 = {top: 50, right: 50, bottom: 50, left: 50},
      width1 = 360 - margin1.left - margin1.right,
      height1 = 260 - margin1.top - margin1.bottom;

    //Add svg1 for the Line Chart to canvas
    var svg1 = d3.select("#"+elemId).append("svg")
               .attr("width", width1 + margin1.left + margin1.right)
               .attr("height", height1 + margin1.top + margin1.bottom)
               .append("g")
               .attr("transform","translate(" + margin1.left + "," + margin1.top + ")");

    var x1 = d3.scale.ordinal().rangePoints([0,width1], .5);
    var y1 = d3.scale.linear().range([height1,0]).nice();

    var formatWage = d3.format(",.0f");

    //Line chart colors:  75%         50%        25%
    var area_colors = ["#3F99E4", "#DC4143", "#72BA51"];

    //Minimum length for wage range to display
    var min_display = 4;

    //Array for the age ranges
    var ageRanges = ["25-34", "35-44", "45-54", "55-64", "65+"];

    var data = createEarnLineData(dat["bins"], ageRanges, dat["bin_width"]);
    var wages = data.map(d => [d.Wage_25, d.Wage_50, d.Wage_75]).reduce((a,b)=>a.concat(b));

    //Set the domains for x and y scale
    x1.domain(ageRanges);

    y1.domain([d3.min(wages), d3.max(wages)]).nice();

    //Define the axes
    var xAxis1 = d3.svg.axis().scale(x1).orient("bottom");

    var yAxis1 = d3.svg.axis().scale(y1).orient("left").ticks(8);

    //Add x-axis for line chart
    svg1.append("g")
      .attr("class", "x1 axis")
      .attr("transform", "translate(0," + height1 + ")")
      .call(xAxis1)
      .append("text")
          .attr("x", width1)
          .attr("y", margin1.bottom/1.5)
          .style("text-anchor", "end")           
          .style("font-size", "12px")
          .text("Age Range");

    //Add y-axis for line chart
    svg1.append("g")
      .attr("class", "y1 axis")
      .attr("transform", "translate(" + 0 + ",0)")
      .call(yAxis1)
      .append("text")
          .attr("x", -10)
          .attr("y", -15)
          .style("text-anchor", "end")                
          .style("font-size", "12px")
          .text("Wage");

    //If not enough data for line chart, where less than min_display values for each age range. Don't display linechart
    if (false) {
        svg1.selectAll(".no_data_linechart_rect").remove();
        svg1.selectAll(".no_data_linechart_text").remove();


        svg1.append("rect")
         .attr("class", "no_data_linechart_rect")
         .attr("width", width1*.8)
         .attr("height", height1*.5)
         .attr("transform", "translate(" + width1/8 + "," + height1/3 + ")")
        svg1.append("text")
          .attr("class", "no_data_linechart_text")
          .attr("x", width1/3.2)
          .attr("y", height1*.6)
          .text("Not enough data");
    }
    else {
        //If enough data to generate linechart:
        //Create line
        var line_25 = d3.svg.line()
                         .interpolate("cardinal")
                         .x(function(d) {
                            return x1(d.Age_Range);})
                         .y(function(d) {
                            return y1(d.Wage_25);});

        var line_50 = d3.svg.line()
                         .interpolate("cardinal")
                         .x(function(d) {
                            return x1(d.Age_Range);})
                         .y(function(d) {
                            return y1(d.Wage_50);});

        var line_75 = d3.svg.line()
                         .interpolate("cardinal")
                         .x(function(d) {
                            return x1(d.Age_Range);})
                         .y(function(d) {
                            return y1(d.Wage_75);});

        //Draw the line
        svg1.append("path")
            .attr("class", "line lower")
            .attr("d", line_25(data))
            .attr("stroke", area_colors[0]);

        svg1.append("path")
            .attr("class", "line mid")
            .attr("d", line_50(data))
            .attr("stroke", area_colors[1]);

        svg1.append("path")
            .attr("class", "line upper")
            .attr("d", line_75(data))
            .attr("stroke", area_colors[2]);

        //Append the circles
        svg1.selectAll(".dot_25")
             .data(data)
            .enter().append("circle")
             .attr("class", "dot")
             .attr("cx", function(d) { return x1(d.Age_Range)})
             .attr("cy", function(d) { return y1(d.Wage_25)})
             .attr("r", 3);

        svg1.selectAll(".dot_50")
             .data(data)
            .enter().append("circle")
             .attr("class", "dot")
             .attr("cx", function(d) { return x1(d.Age_Range)})
             .attr("cy", function(d) { return y1(d.Wage_50)})
             .attr("r", 3);

        svg1.selectAll(".dot_75")
             .data(data)
            .enter().append("circle")
             .attr("class", "dot")
             .attr("cx", function(d) { return x1(d.Age_Range)})
             .attr("cy", function(d) { return y1(d.Wage_75)})
             .attr("r", 3);


        //Create the areas 75%-50% and 50%-25% to fill with color
        var midArea = d3.svg.area()
                .interpolate("cardinal")
                .x (function (d) { return x1(d.Age_Range) })
                .y0(function (d) { return y1(d.Wage_25+500)})
                .y1(function (d) { return y1(d.Wage_50); });

        var upperArea = d3.svg.area()
                .interpolate("cardinal")
                .x (function (d) { return x1(d.Age_Range) })
                .y0(function (d) { return y1(d.Wage_50+500)})
                .y1(function (d) { return y1(d.Wage_75); });

        //Fill area under 75%-50% and 50%-25%
        svg1.datum(data);

        svg1.append("path")
            .attr("class", "area mid")
            .attr("d", midArea)
            .attr("fill", area_colors[0]);

        svg1.append("path")
            .attr("class", "area upper")
            .attr("d", upperArea)
            .attr("fill", area_colors[2]);


        //Add legends for line chart
        //75th percentile
        svg1.append("circle")
            .attr("r", 4)
            .attr("transform", "translate(" + (15) + "," + (-margin1.top*.4) + ")")
            .attr("fill", area_colors[2])
            .style("stroke", area_colors[2]);  

        svg1.append("text")
            .attr("class", "linechart_legend")
            .attr("transform", "translate(" + (22) + "," + (-margin1.top*.4+3) + ")")
            .text("75th percentile");

        //50th percentile
        svg1.append("circle")
            .attr("r", 4)
            .attr("transform", "translate(" + (105) + "," + (-margin1.top*.4) + ")")
            .attr("fill", area_colors[1])
            .style("stroke", area_colors[1]);

        svg1.append("text")
            .attr("class", "linechart_legend")
            .attr("transform", "translate(" + (112) + "," + (-margin1.top*.4+3) + ")")
            .text("50th percentile");

        //25th percentile
        svg1.append("circle")
            .attr("r", 4)
            .attr("transform", "translate(" + (195) + "," + (-margin1.top*.4) + ")")
            .attr("fill", area_colors[0])
            .style("stroke", area_colors[0]);    

        svg1.append("text")
            .attr("class", "linechart_legend")
            .attr("transform", "translate(" + (202) + "," + (-margin1.top*.4+3) + ")")
            .text("25th percentile");

        //////////////////// Mouseover Line Chart /////////////////

        //Create mouseover trackers
        //Append circle and text once it enters certain area range 

        //75th percentile
        var focus = svg1.append("g")
                 .attr("class", "focus")
                 .style("display", "none");

            focus.append("circle")
                 .attr("r", 3);

            focus.append("text")
                 .attr("x", 9)
                 .attr("dy", ".1em");

        //50th percentile
        var focus1 = svg1.append("g")
                 .attr("class", "focus")
                 .style("display", "none");

            focus1.append("circle")
                  .attr("r", 3);

            focus1.append("text")
                  .attr("x", 9)
                  .attr("dy", ".1em");

        //25th percentile
        var focus2 = svg1.append("g")
                  .attr("class", "focus")
                  .style("display", "none");

        focus2.append("circle")
              .attr("r", 3);

        focus2.append("text")
              .attr("x", 9)
              .attr("dy", ".1em");

        //Range for mouseover hover. If mouse enters range, then it will run the mousemove function below:
        svg1.append("rect")
          .attr("class", "overlay")
          .attr("width", width1)
          .attr("height", height1)
          .on("mouseover.line", function() { 
            focus.style("display", null);
            focus1.style("display", null); 
            focus2.style("display", null); 
          })
          .on("mouseout.line", function() { 
            focus.style("display", "none"); 
            focus1.style("display", "none");
            focus2.style("display", "none");
          })
          .on("mousemove.line", mousemove);

        function mousemove() {
            //selects x-axis mouse position 
            var x0 = d3.mouse(this)[0];
            //range of x positions
            var leftEdges = x1.range();
            //Width of the RangePoints
            var widthLen = (leftEdges[4]-leftEdges[0])/data.length;
            //console.log(leftEdges); //gives location x for the svg1 canvas
            //Indicates which range the mouse is moved in and j becomes the index of the Age_Range. For ex. if mouse over x in x1=40 it would be in the range of 25-34. Mouseover terates until it finds x that's bigger than the ageRanges.
            var j;
            for(j=0; x0 > (leftEdges[j] + widthLen/2); j++) {}
            //console.log("Clicked on " + x1.domain()[j]);
            focus.attr("transform", "translate(" + x1(data[j]["Age_Range"]) + "," + y1(data[j]["Wage_75"]) + ")");
            focus.select("text").text(formatWage(data[j]["Wage_75"]));
            focus1.attr("transform", "translate(" + x1(data[j]["Age_Range"]) + "," + y1(data[j]["Wage_50"]) + ")");
            focus1.select("text").text(formatWage(data[j]["Wage_50"]));
            focus2.attr("transform", "translate(" + x1(data[j]["Age_Range"]) + "," + y1(data[j]["Wage_25"]) + ")");
            focus2.select("text").text(formatWage(data[j]["Wage_25"]));
        }
    }
}