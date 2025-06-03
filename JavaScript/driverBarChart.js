import { getColorMap } from './utils.js';

export function initDriverBarChart({ circuits, drivers, results, colors, races, constructors }) {
    const colorMap = getColorMap(colors);

    // Build lookup maps
    const driverMap = Object.fromEntries(drivers.map(d => [d.driverId, d]));
    const circuitMap = Object.fromEntries(circuits.map(d => [d.circuitId, d]));
    const constructorMap = Object.fromEntries(constructors.map(d => [d.constructorId, d]));

    // Build a mapping from raceId to circuitId
    const raceToCircuit = {};
    races.forEach(race => {
        raceToCircuit[race.raceId] = race.circuitId;
    });

    // Aggregate: circuitId -> driverId -> { points, constructorId }
    const pointsByCircuitDriver = {};
    results.forEach(result => {
        const circuitId = raceToCircuit[result.raceId];
        const driverId = result.driverId;
        const constructorId = result.constructorId;
        const points = +result.points;
        if (!circuitId || !driverId) return;
        if (!pointsByCircuitDriver[circuitId]) pointsByCircuitDriver[circuitId] = {};
        if (!pointsByCircuitDriver[circuitId][driverId]) {
            pointsByCircuitDriver[circuitId][driverId] = { points: 0, constructorId: constructorId };
        }
        pointsByCircuitDriver[circuitId][driverId].points += points;
        // Always use the latest constructorId found for this driver at this circuit
        pointsByCircuitDriver[circuitId][driverId].constructorId = constructorId;
    });

    // Helper to get current quadrant size
    function getChartSize() {
        const parent = document.getElementById('bottom-right');
        const rect = parent.getBoundingClientRect();
        // Fallback if not rendered yet
        return {
            width: rect.width > 0 ? rect.width : 700,
            height: rect.height > 0 ? rect.height : 310
        };
    }

    // Draw/update chart for a given circuit
    function drawChart(circuitId) {
        const { width: chartWidth, height: chartHeight } = getChartSize();
        const margin = { top: 40, right: 30, bottom: 80, left: 80 };
        const innerWidth = chartWidth - margin.left - margin.right;
        const innerHeight = chartHeight - margin.top - margin.bottom;

        // Remove old SVG and create new with right size
        d3.select("#bottom-right").select("svg#driver-chart-svg").remove();

        let svg = d3.select("#bottom-right")
            .append("svg")
            .attr("id", "driver-chart-svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

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
            .attr("font-weight", "bold");

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
            .attr("y", innerHeight + 70)
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("Driver");

        // Defensive: clear chart if circuitId invalid
        if (!pointsByCircuitDriver[circuitId]) {
            title.text("No data for this circuit");
            return;
        }

        const circuit = circuitMap[circuitId];
        const circuitName = circuit ? circuit.name : "Unknown Circuit";

        // Prepare data: top 10 drivers by points
        const data = Object.entries(pointsByCircuitDriver[circuitId])
            .map(([driverId, { points, constructorId }]) => ({
                driverId,
                name: driverMap[driverId]
                    ? `${driverMap[driverId].forename} ${driverMap[driverId].surname}`
                    : driverId,
                points,
                constructorId
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
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-15)")
            .style("text-anchor", "end");

        yAxisG
            .call(d3.axisLeft(y));

        // Bars
        g.selectAll(".bar")
            .data(data, d => d.name)
            .join(
                enter => enter.append("rect")
                    .attr("class", "bar")
                    .attr("x", d => x(d.name))
                    .attr("width", x.bandwidth())
                    .attr("y", innerHeight)
                    .attr("height", 0)
                    .attr("fill", d => colorMap[d.constructorId] || "#C83E4D")
                    .call(enter => enter.transition()
                        .duration(800)
                        .attr("y", d => y(d.points))
                        .attr("height", d => innerHeight - y(d.points))
                    ),
                update => update
                    .transition()
                    .duration(800)
                    .attr("x", d => x(d.name))
                    .attr("width", x.bandwidth())
                    .attr("y", d => y(d.points))
                    .attr("height", d => innerHeight - y(d.points))
                    .attr("fill", d => colorMap[d.constructorId] || "#C83E4D"),
                exit => exit
                    .transition()
                    .duration(500)
                    .attr("y", innerHeight)
                    .attr("height", 0)
                    .remove()
            );

        // Labels
        g.selectAll(".label")
            .data(data, d => d.name)
            .join(
                enter => enter.append("text")
                    .attr("class", "label")
                    .attr("x", d => x(d.name) + x.bandwidth() / 2)
                    .attr("y", innerHeight)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#222")
                    .attr("font-size", "14px")
                    .text(d => Math.round(d.points))
                    .call(enter => enter.transition()
                        .duration(800)
                        .attr("y", d => y(d.points) - 5)
                    ),
                update => update
                    .transition()
                    .duration(800)
                    .attr("x", d => x(d.name) + x.bandwidth() / 2)
                    .attr("y", d => y(d.points) - 5)
                    .text(d => Math.round(d.points)),
                exit => exit
                    .transition()
                    .duration(500)
                    .attr("y", innerHeight)
                    .remove()
            );

        // Title
        title.text(`Top Drivers at ${circuitName}`);
    }

    // Expose the update function for external calls
    initDriverBarChart.update = function(circuitId) {
        window.currentDriverCircuitId = circuitId; // for resize
        drawChart(circuitId);
    };
}

// Redraw chart on window resize
window.addEventListener('resize', () => {
    if (initDriverBarChart.update && window.currentDriverCircuitId) {
        initDriverBarChart.update(window.currentDriverCircuitId);
    }
});
