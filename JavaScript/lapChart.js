export function initLapChart({ circuits, results, races, drivers }) {
    // --- Build lookup maps ---
    const driverMap = {};
    drivers.forEach(d => {
        driverMap[d.driverId] = { forename: d.forename, surname: d.surname };
    });

    // raceId -> year, circuitId
    const raceIdToYear = {};
    const raceIdToCircuit = {};
    races.forEach(r => {
        raceIdToYear[r.raceId] = +r.year;
        raceIdToCircuit[r.raceId] = r.circuitId;
    });

    // Helper: Convert lap time string to seconds
    function timeToSeconds(timeStr) {
        if (!timeStr || !timeStr.includes(":")) return null;
        const [min, sec] = timeStr.split(":");
        return parseInt(min) * 60 + parseFloat(sec);
    }

    // Helper: Format seconds as mm:ss.sss
    function formatLapTime(sec) {
        if (sec == null || isNaN(sec)) return "N/A";
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        const milliseconds = Math.round((sec - Math.floor(sec)) * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    // --- Prepare fastest lap data: circuitId -> year -> { lap, driverId } ---
    const fastestLapByCircuitYear = {};
    results.forEach(res => {
        const raceId = res.raceId;
        const year = raceIdToYear[raceId];
        const circuitId = raceIdToCircuit[raceId];
        const lapTime = timeToSeconds(res.fastestLapTime);
        const driverId = res.driverId;
        if (!year || !circuitId || !lapTime) return;
        if (!fastestLapByCircuitYear[circuitId]) fastestLapByCircuitYear[circuitId] = {};
        if (
            !fastestLapByCircuitYear[circuitId][year] ||
            lapTime < fastestLapByCircuitYear[circuitId][year].lap
        ) {
            fastestLapByCircuitYear[circuitId][year] = { lap: lapTime, driverId: driverId };
        }
    });

    // --- Margins ---
    const margin = { top: 40, right: 30, bottom: 45, left: 70 };

    // --- Helper to get current container size ---
    function getChartSize() {
        const parent = document.getElementById('fastest-lap-chart');
        const rect = parent.getBoundingClientRect();
        return {
            width: rect.width > 0 ? rect.width : 600,
            height: rect.height > 0 ? rect.height : 280
        };
    }

    // --- Select or create SVG ---
    const svg = d3.select("#fastest-lap-chart");

    // --- Tooltip ---
    const tooltip = d3.select("#tooltip");

    // --- Current circuitId ---
    let currentCircuitId = null;

    // --- Format y axis ticks ---
    function formatYAxisTick(d) {
        const m = Math.floor(d / 60);
        const s = (d % 60).toFixed(3).padStart(6, "0");
        return `${m}:${s}`;
    }

    // --- Draw or update chart ---
    function drawChart(circuitId, selectedYear = 2000) {
        currentCircuitId = circuitId;
        const { width: svgWidth, height: svgHeight } = getChartSize();
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // Set SVG size
        svg.attr("width", svgWidth).attr("height", svgHeight);

        // Clear previous content
        svg.selectAll("*").remove();

        // Create group element
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Title
        g.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("font-weight", "bold")
            .text("Lap times by year");

        // Axes groups
        const xAxisG = g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
        const yAxisG = g.append("g").attr("class", "y-axis");

        // No data text
        const noDataText = g.append("text")
            .attr("class", "no-data-text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("fill", "#fff")
            .style("display", "none")
            .text("No lap data");

        // Prepare data
        const data = [];
        for (let year = 2000; year <= 2024; year++) {
            if (fastestLapByCircuitYear[circuitId] && fastestLapByCircuitYear[circuitId][year]) {
                data.push({
                    year,
                    lap: fastestLapByCircuitYear[circuitId][year].lap,
                    driverId: fastestLapByCircuitYear[circuitId][year].driverId
                });
            }
        }

        if (data.length === 0) {
            g.selectAll("path").remove();
            g.selectAll("circle").remove();
            yAxisG.call(d3.axisLeft().ticks(5));
            noDataText.style("display", null);
            return;
        } else {
            noDataText.style("display", "none");
        }

        // Scales
        const x = d3.scaleLinear().domain([2000, 2024]).range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        y.domain([
            d3.min(data, d => d.lap) * 0.98,
            d3.max(data, d => d.lap) * 1.02
        ]);

        // Axes
        xAxisG.call(d3.axisBottom(x).tickFormat(d3.format("d")));
        yAxisG.call(d3.axisLeft(y).tickFormat(formatYAxisTick));

        // Line generator
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.lap));

        // Path for line
        const path = g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "var(--am-green)")
            .attr("stroke-width", 4)
            .attr("d", line);

        // Marker for selected year
        const marker = g.append("circle")
            .attr("r", 6)
            .attr("fill", "var(--volcano-red)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("pointer-events", "all");

        // Update marker position
        const yearData = data.find(d => d.year === selectedYear);
        if (yearData) {
            marker
                .datum(yearData)
                .attr("cx", x(yearData.year))
                .attr("cy", y(yearData.lap))
                .style("display", null);
        } else {
            marker.style("display", "none");
        }

        // Tooltip events
        marker
            .on("mouseover", function(event, d) {
                if (!d) return;
                const driverId = d.driverId;
                const lapTime = d.lap;
                const driver = driverMap[driverId];
                const name = driver ? `${driver.forename} ${driver.surname}` : "Unknown";
                const formattedLap = formatLapTime(lapTime);
                tooltip
                    .style("display", "block")
                    .html(`<strong>Fastest Lap by:</strong><br>${name}<br><strong>Lap Time:</strong> ${formattedLap}`);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });
    }

    // --- Expose update function ---
    initLapChart.update = drawChart;

    // --- Wire up slider if present ---
    const slider = document.getElementById("year-slider");
    const yearValue = document.getElementById("year-value");
    if (slider && yearValue) {
        slider.addEventListener("input", function() {
            const year = +this.value;
            yearValue.textContent = year;
            if (currentCircuitId) drawChart(currentCircuitId, year);
        });
    }

    // --- Redraw on window resize ---
    window.addEventListener('resize', () => {
        if (currentCircuitId) drawChart(currentCircuitId);
    });
}
