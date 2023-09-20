
let w = 800 ;
let h = 450;
let pieW = 225;
let pieH = 225;
let pieR = Math.min(pieW, pieH) / 2;

let zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

function zoomed() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
    d3.select(this).classed("dragging", false);
}

let svg = d3.select("#map-chart").append("svg")
    .attr("width", w )
    .attr("height", h )
    .append("g")
    .call(zoom);

let color = d3.scale.log()
    .range(['#cbefbd', '#9ad154', '#70a894', '#4f788a', '#344484', '#000080']);

let projection = d3.geo.mercator()
    .scale(2200)
    .translate([w - 1760, h + 1405]);

let path = d3.geo.path()
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
                .append("path")
                .attr("d", path)
                .attr("class", "province")
                .attr("id", (trdata) => trdata.properties.ad)
                .style("stroke", "#f1f1f1");

        map.style("fill", (trdata) => {
            const value = trdata.properties.population;
            return value ? color(value) : "#808080";
        });

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

            // console.log(trdata.properties.universities)
            const universitiesInfo = trdata.properties.universities;
            
            if (universitiesInfo !== undefined) {
                // Create a list of universities
                const universitiesList = d3.select("#university")
                    .append("ul")
                    .selectAll("li")
                    .data(Object.keys(universitiesInfo))
                    .enter()
                    .append("li")
                    .text(function(university) {
                        return `${university}: ${universitiesInfo[university]}`;
                    });
            } else {
                // d3.select("#university").text("Universities: No data available");
            }
        });

        map.on("mouseout", function() {
            d3.select("#tooltip").classed("hidden", true);

            d3.select("#university ul").remove();
        });

        // map.on("click", function(d) {
        //     d3.select("#stats-name")
        //         .transition()
        //         .duration(500)
        //         .style("transform", "scale(1.1,1.1)")
        //         .text(d.properties.ad);
        // });
    });
});