'use strict';

(function() {

    let data = "";
    let allData = "";
    let svgContainer = "";
    let tooltipSvg = "";
    let div = "";

    // set dimensions and margins of linegraph
    const margin = {
            top: 30,
            right: 50,
            bottom: 50,
            left: 100
        },
        width = 500 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom

    // load data and make scatter plot after window loads
    window.onload = function() {
        // make tooltip
        div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        svgContainer = d3.select('body')
            .append('svg')
            .attr('width', 500)
            .attr('height', 500);

        tooltipSvg = div.append("svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        d3.csv("gapminder.csv")
            .then((data) => makeScatterPlot(data));
    }

    // filter for year 1980
    function filterYear(data) {
        let filteredData = data.filter(function(d, i) {
            return data[i].year === "1980";
        });
        data = filteredData;
        return data;
    }

    // make scatter plot with trend line
    function makeScatterPlot(csvData) {
        data = csvData.filter((data) => {
            return data.fertility != "NA" && data.life_expectancy != "NA"
        });
        allData = data;
        data = filterYear(csvData);

        // get arrays of fertility rate data and life Expectancy data
        let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
        let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

        // find data limits
        let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

        // draw axes and return scaling + mapping functions
        let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

        // plot data as points and add tooltip functionality
        plotData(mapFunctions);

        // draw title and axes labels
        makeLabels();
    }

    // make title and axes labels
    function makeLabels() {
        svgContainer.append('text')
            .attr('x', 135)
            .attr('y', 40)
            .style('font-size', '14pt')
            .text("Fertility vs Life Expectancy (1980)");

        svgContainer.append('text')
            .attr('x', 230)
            .attr('y', 490)
            .style('font-size', '10pt')
            .text('Fertility');

        svgContainer.append('text')
            .attr('transform', 'translate(15, 300)rotate(-90)')
            .style('font-size', '10pt')
            .text('Life Expectancy');
    }

    // plot all the data points on the SVG
    // and add tooltip functionality
    function plotData(map) {
        // get population data as array
        let pop_data = data.map((row) => +row["population"]);
        let pop_limits = d3.extent(pop_data);
        // make size scaling function for population
        let pop_map_func = d3.scaleLinear()
            .domain([pop_limits[0], pop_limits[1]])
            .range([3, 20]);

        // mapping functions
        let xMap = map.x;
        let yMap = map.y;

        // append data to SVG and plot as points
        svgContainer.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', xMap)
            .attr('cy', yMap)
            .attr('r', (d) => pop_map_func(d["population"]))
            .attr('fill', "#4286f4")
            // add tooltip functionality to points
            .on("mouseover", (d) => {
                tooltipSvg.selectAll("*").remove();
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltipGraph(d.country);
                div.style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", (d) => {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        var text = svgContainer.selectAll("text")
            .data(data)
            .enter()
            .append("text");

        // add labels for countries with population over 100M
        var textLabels = text
            .attr("x", xMap)
            // move label 20px to the right of the center of the point
            .attr('transform', 'translate(20,' + 0 + ")")
            .attr("y", yMap)
            .text(function(d, i) {
                if (data[i]["population"] > 100000000) {
                    return data[i]["country"];
                }
            })
            .attr("font-family", "times")
            .attr("font-size", "12px");
    }

    // draw the axes and ticks
    function drawAxes(limits, x, y) {
        // return x value from a row of data
        let xValue = function(d) {
            return +d[x];
        }

        // function to scale x value
        let xScale = d3.scaleLinear()
            .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
            .range([50, 450]);

        // xMap returns a scaled x value from a row of data
        let xMap = function(d) {
            return xScale(xValue(d));
        };

        // plot x-axis at bottom of SVG
        let xAxis = d3.axisBottom().scale(xScale);
        svgContainer.append("g")
            .attr('transform', 'translate(0, 450)')
            .call(xAxis);

        // return y value from a row of data
        let yValue = function(d) {
            return +d[y]
        }

        // function to scale y
        let yScale = d3.scaleLinear()
            .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
            .range([50, 450]);

        // yMap returns a scaled y value from a row of data
        let yMap = function(d) {
            return yScale(yValue(d));
        };

        // plot y-axis at the left of SVG
        let yAxis = d3.axisLeft().scale(yScale);
        svgContainer.append('g')
            .attr('transform', 'translate(50, 0)')
            .call(yAxis);  

        // return mapping and scaling functions
        return {
            x: xMap,
            y: yMap,
            xScale: xScale,
            yScale: yScale
        };
    }

    // find min and max for arrays of x and y
    function findMinMax(x, y) {

        // get min/max x values
        let xMin = d3.min(x);
        let xMax = d3.max(x);

        // get min/max y values
        let yMin = d3.min(y);
        let yMax = d3.max(y);

        // return formatted min/max data as an object
        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        }
    }

    // graph tooltip linechart
    function tooltipGraph(country) {
        let countryData = allData.filter((row) => {
            return row.country == country
        })

        countryData = countryData.filter((data) => {
            return data.population != "NA" && data.year != "NA"
        })

        // set ranges
        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // define line
        var tooltipline = d3.line()
            .x(function(d) {
                return x(d3.timeParse("%Y")(d.year));
            })
            .y(function(d) {
                return y(d.population);
            })

        x.domain(d3.extent(countryData, function(d) {
            return d3.timeParse("%Y")(d.year);
        }));
        y.domain([0, d3.max(countryData, function(d) {
            return Math.max(d.population);
        })]);

        // add line
        tooltipSvg.append("path")
            .datum(countryData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("d", tooltipline);

        // add x axis
        tooltipSvg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // add y axis
        tooltipSvg.append("g")
            .call(d3.axisLeft(y));

        makeTooltipLabels(country);
    }

    // make title and axes labels for tooltip
    function makeTooltipLabels(country) {
        tooltipSvg.append('text')
            .attr('x', 90)
            .attr('y', 0)
            .style('font-size', '10pt')
            .text("Population Over Time For " + country)
            .attr("font-family", "times");

        tooltipSvg.append('text')
            .attr('x', 170)
            .attr('y', 460)
            .style('font-size', '10pt')
            .text('Year')
            .attr("font-family", "times");

        tooltipSvg.append('text')
            .attr('transform', 'translate(-75, 200)rotate(-90)')
            .style('font-size', '10pt')
            .text('Population')
            .attr("font-family", "times");
    }

})();