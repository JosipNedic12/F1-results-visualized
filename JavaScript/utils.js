export function getColorMap(colors) {
  const colorMap = {};
  colors.forEach(d => { colorMap[String(d.constructorId)] = d.color; });
  return colorMap;
}


