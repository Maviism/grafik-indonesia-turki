let w = 800 ;
let h = 450;

let zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

function zoomed() {
    svg.attr("transform", d3.event.transform );
}

let svg = d3.select("#map-chart").append("svg")
    .attr("width", w )
    .attr("height", h )
    .append("g")
    .call(zoom);

let color = d3.scaleLog()
    .range(['#cbefbd', '#9ad154', '#70a894', '#4f788a', '#344484', '#000080']);

let projection = d3.geoMercator()
    .scale(2200)
    .translate([w - 1760, h + 1405]);

let path = d3.geoPath()
    .projection(projection);

d3.json("tr-topo-prop.json", function(error, trProp) {
    let trPropFeature = topojson.feature(trProp, trProp.objects.tr).features;
    d3.json("idnstudents22_tr.json", function(data) {
        let dataLookup = {};
        for (let i = 0; i < data.length; i++) {
            let nameProvince = data[i].province.toLowerCase();
            let population = parseFloat(data[i].idn_students);
            let universities = data[i].universities;

            dataLookup[nameProvince] = {
                'population': population,
                'universities': universities
            }
        }

        // Update trPropFeature elements
        for (let j = 0; j < trPropFeature.length; j++) {
            let jsonProvince = trPropFeature[j].properties.ad.toLowerCase();
            let student_data = dataLookup[jsonProvince];
            if (student_data !== undefined) {
                trPropFeature[j].properties.population = student_data.population;
                trPropFeature[j].properties.universities = student_data.universities;
            }
        }

        // Create the map with interactions
        const map = svg.selectAll(".province")
                .data(trPropFeature)
                .enter()
                .append("svg")
                .attr("class", "province")
                .attr("id", (trdata) => trdata.properties.ad)
                .style("stroke", "#f5f5f5");

        map.append("path")
            .attr("d", path)
            .style("fill", (trdata) => {
            const value = trdata.properties.population;
            return value ? color(value) : "#808080";
        });

        map.append("text")
            .text((trdata) => trdata.properties.ad)
            .attr("x", (trdata) => path.centroid(trdata)[0]) // X-coordinate for the text
            .attr("y", (trdata) => path.centroid(trdata)[1]) // Y-coordinate for the text
            .style("text-anchor", "middle") // Center the text horizontally
            .style("font-size", "9px") // Adjust font size as needed
            .style("fill", "black")
            .style("stroke", "none")
            .style("cursor", "pointer");

        map.on("mouseover", function(trdata) {
            const coordinates = d3.mouse(this);
            const x = coordinates[0];
            const y = coordinates[1];
            
            d3.select("#tooltip").classed("hidden", false)
                .style("left", x + 10 + "px")
                .style("top", y + 10 + "px")
                .select("#provinceName")
                .text(trdata.properties.ad)
                
            d3.select("#details").text(trdata.properties.population);

        });

        map.on("mouseout", function() {
            d3.select("#tooltip").classed("hidden", true);
            d3.select("#university ul").remove();
        });

        map.on("click", function(trdata) {
            d3.select("#universities ul").remove();
            d3.select("#province")
                .transition()
                .duration(500)
                .style("transform", "scale(1.1,1.1)")
                .text(trdata.properties.ad);

            d3.select("#students")
                .transition()
                .duration(500)
                .style("transform", "scale(1.1,1.1)")
                .text(trdata.properties.population);
            
            const universitiesInfo = trdata.properties.universities;
            
            if(universitiesInfo !== undefined)
                d3.select("#universities")
                .append("ul")
                .selectAll("li")
                .data(Object.keys(universitiesInfo))
                .enter()
                .append("li")
                .text(function(university) {
                    return `${university.toLowerCase()}: ${universitiesInfo[university]}`;
                });
            else{
                d3.select("#universities")
                .append("ul")
                .text("No data available");
            }
        });
    });
});
  

fetch('rekapyear.json').then(response => response.json()).then(data => {
    var ctx = document.getElementById('myChart').getContext('2d');
    // Extract data for the chart
    var years = data.map(item => item.Year);
    var tValues = data.map(item => item.T);
    var lValues = data.map(item => item.L);
    var pValues = data.map(item => item.K);

    new Chart(ctx, {
    type: 'bar',       // set the default type
    data: {
        labels: years,
        datasets: [{
            label: 'Perempuan',
            data: pValues,
            // borderColor: 'pink',
            backgroundColor: '#FF66FF',
            // borderWidth: 2,
            fill: false,        // default type will be used
        }, 
        {
            label: 'Laki-laki',
            data: lValues,
            // borderColor: 'orange',
            // borderWidth: 2,
            backgroundColor: '#FF6633',
            fill: true,        // default type will be used
        },
        {
        type: 'line',  // override the default type
        label: 'Total',
        data: tValues,
        borderColor: '#0033FF',
        // borderWidth: 2,
        // backgroundColor: '#0033FF',
        fill: false          
            
        }]
    }
    });
});
