/*
References used:
“Using d3-tip to add tooltips to a d3 bar chart”. Justin Palmer. http://bl.ocks.org/Caged/6476579.
“Histogram”. Mike Bostock.  https://bl.ocks.org/mbostock/3048450.
“Histogram chart using d3”. Nattawat Nonsung. http://bl.ocks.org/nnattawat/8916402.
*/

function drawEarnHistogram(elemId, data, ageRange='All') {

    var MIN_WEIGHT = 500;
    var binWidth = data["bin_width"];
    d3.select("#"+elemId+" > svg").remove();

    //Dimensions for Wage Histogram
    var margin = {top: 30, right: 20, bottom: 20, left: 30},
        width = 350 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;
    
    //Append svg for the Histogram to canvas
    var svg = d3.select("#"+elemId).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Set range for x and y scales for Histogram
    var y = d3.scale.linear().range([height, 0]);

    var x = d3.scale.linear().range([0, width]);

    //Set formatting for percentage, wages (10,000), and wage tickmarks (10k)
    var formatPercent = d3.format(".0%");

    var formatWagek = d3.format("s");
    var formatWage = d3.format(",.0f");

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom");

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left")
                  .tickFormat(formatPercent);

    //Colors
    
    //Color for colorscale based on bin length for Histogram
    var color = "#2b9712";


    // fake data
    dat = data["bins"].filter(f => f.age == ageRange).sort((a,b)=>a.x-b.x);
    
    // display bins that account for 98% of people
    var totalWeight = dat.map(a => a.y).reduce((a,b)=>a+b);
    var max_display_bin = 0;
    var max_display_index = 0;
    var cumulWeight = 0;
    for (var i=0; i < dat.length; i++) {
        cumulWeight += dat[i].y;
        if (cumulWeight/totalWeight >= 0.98) {
            max_display_bin = dat[i].x;
            max_display_index = i;
            break;
        }
    }
   
    //If there is enough data to display a histogram, then run.
    if (totalWeight >= MIN_WEIGHT) {

    //Find min/max of wages to caclulate domain and bin size
    var bin_size = Math.ceil((max_display_bin+binWidth)/binWidth);
    
    x.domain([0, max_display_bin]).nice();

    //Generate a histogram using uniformly-spaced bins
    var yMax = d3.max(dat, function(d) {return d.y;});
    var yMin = 0;
    yMax = yMax/totalWeight;

    y.domain([0, yMax]).nice();


    xAxis.ticks((bin_size>12 ? bin_size/3 : bin_size), "s");

    //Append axes
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
           .attr("class", "y axis")
           .attr("transform", "translate(" + 0 + ",0)")
           .call(yAxis);

    //Title of histogram
    svg.append("text")
            .attr("x", 0)
            .attr("y", margin.top - 50)
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Wage Histogram");

    //Indicate Age Range
    svg.append("text")
            .attr("class", "subtitle")
            .attr("x", 0)
            .attr("y", margin.top - 35)
            .text("Age Range: " + ageRange); 

    //Indicate Mean Wage
    svg.append("text")
            .attr("class", "subtitle")
            .attr("x", 125)
            .attr("y", margin.top - 35)
            .text("Mean Wage: " + formatWage(data["mean"]));


    //Color scale for bin length        
    var colorScale = d3.scale.linear()
                             .domain([yMin, yMax])
                             .range([d3.rgb(color).brighter(), d3.rgb(color).darker()]);

    //Call d3 tooltip again
    var tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-10, 0])
                .html(function(d) {
                    return "Wage Range: "+ formatWagek(d.x) +"-" + formatWagek(d.x+binWidth) + "</br>" + "Percent: "+(d.y/totalWeight*100).toFixed(2) + "%" + "</br>" + "Count: " + d.y;
                    // return (d.y/wages.length*100).toFixed(2) + "% of workers (" + d.length +
                    //         +") make $"+ formatWagek(d.x) +"-" + formatWagek(d.x+binWidth) + "/year"
                });

    svg.call(tip);

    displayData = dat.filter(f => f.x <= max_display_bin);
    
    //Updates bars
    svg.select(".bar").remove();
    var bar = svg.selectAll(".bar").data(displayData);

    bar.enter().append("g").attr("class", "bar");
    bar.append("rect")
        .attr("class", "bar")
        .attr("data-jm", (d)=>d.y)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y/totalWeight) + ")"; })
        .attr("x", 1)
        .attr("width", (x(binWidth) - x(0)) - 1)
        .attr("height", function(d) {
            return height - y(d.y/totalWeight); 
        })
        .attr("fill", function(d) { return colorScale(d.y/totalWeight) })
        .on('mouseover.tip', tip.show)
        .on('mouseover.color', function(d){
                d3.select(this).attr("fill","grey");
            })
        .on('mouseout.tip', tip.hide)
        .on('mouseout.color', function(d){
                d3.select(this).attr("fill", colorScale(d.y/totalWeight));
            });
    }
    else {
        //If not enough wage data, then display not enough data

        svg.selectAll(".no_data_rect").remove();
        svg.selectAll(".no_data_text").remove();


        svg.append("rect")
           .attr("class", "no_data_rect")
           .attr("width", width*.8)
           .attr("height", height*.5)
           .attr("transform", "translate(" + width/8 + "," + height/3 + ")");

        svg.append("text")
            .attr("class", "no_data_text")
            .attr("x", width/8*1.5)
            .attr("y", height*.6)
            .text("Not enough data for: " + ar);
    }
}