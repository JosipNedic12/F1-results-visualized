import { getColorMap } from './utils.js';

export function initGlobe({
    geojson,
    circuits,
    results,
    races,
    constructors,
    colors,
    drivers,
    onCircuitSelected
}) {
    // --- Sizing ---
    const container = document.getElementById('globe-section');
    let width = container.clientWidth;
    let height = container.clientHeight;

    // --- SVG & Projection ---
    const svg = d3.select("#globe-svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoOrthographic()
        .scale(Math.min(width, height) / 2.1)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // --- Draw Sphere (Ocean) ---
    svg.append("path")
        .attr("class", "sphere")
        .attr("fill", "#aeefff")
        .attr("d", path({ type: "Sphere" }));

    // --- Draw Graticule (Grid) ---
    const graticule = d3.geoGraticule10();
    svg.append("path")
        .attr("class", "graticule")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.5)
        .attr("d", path(graticule));

    // --- Draw Land ---
    svg.append("g")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("class", "land")
        .attr("fill", "#2ecc40")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("d", path);

    // --- Tooltip Setup ---
    const tooltip = d3.select("#tooltip");

    // --- Draw Circuit Dots ---
    const circuitDots = svg.append("g")
        .attr("class", "circuits-group")
        .selectAll("circle")
        .data(circuits)
        .join("circle")
        .attr("class", "circuit-dot")
        .attr("fill", "red")
        .attr("stroke", "white")
        .attr("stroke-width", 0.7)
        .attr("r", 4)
        .attr("transform", d => {
            const coords = projection([+d.lng, +d.lat]);
            if (!coords) return "scale(0)";
            return "translate(" + coords[0] + "," + coords[1] + ")";
        })
        .on("mouseover", function (event, d) {
            tooltip
                .style("display", "block")
                .html(
                    `<strong>${d.name}</strong><br>${d.location}, ${d.country}<br><em>Click for details</em>`
                );
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            if (typeof onCircuitSelected === "function") {
                onCircuitSelected(d.circuitId);
            }
            // Optional: highlight selected dot
            circuitDots.attr("fill", c =>
                c.circuitId === d.circuitId ? "#C83E4D" : "red"
            );
        });
        updateCircuits();


    // --- Helper: Update Dot Positions (for drag/zoom/resize) ---
    function updateCircuits() {
        circuitDots.attr("transform", function (d) {
            const coords = projection([+d.lng, +d.lat]);
            // Hide dots on back of globe
            if (!coords || d3.geoDistance([+d.lng, +d.lat], projection.invert([width / 2, height / 2])) > Math.PI / 2) {
                return "scale(0)";
            }
            return "translate(" + coords[0] + "," + coords[1] + ")";
        });
    }

    // --- Drag to Rotate Globe ---
    svg.call(d3.drag()
        .on("drag", (event) => {
            const rotate = projection.rotate();
            const k = 1 / projection.scale();
            projection.rotate([
                rotate[0] + event.dx * k * 150,
                rotate[1] - event.dy * k * 150
            ]);
            svg.select("path.sphere").attr("d", path({ type: "Sphere" }));
            svg.select("path.graticule").attr("d", path(graticule));
            svg.selectAll("path.land").attr("d", path);
            updateCircuits();
        })
    );

    // --- Zoom to Scale Globe ---
    svg.call(
        d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", (event) => {
                projection.scale(Math.min(width, height) / 2.1 * event.transform.k);
                svg.select("path.sphere").attr("d", path({ type: "Sphere" }));
                svg.select("path.graticule").attr("d", path(graticule));
                svg.selectAll("path.land").attr("d", path);
                updateCircuits();
            })
    );

    // --- Responsive Resize (for window or container size changes) ---
    function resizeGlobe() {
        width = container.clientWidth;
        height = container.clientHeight;
        svg.attr("width", width).attr("height", height);
        projection
            .scale(Math.min(width, height) / 2.1)
            .translate([width / 2, height / 2]);
        svg.select("path.sphere").attr("d", path({ type: "Sphere" }));
        svg.select("path.graticule").attr("d", path(graticule));
        svg.selectAll("path.land").attr("d", path);
        updateCircuits();
    }

    // Listen for window resize (optional)
    window.addEventListener('resize', resizeGlobe);

    // --- Return API for external control ---
    return {
        resize: resizeGlobe
    };
}
