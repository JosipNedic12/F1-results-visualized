export async function loadAllData() {

    const [
        geojson,
        circuits,
        races,
        results,
        colors,
        drivers
    ] = await Promise.all([
        d3.json("custom.geo.json"),
        d3.csv("F1_dataset/circuits.csv"),
        d3.csv("F1_dataset/races.csv"),
        d3.csv("F1_dataset/results.csv"),
        d3.csv("F1_dataset/colors.csv"),
        d3.csv("F1_dataset/drivers.csv")
    ]);

    // =========================
    // CIRCUITS
    // =========================

    circuits.forEach(d => {
        d.circuitId = String(d.circuit_id).trim();
        d.name = d.circuit_name;
        d.location = d.locality;
        d.country = d.country;

        d.lat = Number(d.lat);
        d.lng = Number(d.lng);
    });


    // =========================
    // RACES
    // =========================

    races.forEach(d => {

        d.year = Number(d.season);
        d.round = Number(d.round);

        d.circuitId = String(d.circuit_id).trim();

        d.name = d.race_name;

        // IMPORTANT
        // This is the ID used to connect races and results
        d.raceId = `${d.year}-${d.round}`;
    });


    // =========================
    // RESULTS
    // =========================

    results.forEach(d => {

        d.year = Number(d.season);
        d.round = Number(d.round);

        // Same race ID as races.csv
        d.raceId = `${d.year}-${d.round}`;

        d.driverId = String(d.driver_id).trim();
        d.constructorId = String(d.constructor_id).trim();

        d.driverName = d.driver_name;
        d.constructorName = d.constructor;

        d.points = Number(d.points) || 0;
        d.grid = Number(d.grid) || 0;
        d.position = Number(d.position) || 0;
        d.laps = Number(d.laps) || 0;

        d.fastestLapRank = Number(d.fastest_lap_rank) || 0;

        // Compatibility with old lapChart.js
        d.fastestLapTime = d.fastest_lap;
    });


    // =========================
    // DRIVERS
    // =========================

    drivers.forEach(d => {

        d.driverId = String(d.driver_id).trim();

        d.forename = d.given_name;
        d.surname = d.family_name;

    });


    // =========================
    // CONSTRUCTORS
    // =========================

    // There is no constructors.csv
    // in the new dataset.
    //
    // Create constructor list from results.csv.

    const constructorMap = new Map();

    results.forEach(d => {

        if (!d.constructorId) return;

        if (!constructorMap.has(d.constructorId)) {

            constructorMap.set(d.constructorId, {
                constructorId: d.constructorId,
                name: d.constructorName
            });

        }

    });

    const constructors = Array.from(
        constructorMap.values()
    );


    // =========================
// CONSTRUCTOR COLORS
// =========================

// Normalize colors.csv
colors.forEach(d => {
    d.constructorId = String(d.constructorId).trim();
    d.color = d.color.trim();
});

// Match each constructor with its color
const constructorColors = constructors.map(constructor => {

    const colorData = colors.find(
        c => c.constructorId === constructor.constructorId
    );

    return {
        constructorId: constructor.constructorId,
        color: colorData ? colorData.color : "#999999"
    };
});
    // =========================
    // DEBUG
    // =========================

    console.log("========== F1 DATA ==========");

    console.log("Circuits:", circuits.length);
    console.log("First circuit:", circuits[0]);

    console.log("Races:", races.length);
    console.log("First race:", races[0]);

    console.log("Results:", results.length);
    console.log("First result:", results[0]);

    console.log("Drivers:", drivers.length);
    console.log("First driver:", drivers[0]);

    console.log("Constructors:", constructors.length);
    console.log("First constructor:", constructors[0]);

    console.log("Colors:", colors.length);
    console.log("First color:", colors[0]);

    console.log("=============================");


    return {
    geojson,
    circuits,
    constructors,
    races,
    results,
    colors: constructorColors,
    drivers
};
}