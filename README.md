# F1 Results Visualized 🏎️

An interactive **Formula 1 data visualization web application** built with **D3.js**. The project visualizes Formula 1 race results, drivers, constructors, circuits, and race statistics through interactive charts and geographic visualizations.

The goal of the project is to make Formula 1 historical data easier to explore and understand through interactive visualizations.

## Features

* 🌍 **Interactive world map** showing Formula 1 circuits
* 🏁 **Race and circuit visualization**
* 👨‍✈️ **Driver statistics and results**
* 🏎️ **Constructor/team results**
* 📊 **Interactive charts for race data**
* ⏱️ **Lap and race performance visualization**
* 🎨 **Constructor/team colors**
* 🔎 Interactive data exploration
* 📱 Responsive web interface

## Technologies

The project is built using:

* **HTML5**
* **CSS3**
* **JavaScript**
* **D3.js**
* **GeoJSON**
* **CSV datasets**

D3.js is used for loading, processing, and visualizing the Formula 1 data.

## Dataset

The project uses historical Formula 1 data containing information about:

* Circuits
* Races
* Drivers
* Constructors
* Race results
* Lap times
* Constructor colors
* Geographic coordinates

The dataset is organized into CSV files and loaded dynamically by the application.

## Project Structure

```text
F1-results-visualized/
│
├── F1_dataset/
│   ├── circuits.csv
│   ├── races.csv
│   ├── results.csv
│   ├── drivers.csv
│   ├── constructors.csv
│   ├── colors.csv
│   └── ...
│
├── JavaScript/
│   ├── dataLoader.js
│   ├── lapChart.js
│   └── ...
│
├── custom.geo.json
├── index.html
├── style.css
└── README.md
```

## How It Works

When the application starts, the required datasets are loaded using D3.js.

The data loader retrieves the CSV and GeoJSON files and prepares the data for the different visualizations.

For example:

```javascript
const data = await d3.csv("F1_dataset/results.csv");
```

The processed data is then used by individual visualization components to create charts, maps, and interactive elements.

## Visualizations

### World Map

The interactive map displays Formula 1 circuits around the world.

Each circuit can be explored to obtain additional information such as:

* Circuit name
* Location
* Country
* Latitude
* Longitude

### Race Results

Race result data can be explored to compare drivers and their performances across races.

The visualization can be used to investigate:

* Driver positions
* Points
* Race results
* Fastest laps
* Race performance

### Lap Chart

The lap chart provides a visual representation of driver performance throughout a race.

It allows users to compare drivers and observe changes in their positions or performance during a race.

### Constructors

Constructor/team data is visualized using the corresponding team colors where available.

This makes it easier to distinguish between teams and compare their performances.

## Running the Project

Because the application loads local CSV and GeoJSON files, it should be run using a local web server rather than opening `index.html` directly.

### Using VS Code

If you use Visual Studio Code, the easiest option is the **Live Server** extension.

1. Open the project folder in VS Code.
2. Install the Live Server extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

The application should then open in your browser.

### Using Python

If Python is installed, you can also run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Installation

No package installation is required if the project is being run as a static D3.js application.

Simply clone the repository:

```bash
git clone https://github.com/JosipNedic12/F1-results-visualized.git
```

Navigate into the project:

```bash
cd F1-results-visualized
```

Then run the project using a local web server.

## Data Flow

The general data flow of the application is:

```text
CSV / GeoJSON datasets
        ↓
   dataLoader.js
        ↓
Data processing / filtering
        ↓
Visualization modules
        ↓
Interactive D3.js visualizations
        ↓
       User
```

## D3.js

D3.js is responsible for creating the interactive visualizations and manipulating the DOM based on the loaded Formula 1 data.

The project uses D3.js for:

* Data loading
* Data transformation
* Scales
* Axes
* SVG graphics
* Geographic projections
* Interactive elements
* Charts and visualizations

## Future Improvements

Possible future improvements include:

* Add more historical F1 statistics
* Add driver and constructor comparison tools
* Add filtering by season
* Add filtering by driver
* Add filtering by constructor
* Add race-by-race comparisons
* Improve mobile responsiveness
* Add additional interactive charts
* Add animations and transitions
* Add more detailed circuit information
* Improve accessibility

## Author

**Josip Nedić**

Computer Science / Software Engineering student

## License

This project is intended primarily for educational and demonstration purposes.
