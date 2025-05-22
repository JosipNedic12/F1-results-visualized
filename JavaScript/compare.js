import { loadAllData } from './dataLoader.js';
import { getColorMap } from './utils.js';

let allDrivers = [];
let allRaces = [];
let allResults = [];
let driverChoices = null;
let selectedDriverIds = [];
let selectedSeason = 1950;
let allColors = [];
let colorMap = {};

loadAllData().then(data => {
    allDrivers = data.drivers;
    allRaces = data.races;
    allResults = data.results;
    allColors = data.colors;
    colorMap = getColorMap(allColors);
    populateDriverSelect(allDrivers);
    setupSeasonSlider();
    drawPointsChart();
});

function populateDriverSelect(drivers) {
    const select = document.getElementById('driver-select');
    select.innerHTML = '';
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.driverId;
        option.textContent = `${driver.forename} ${driver.surname}`;
        select.appendChild(option);
    });

    if (driverChoices) driverChoices.destroy();

    driverChoices = new Choices(select, {
        removeItemButton: true,
        maxItemCount: 10,
        searchResultLimit: 20,
        renderChoiceLimit: 20,
        placeholderValue: "Type to search drivers...",
        searchFields: ['label', 'value']
    });
    driverChoices.showDropdown();

    const selectElem = document.getElementById('driver-select');
    selectElem.addEventListener('hideDropdown', function () {
        setTimeout(() => driverChoices.showDropdown(), 0);
    });

    select.addEventListener('change', handleDriverSelection);
}

function handleDriverSelection(event) {
    selectedDriverIds = Array.from(event.target.selectedOptions).map(opt => opt.value);
    displaySelectedDrivers(selectedDriverIds);
    drawPointsChart();
}

function displaySelectedDrivers(selectedDriverIds) {
    const container = document.getElementById('selected-drivers');
    if (selectedDriverIds.length === 0) {
        container.innerHTML = "<em>No drivers selected.</em>";
        return;
    }
    const selected = allDrivers.filter(driver => selectedDriverIds.includes(driver.driverId));
    container.innerHTML = `
    <h4>Selected Drivers:</h4>
    <ul>
      ${selected.map(driver =>
        `<li>${driver.forename} <strong>${driver.surname}</strong> (${driver.nationality})</li>`
    ).join('')}
    </ul>
  `;
}

function setupSeasonSlider() {
    const slider = document.getElementById('season-slider');
    const seasonValue = document.getElementById('season-value');
    slider.addEventListener('input', () => {
        selectedSeason = Number(slider.value);
        seasonValue.textContent = slider.value;
        drawPointsChart();
    });

    selectedSeason = Number(slider.value);
    seasonValue.textContent = slider.value;
    drawPointsChart();
}

function drawPointsChart() {
    const svg = d3.select("#points-chart");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    svg.selectAll("*").remove();
    // Filter races for selected season, sort by round
    const racesThisSeason = allRaces
        .filter(r => Number(r.year) === selectedSeason)
        .sort((a, b) => Number(a.round) - Number(b.round));
    const raceIds = racesThisSeason.map(r => r.raceId);
    const rounds = racesThisSeason.map(r => Number(r.round));
    const DEFAULT_LINE_COLOR = "rgba(248, 210, 210, 0.81)";
    const driverLines = selectedDriverIds.map(driverId => {
  let points = [];
  let total = 0;
  let lastConstructorId = null;
  let hasTeamColor = false;
  for (let i = 0; i < raceIds.length; i++) {
    const result = allResults.find(res => res.raceId === raceIds[i] && res.driverId === driverId);
    if (result) {
      total += Number(result.points);
      lastConstructorId = result.constructorId;
      hasTeamColor = !!colorMap[lastConstructorId];
    }
    points.push({
      round: i + 1,
      points: result ? total : null,
      color: hasTeamColor ? colorMap[lastConstructorId] : DEFAULT_LINE_COLOR
    });
  }
  const driver = allDrivers.find(d => d.driverId === driverId);
  return {
    driverId,
    driverName: driver ? `${driver.forename} ${driver.surname}` : driverId,
    points,
    legendColor: hasTeamColor ? colorMap[lastConstructorId] : DEFAULT_LINE_COLOR
  };
});


    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain([1, Math.max(2, rounds.length)])
        .range([0, innerWidth]);

    const maxPoints = d3.max(driverLines, d => d3.max(d.points, p => p.points)) || 10;

    const y = d3.scaleLinear()
        .domain([0, Math.max(10, maxPoints)])
        .range([innerHeight, 0]);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(rounds.length).tickFormat(d3.format("d")));

    // Y axis
    g.append("g")
        .call(d3.axisLeft(y).ticks(10));

    // Color scale for lines
    const color = d3.scaleOrdinal()
        .domain(selectedDriverIds)
        .range(d3.schemeCategory10);

    // Draw lines for each driver
    const line = d3.line()
        .x(d => x(d.round))
        .y(d => y(d.points));

    driverLines.forEach((driver, i) => {
  g.append("path")
    .datum(driver.points.filter(d => d.points !== null))
    .attr("fill", "none")
    .attr("stroke", driver.legendColor)
    .attr("stroke-width", 3)
    .attr("d", line);

  g.selectAll(`.point-${i}`)
    .data(driver.points.filter(d => d.points !== null))
    .enter().append("circle")
    .attr("class", `point-${i}`)
    .attr("cx", d => x(d.round))
    .attr("cy", d => y(d.points))
    .attr("r", 5)
    .attr("fill", driver.legendColor)
    .on("mouseover", function(event, d) {
      const tooltip = document.getElementById('points-tooltip');
      tooltip.innerHTML = `<b>${driver.driverName}</b><br>Race: ${d.round}<br>Points: ${d.points}`;
      tooltip.style.display = 'block';
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY - 28) + 'px';
    })
    .on("mousemove", function(event) {
      const tooltip = document.getElementById('points-tooltip');
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY - 28) + 'px';
    })
    .on("mouseout", function() {
      const tooltip = document.getElementById('points-tooltip');
      tooltip.style.display = 'none';
    });
});

    // Add legend
const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + 10},${margin.top})`);
driverLines.forEach((driver, i) => {
    const yPos = i * 22;
    legend.append("rect")
        .attr("x", 0)
        .attr("y", yPos)
        .attr("width", 18)
        .attr("height", 8)
        .attr("fill", driver.legendColor); // Use the same color as the line!
    legend.append("text")
        .attr("x", 24)
        .attr("y", yPos + 8)
        .attr("fill", "#fff")
        .attr("font-size", "14px")
        .text(driver.driverName);
});



    // Axis labels
    svg.append("text")
        .attr("x", margin.left + innerWidth / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-weight","bold")
        .text("Race Number");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-weight","bold")
        .text("Points");
}

