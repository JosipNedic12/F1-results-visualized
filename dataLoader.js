export async function loadAllData() {
  const [
    geojson,
    circuits,
    constructors,
    races,
    results,
    colors,
    drivers
  ] = await Promise.all([
    d3.json("custom.geo.json"),
    d3.csv("F1_dataset/circuits.csv"),
    d3.csv("F1_dataset/constructors.csv"),
    d3.csv("F1_dataset/races.csv"),
    d3.csv("F1_dataset/results.csv"),
    d3.csv("F1_dataset/constructor_colors.csv"),
    d3.csv("F1_dataset/drivers.csv")
  ]);
  return { geojson, circuits, constructors, races, results, colors, drivers };
}
