// barChart.js
import { getColorMap } from './utils.js';

export function initBarChart({ circuits, constructors, results, colors, races }) {
    // Prepare color map for constructors
    const colorMap = getColorMap(colors);

    // Build lookup maps for quick access
    const constructorMap = Object.fromEntries(constructors.map(d => [d.constructorId, d]));
    const circuitMap = Object.fromEntries(circuits.map(d => [d.circuitId, d]));

    // Build a mapping from raceId to circuitId
    const raceToCircuit = {};
    races.forEach(race => {
        raceToCircuit[race.raceId] = race.circuitId;
    });

    // Aggregate points by circuit and constructor
    const pointsByCircuit = {};
    results.forEach(result => {
        const circuitId = raceToCircuit[result.raceId];
        const constructorId = result.constructorId;
        const points = +result.points;
        if (!circuitId) return; // skip if mapping missing
        if (!pointsByCircuit[circuitId]) pointsByCircuit[circuitId] = {};
        if (!pointsByCircuit[circuitId][constructorId]) pointsByCircuit[circuitId][constructorId] = 0;
        pointsByCircuit[circuitId][constructorId] += points;
    });


    // Chart sizing and margins
    const margin = { top: 40, right: 30, bottom: 80, left: 60 };
    let chartWidth = 700, chartHeight = 320;

    // Create SVG if not already present
    let svg = d3.select("#top-right").select("svg#chart-svg");
    if (svg.empty()) {
        svg = d3.select("#top-right")
            .append("svg")
            .attr("id", "chart-svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight);
    }
    svg.selectAll("*").remove(); // Clean for fresh drawing

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    // Axes groups
    const xAxisG = g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${innerHeight})`);
    const yAxisG = g.append("g").attr("class", "y-axis");

    // Title
    const title = g.append("text")
        .attr("class", "chart-title")
        .attr("x", innerWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("font-size", "22px")
        .attr("font-weight", "bold")
        .text("");

    // Y label
    g.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-40},${innerHeight / 2})rotate(-90)`)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Points");

    // X label
    g.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 60)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Constructor");


    // Update function to redraw chart for a given circuit
    function update(circuitId) {
        // Defensive: clear chart if circuitId invalid
        if (!pointsByCircuit[circuitId]) {
            g.selectAll(".bar,.label").remove();
            title.text("No data for this circuit");
            return;
        }

        const circuit = circuitMap[circuitId];
        const circuitName = circuit ? circuit.name : "Unknown Circuit";

        // Prepare data: top 10 constructors by points
        const data = Object.entries(pointsByCircuit[circuitId])
            .map(([constructorId, points]) => ({
                constructorId,
                name: constructorMap[constructorId]?.name || constructorId,
                points
            }))
            .filter(d => d.points > 0)
            .sort((a, b) => d3.descending(a.points, b.points))
            .slice(0, 10);

        // X and Y scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.points) || 1])
            .range([innerHeight, 0]);

        // Axes
        xAxisG
            .transition().duration(500)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-15)")
            .style("text-anchor", "end");

        yAxisG
            .transition().duration(500)
            .call(d3.axisLeft(y));

        // Bars
        const bars = g.selectAll(".bar")
            .data(data, d => d.name);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", innerHeight)
            .attr("height", 0)
            .attr("fill", d => colorMap[d.constructorId] || "#C83E4D")
            .merge(bars)
            .transition()
            .duration(800)
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.points))
            .attr("height", d => innerHeight - y(d.points))
            .attr("fill", d => colorMap[d.constructorId] || "#C83E4D");

        bars.exit()
            .transition()
            .duration(500)
            .attr("y", innerHeight)
            .attr("height", 0)
            .remove();

        // Labels
        const labels = g.selectAll(".label")
            .data(data, d => d.name);

        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.name) + x.bandwidth() / 2)
            .attr("y", innerHeight)
            .attr("text-anchor", "middle")
            .attr("fill", "#222")
            .attr("font-size", "14px")
            .text(d => Math.round(d.points))
            .merge(labels)
            .transition()
            .duration(800)
            .attr("x", d => x(d.name) + x.bandwidth() / 2)
            .attr("y", d => y(d.points) - 5)
            .text(d => Math.round(d.points));

        labels.exit()
            .transition()
            .duration(500)
            .attr("y", innerHeight)
            .remove();

        // Title
        title.text(`Top Constructors at ${circuitName}`);
    }

    // Expose the update function for external calls
    initBarChart.update = update;
}

