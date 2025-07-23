document.addEventListener("DOMContentLoaded", () => {
    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("change", function () {
            document.body.classList.toggle("dark-mode");
        });
    }

    const colors = getChartColors();
    const combinedCols = (features_list || []).concat(targets_list || []);

    // ---------------- 3D SCATTER ----------------
    const x3d = document.getElementById('3d-x-select');
    const y3d = document.getElementById('3d-y-select');
    const z3d = document.getElementById('3d-z-select');
    [x3d, y3d, z3d].forEach(sel => {
        combinedCols.forEach(col => {
            const opt = new Option(col, col);
            sel.add(opt.cloneNode(true));
        });
    });
    x3d.selectedIndex = 0;
    y3d.selectedIndex = 1;
    z3d.selectedIndex = 2;
    [x3d, y3d, z3d].forEach(sel => sel.addEventListener('change', update3DChart));
    update3DChart();

    function update3DChart() {
        const x = chartData?.[x3d.value] || [];
        const y = chartData?.[y3d.value] || [];
        const z = chartData?.[z3d.value] || [];

        const trace3d = {
            x, y, z,
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                size: 4,
                color: z,
                colorscale: 'Viridis',
                opacity: 0.85
            }
        };

        const layout3d = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            paper_bgcolor: colors.paper,
            font: { color: colors.font },
            scene: {
                xaxis: { title: x3d.value },
                yaxis: { title: y3d.value },
                zaxis: { title: z3d.value }
            }
        };
        Plotly.react('threeDChart', [trace3d], layout3d);
    }

    // ---------------- KPI STAT CARDS ----------------
    function populateKPIStats() {
        try {
            const totalRows = Object.values(chartData || {})[0]?.length || 0;
            document.getElementById('kpi-total-rows').innerText = totalRows.toLocaleString();

            const targetValues = Object.values(targets_means || {});
            const avgTargetTemp = (
                targetValues.reduce((a, b) => a + b, 0) / (targetValues.length || 1)
            ).toFixed(2);
            document.getElementById('kpi-avg-temp').innerText = `${avgTargetTemp} °C`;

            const genSpeed = chartData?.['AI_GENERATORSPEED'] || [];
            const maxSpeed = genSpeed.length ? Math.max(...genSpeed).toFixed(0) : '--';
            document.getElementById('kpi-max-speed').innerText = `${maxSpeed} RPM`;

            const deviationCols = Object.keys(chartData || {}).filter(col => col.includes('Deviation'));
            if (deviationCols.length === 0) {
                document.getElementById('kpi-top-deviation').innerText = "Not available";
            } else {
                let maxDev = 0;
                let topSensor = '–';
                for (let col of deviationCols) {
                    const devs = chartData[col];
                    const meanAbs = devs.reduce((acc, val) => acc + Math.abs(val), 0) / devs.length;
                    if (meanAbs > maxDev) {
                        maxDev = meanAbs;
                        topSensor = col.replace('Deviation_', '');
                    }
                }
                document.getElementById('kpi-top-deviation').innerText = topSensor;
            }
        } catch (e) {
            console.error('KPI stat generation error:', e);
        }
    }

    function renderPieChart() {
        try {
            const bucketMap = {
                '<58°C': 0,
                '58–60°C': 0,
                '60–62°C': 0,
                '>62°C': 0
            };

            const targetMeans = targets_means || {};
            Object.values(targetMeans).forEach(mean => {
                if (mean < 58) bucketMap['<58°C']++;
                else if (mean < 60) bucketMap['58–60°C']++;
                else if (mean < 62) bucketMap['60–62°C']++;
                else bucketMap['>62°C']++;
            });

            const labels = Object.keys(bucketMap);
            const values = Object.values(bucketMap);

            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

            Plotly.newPlot('pieChart', [{
                type: 'pie',
                labels: labels,
                values: values,
                marker: { colors },
                textinfo: 'label+percent',
                insidetextorientation: 'radial',
                hole: 0.3
            }], {
                title: 'Target Temperature Distribution',
                paper_bgcolor: getChartColors().paper,
                font: { color: getChartColors().font }
            });
        } catch (e) {
            console.error('Pie chart error:', e);
        }
    }

    function renderCorrelationHeatmap() {
        try {
            const features = features_list || [];
            const targets = targets_list || [];

            const zValues = [];

            for (let t of targets) {
                const row = [];
                for (let f of features) {
                    const x = chartData?.[f] || [];
                    const y = chartData?.[t] || [];
                    if (x.length !== y.length || x.length === 0) {
                        row.push(null);
                        continue;
                    }
                    const corr = pearsonCorrelation(x, y);
                    row.push(parseFloat(corr.toFixed(2)));
                }
                zValues.push(row);
            }

            const heatmapTrace = {
                z: zValues,
                x: features,
                y: targets,
                type: 'heatmap',
                colorscale: 'RdBu',
                reversescale: true,
                zmid: 0,
                showscale: true
            };

            // Annotations for each cell
            const annotations = [];
            for (let i = 0; i < targets.length; i++) {
                for (let j = 0; j < features.length; j++) {
                    const val = zValues[i][j];
                    if (val !== null) {
                        annotations.push({
                            x: features[j],
                            y: targets[i],
                            text: val.toFixed(2),
                            showarrow: false,
                            font: {
                                color: Math.abs(val) > 0.5 ? 'white' : 'black',
                                size: 12
                            }
                        });
                    }
                }
            }

            const layout = {
                title: 'Feature-to-Target Correlation',
                paper_bgcolor: getChartColors().paper,
                font: { color: getChartColors().font },
                margin: { t: 40, b: 150, l: 100, r: 40 },  // increased bottom and left margins
                xaxis: {
                    title: 'Features',
                    tickangle: -45,
                    automargin: true
                },
                yaxis: {
                    title: 'Targets',
                    automargin: true
                },
                annotations: annotations
            };

            Plotly.newPlot('heatmapChart', [heatmapTrace], {
                ...layout,
                height: 500  // ⬅️ you can increase to 550–600 for better results
            });

        } catch (err) {
            console.error('Heatmap error:', err);
        }
    }

    // Pearson correlation helper
    function pearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
        const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
        const sumY2 = y.reduce((acc, val) => acc + val * val, 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
        return denominator === 0 ? 0 : numerator / denominator;
    }


    function initDayaparMap() {
        const dayaparCoords = [23.7088, 69.8275];

        const map = L.map('dayaparMap').setView(dayaparCoords, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap | Windmill Health'
        }).addTo(map);

        // Windmill icon
        const windmillIcon = L.icon({
            iconUrl: 'static/icons/windmill.png',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -40]
        });

        // Generate 24 nearby coordinates
        const markers = [];
        for (let i = 0; i < 24; i++) {
            const latOffset = (Math.random() - 0.5) * 0.01;  // small scatter
            const lonOffset = (Math.random() - 0.5) * 0.01;
            const lat = dayaparCoords[0] + latOffset;
            const lon = dayaparCoords[1] + lonOffset;

            const marker = L.marker([lat, lon], { icon: windmillIcon }).addTo(map);
            marker.bindPopup(`🌪️ Windmill #${i + 1}<br>📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            markers.push(marker);
        }
    }


    renderCorrelationHeatmap();
    renderPieChart();
    populateKPIStats();
    initDayaparMap();  // ← Add this line here


    // ---------------- Theme Utility ----------------
    function getChartColors() {
        return document.body.classList.contains('dark-mode')
            ? { paper: '#1a1a1a', font: '#41b350' }
            : { paper: '#ffffff', font: '#000000' };
    }



    // ---------------- View Dashboard Scroll ----------------
    const scrollBtn = document.getElementById("scroll-to-dashboard");
    if (scrollBtn) {
        scrollBtn.addEventListener("click", () => {
            const target = document.querySelector(".kpi-container");
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    }


    // Date range filter setup
    const fullData = [];
    const timestamps = chartData['TIMESTAMP'] || [];
    const allKeys = Object.keys(chartData);

    for (let i = 0; i < timestamps.length; i++) {
        const row = {};
        for (let key of allKeys) {
            row[key] = chartData[key][i];
        }
        const isoLocal = row.TIMESTAMP.replace(' ', 'T');
        row._date = new Date(isoLocal + '.000');  // Keep full datetime precision
        fullData.push(row);
    } // assuming 'data' holds all records from the uploaded Excel
    if (!fullData || fullData.length === 0) return; // skip if no data available

    // Parse all timestamps into Date objects and determine min/max dates
    fullData.forEach(d => { d._date = new Date(d.TIMESTAMP); });

    const minDate = new Date(Math.min(...fullData.map(d => d._date.getTime())));
    const maxDate = new Date(Math.max(...fullData.map(d => d._date.getTime())));


    // Helper to format a Date as YYYY-MM-DD (for setting input values)
    function formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // Helper to parse a YYYY-MM-DD string from date input into a Date (at 00:00 local time)
    function parseDateInput(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // Initialize the date inputs with full range
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    startDateInput.value = formatDateInput(minDate);
    endDateInput.value = formatDateInput(maxDate);
    startDateInput.min = formatDateInput(minDate);
    startDateInput.max = formatDateInput(maxDate);
    endDateInput.min = formatDateInput(minDate);
    endDateInput.max = formatDateInput(maxDate);

    // Functions to update KPIs and charts using a given data subset
    // NOTE: Ensure chart container IDs ('pie-chart', 'correlation-heatmap', 'scatter3d', etc.) match those in your HTML.
    function updateKPIs(dataSubset) {
        // Example KPI updates (modify based on actual KPI card structure and metrics)
        document.getElementById('kpi-total-count').innerText = dataSubset.length;  // total records count
        if (dataSubset.length > 0) {
            // Example: update average of the first numeric field
            const firstNumericField = Object.keys(dataSubset[0]).find(
                k => k !== 'TIMESTAMP' && typeof dataSubset[0][k] === 'number'
            );
            if (firstNumericField) {
                const avg = dataSubset.reduce((sum, row) => sum + row[firstNumericField], 0) / dataSubset.length;
                document.getElementById('kpi-average-' + firstNumericField.toLowerCase()).innerText = avg.toFixed(2);
            }
        }
        // (Repeat for other KPI cards as needed)
    }

    function updatePieChart(dataSubset) {
        // Example: assume 'CATEGORY' is the categorical field for pie chart grouping
        const categories = [...new Set(dataSubset.map(d => d.CATEGORY))];
        const counts = categories.map(cat => dataSubset.filter(d => d.CATEGORY === cat).length);
        Plotly.newPlot('pie-chart', [{
            labels: categories,
            values: counts,
            type: 'pie'
        }], { margin: { t: 30, b: 0, l: 0, r: 0 } });
    }

    function updateCorrelationHeatmap(dataSubset) {
        // Compute correlation matrix for numeric fields
        const numericFields = Object.keys(dataSubset[0]).filter(
            k => k !== 'TIMESTAMP' && typeof dataSubset[0][k] === 'number'
        );
        const n = numericFields.length;
        if (n === 0) {
            // No numeric data, clear heatmap
            Plotly.newPlot('correlation-heatmap', [], {});
            return;
        }
        // Initialize an n x n matrix
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1;
                } else {
                    const xi = numericFields[i], yi = numericFields[j];
                    const xVals = dataSubset.map(d => d[xi]);
                    const yVals = dataSubset.map(d => d[yi]);
                    const avgX = xVals.reduce((a, b) => a + b, 0) / xVals.length;
                    const avgY = yVals.reduce((a, b) => a + b, 0) / yVals.length;
                    let cov = 0;
                    for (let k = 0; k < xVals.length; k++) {
                        cov += (xVals[k] - avgX) * (yVals[k] - avgY);
                    }
                    cov /= xVals.length;
                    const stdX = Math.sqrt(xVals.reduce((sum, v) => sum + (v - avgX) ** 2, 0) / xVals.length);
                    const stdY = Math.sqrt(yVals.reduce((sum, v) => sum + (v - avgY) ** 2, 0) / yVals.length);
                    const corr = (stdX && stdY) ? cov / (stdX * stdY) : 0;
                    matrix[i][j] = parseFloat(corr.toFixed(2));
                }
            }
        }
        Plotly.newPlot('correlation-heatmap', [{
            z: matrix,
            x: numericFields,
            y: numericFields,
            type: 'heatmap',
            colorbar: { title: 'Correlation' }
        }]);
    }

    function updateScatter3D(dataSubset) {
        // Example: use the first three numeric fields for 3D scatter plot
        const numericFields = Object.keys(dataSubset[0]).filter(
            k => k !== 'TIMESTAMP' && typeof dataSubset[0][k] === 'number'
        );
        if (numericFields.length < 3) return; // not enough data for 3D plot
        Plotly.newPlot('scatter3d', [{
            x: dataSubset.map(d => d[numericFields[0]]),
            y: dataSubset.map(d => d[numericFields[1]]),
            z: dataSubset.map(d => d[numericFields[2]]),
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 3 }
        }], {
            scene: {
                xaxis: { title: numericFields[0] },
                yaxis: { title: numericFields[1] },
                zaxis: { title: numericFields[2] }
            }
        });
    }

    // Function to refresh all dashboard elements based on a data subset
    function updateDashboard(dataSubset) {
        updateKPIs(dataSubset);
        updatePieChart(dataSubset);
        updateCorrelationHeatmap(dataSubset);
        updateScatter3D(dataSubset);
    }

    // Event handlers for Apply and Reset buttons
    document.getElementById('apply-btn').addEventListener('click', () => {
        const start = parseDateInput(startDateInput.value);
        const end = parseDateInput(endDateInput.value);
        if (start > end) {
            alert('Start date must be before end date.');
            return;
        }
        // Include the entire end date by setting time to end of day
        const endInclusive = new Date(end.getTime());
        endInclusive.setHours(23, 59, 59, 999);
        // Filter the full dataset to the selected date range
        const filteredData = fullData.filter(d => d._date >= start && d._date <= endInclusive);

        chartData = {};
        allKeys.forEach(key => {
            chartData[key] = filteredData.map(d => d[key]);
        });
        update3DChart();
        populateKPIStats();
        renderPieChart();
        renderCorrelationHeatmap();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        // Reset inputs to full range
        startDateInput.value = formatDateInput(minDate);
        endDateInput.value = formatDateInput(maxDate);
        // Restore original full dataset views

        chartData = {};
        allKeys.forEach(key => {
            chartData[key] = fullData.map(d => d[key]);
        });
        update3DChart();
        populateKPIStats();
        renderPieChart();
        renderCorrelationHeatmap();
    });
});