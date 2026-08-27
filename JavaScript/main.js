import { loadAllData } from './dataLoader.js';
import { initGlobe } from './globe.js';
import { initBarChart } from './barChart.js';
import { initLapChart } from './lapChart.js';
import { LayoutController } from './layoutController.js';
import { initDriverBarChart } from './driverBarChart.js';
async function main() {
    const {
        geojson, circuits, constructors, races, results, colors, drivers
    } = await loadAllData();

    // Layout controller handles fullscreen/shrink transitions
    const layout = new LayoutController({ transitionDuration: 600 });
    layout.fullscreenGlobe();

    // Initialize globe and get the API (including resize)
    const globe = initGlobe({
        geojson, circuits, results, races, constructors, colors, drivers,
        onCircuitSelected: handleCircuitSelected
    });

    // Initialize charts
    initBarChart({ circuits, constructors, results, colors, races });
    initLapChart({ circuits, results, races, drivers });
    initDriverBarChart({ circuits, drivers, results, colors, races, constructors });

    function handleCircuitSelected(circuitId) {
        layout.shrinkGlobeOnce(globe);
        initBarChart.update(circuitId);
        initLapChart.update(circuitId);
        initDriverBarChart.update(circuitId)
    }
    document.getElementById('loading-overlay').classList.add('hide');
    setTimeout(() => {
        document.getElementById('loading-overlay').style.display = 'none';
    }, 1000); 

}

main();
