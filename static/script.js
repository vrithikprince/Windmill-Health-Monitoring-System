// ------------------- Loader Animation -------------------
window.addEventListener('load', () => {
  const loginPage = document.getElementById("login-page");
  if (loginPage && loginPage.style.display !== "none") {
    // don't auto-start loader
    return;
  }

  const loaderText = document.getElementById("loader-text");
  const loader = document.getElementById("loader");
  const mainMenu = document.getElementById("main-menu");

  const text = "Windmill Health Monitor";
  let i = 0;

  const typeInterval = setInterval(() => {
    loaderText.textContent = text.slice(0, ++i);
    if (i === text.length) {
      clearInterval(typeInterval);

      setTimeout(() => {
        loader.style.opacity = 0;

        setTimeout(() => {
          loader.style.display = "none";
          mainMenu.style.display = "flex";
          mainMenu.classList.add("show"); // fade-in class
        }, 500);

      }, 300); // Pause after typing
    }
  }, 80);
});

// Push initial menu state when app loads
window.addEventListener('load', () => {
  history.replaceState({ page: "menu" }, "Menu", "#menu");
});


// ------------------- Theme Toggle -------------------

// ✅ Safe global initialization for chart and alert data
window.chartData = [];
window.fixedFeatureList = [];

function setupCalendarFilterFromChartData(data) {
  const timestamps = data
    .map(d => new Date(d.timestamp || d.Timestamp || d.time))
    .filter(d => !isNaN(d));

  if (!timestamps.length) return;

  const min = new Date(Math.min(...timestamps));
  const max = new Date(Math.max(...timestamps));

  const start = document.getElementById("start-date");
  const end = document.getElementById("end-date");

  const minStr = min.toISOString().split("T")[0];
  const maxStr = max.toISOString().split("T")[0];

  start.setAttribute("min", minStr);
  start.setAttribute("max", maxStr);
  end.setAttribute("min", minStr);
  end.setAttribute("max", maxStr);

  start.value = minStr;
  end.value = maxStr;

  document.getElementById("date-filter").style.display = "flex";
}
window.alertExportData = [];

// 🔁 Request Access Button Handler
function requestAccess() {
  const email = "vrithikprince.bda24@aidtm.ac.in";
  const subject = encodeURIComponent("Requesting access to Windmill Health Monitoring System");
  const body = encodeURIComponent("Dear ENOC team,\n\nI would like to request access to the Windmill Health Monitoring System.\n\nRegards,\n");
  const url = `mailto:${email}?subject=${subject}&body=${body}`;
  window.location.href = url;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("theme-toggle").addEventListener("change", function () {
    const icon = document.getElementById("toggle-icon");
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      icon.textContent = "🌙"; // Show sun in dark mode
    } else {
      icon.textContent = "☀️"; // Show moon in light mode
    }
  });

  // 🔽 Toggle User Guide Panel
  const toggleBtn = document.getElementById("user-guide-toggle");
  const panel = document.getElementById("user-guide-panel");
  const arrow = document.getElementById("guide-arrow");

  if (toggleBtn && panel && arrow) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("open");
      arrow.style.transform = panel.classList.contains("open") ? "rotate(-90deg)" : "rotate(0deg)";
    });
  }

  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const user = document.getElementById("login-username").value.trim();
      const pass = document.getElementById("login-password").value.trim();

      if (user === "ENOC_Renewables" && pass === "enoc123") {
        console.log("✅ Login successful");

        // Hide login, show loader
        document.getElementById("login-page").style.display = "none";
        document.getElementById("loader").style.display = "flex";

        // Trigger loader animation
        setTimeout(() => {
          const loaderText = document.getElementById("loader-text");
          const text = "Windmill Health Monitor";
          let i = 0;

          const typeInterval = setInterval(() => {
            loaderText.textContent = text.slice(0, ++i);
            if (i === text.length) {
              clearInterval(typeInterval);

              setTimeout(() => {
                document.getElementById("loader").style.opacity = 0;
                setTimeout(() => {
                  document.getElementById("loader").style.display = "none";
                  document.getElementById("main-menu").style.display = "flex";
                  document.getElementById("main-menu").classList.add("show");
                }, 500);
              }, 300);
            }
          }, 80);
        }, 500);

      } else {
        alert("❌ Invalid credentials");
      }
    });
  }

});

let excelData = [];
let fullChartData = [];

// ------------------- Excel Upload + Preview -------------------
document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  // 🔄 Show loader animation
  document.getElementById("excel-loader").classList.remove("hidden");
  document.getElementById("preview-container").style.display = "none";

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (json.length === 0) {
      alert("❌ Excel file is empty or invalid.");
      return;
    }

    // Optional: You can show this in the console if needed
    console.log("✅ Successfully uploaded");
    excelData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    const previewContainer = document.getElementById("preview-container");
    const previewDiv = document.getElementById("excel-preview");
    document.querySelector("#preview-container h3").textContent = "👀 Preview of Uploaded File";
    previewDiv.innerHTML = "";

    const table = document.createElement("table");
    json.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell instanceof Date ? cell.toLocaleString() : (cell ?? '');
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    previewDiv.appendChild(table);

    // ✅ Hide loader once preview is ready
    document.getElementById("excel-loader").classList.add("hidden");

    previewContainer.style.display = "block";

    const headers = json[0];
    const targetSelect = document.getElementById('target-select');
    const featureSelect = document.getElementById('feature-select');
    targetSelect.innerHTML = '';
    featureSelect.innerHTML = '';

    headers.forEach(col => {
      targetSelect.appendChild(new Option(col, col));
      featureSelect.appendChild(new Option(col, col));
    });

    if (window.targetChoices) window.targetChoices.destroy();
    if (window.featureChoices) window.featureChoices.destroy();

    window.targetChoices = new Choices('#target-select', {
      removeItemButton: true,
      searchEnabled: true,
      shouldSort: false
    });

    window.featureChoices = new Choices('#feature-select', {
      removeItemButton: true,
      searchEnabled: true,
      shouldSort: false
    });

    document.getElementById("ml-config").style.display = "block";
  };

  reader.readAsArrayBuffer(file);
});

// ------------------- Run Button Enable Logic -------------------
function updateRunButtonState() {
  const targets = Array.from(document.getElementById('target-select').selectedOptions).map(o => o.value);
  const features = Array.from(document.getElementById('feature-select').selectedOptions).map(o => o.value);
  const model = document.getElementById('model-select').value;
  const btn = document.getElementById('run-button');

  if (targets.length && features.length && model) {
    btn.disabled = false;
    btn.classList.remove("disabled-run");
    btn.classList.add("active-run");
  } else {
    btn.disabled = true;
    btn.classList.remove("active-run");
    btn.classList.add("disabled-run");
  }

  updateSelectedLists();
}

function updateSelectedLists() {
  const targets = Array.from(document.getElementById('target-select').selectedOptions).map(o => o.value);
  const features = Array.from(document.getElementById('feature-select').selectedOptions).map(o => o.value);

  const targetList = document.getElementById('selected-targets');
  const featureList = document.getElementById('selected-features');

  targetList.innerHTML = "";
  featureList.innerHTML = "";

  targets.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    targetList.appendChild(li);
  });

  features.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f;
    featureList.appendChild(li);
  });
}

['target-select', 'feature-select', 'model-select'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateRunButtonState);
});

// ------------------- Run Button: Model Training -------------------
document.getElementById('run-button').addEventListener('click', async () => {
  const targets = Array.from(document.getElementById('target-select').selectedOptions).map(o => o.value);
  const features = Array.from(document.getElementById('feature-select').selectedOptions).map(o => o.value);
  const model = document.getElementById('model-select').value;

  if (!targets.length || !features.length || !model) {
    alert("Please select target, features and model!");
    return;
  }

  document.getElementById('training-status').style.display = 'block';
  document.getElementById('metrics-container').style.display = 'none';
  document.getElementById('chart-container').style.display = 'none';
  document.getElementById('alerts-container').style.display = 'none';

  let secondsLeft = Math.max(3, Math.ceil((excelData.length / 1000) * 2));
  const countdownEl = document.getElementById('countdown');
  countdownEl.textContent = secondsLeft;

  const countdownInterval = setInterval(() => {
    secondsLeft--;
    countdownEl.textContent = secondsLeft;
    if (secondsLeft <= 0) clearInterval(countdownInterval);
  }, 1000);

  const res = await fetch("http://127.0.0.1:5000/train", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: excelData, targets, features, model })
  });

  const result = await res.json();
  clearInterval(countdownInterval);

  // === Display Target-wise Metrics ===
  if (result.target_metrics) {
    const grid = document.getElementById("target-metrics-grid");
    const container = document.getElementById("target-metrics-container");

    grid.innerHTML = ""; // Clear existing
    container.style.display = "block";

    Object.entries(result.target_metrics).forEach(([target, metrics]) => {
      const box = document.createElement("div");
      box.classList.add("target-metric-box");

      box.innerHTML = `
      <h4>${target}</h4>
      <p>R²: ${metrics.r2}</p>
      <p>MAE: ${metrics.mae}</p>
      <p>MSE: ${metrics.mse}</p>
      <p>RMSE: ${metrics.rmse}</p>
    `;

      grid.appendChild(box);
    });
  }

  console.log(result);

  if (result.error) {
    alert(result.error);
    return;
  }


  document.getElementById('chart-container').style.display = 'block';
  const ctx = document.getElementById('predictionChart').getContext('2d');
  if (window.predChart) window.predChart.destroy();

  const labels = result.chart.map(item => item.time);
  const actual = result.chart.map(item => item.actual);
  const predicted = result.chart.map(item => item.predicted);
  const upper = result.chart.map(item => item.upper);
  const lower = result.chart.map(item => item.lower);

  window.fullChartData = result.chart;

  window.predChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: actual, borderColor: '#ff0000', fill: false, tension: 0.2 },
        { label: 'Predicted', data: predicted, borderColor: '#41b350', fill: false, tension: 0.2 },
        { label: 'Upper Bound', data: upper, borderDash: [5, 5], borderColor: '#999', fill: false, tension: 0.2 },
        { label: 'Lower Bound', data: lower, borderDash: [5, 5], borderColor: '#999', fill: false, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#333',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Row Index',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            },
            stepSize: 1
          }
        }
      }
    }
  });

  // Auto-fill calendar
  const minDate = new Date(labels[0]);
  const maxDate = new Date(labels[labels.length - 1]);

  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  const pad = n => String(n).padStart(2, '0');
  const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const minDateStr = formatDate(minDate);
  const maxDateStr = formatDate(maxDate);

  // Set attributes
  startDateInput.min = minDateStr;
  endDateInput.min = minDateStr;
  startDateInput.max = maxDateStr;
  endDateInput.max = maxDateStr;

  // Set default values (make sure both dates are within bounds)
  startDateInput.value = minDateStr;
  endDateInput.value = maxDateStr;

  document.getElementById('date-filter').style.display = 'flex';

  // Alerts
  const alertContainer = document.getElementById('alerts-container');
  const alertList = document.getElementById('alerts-list');
  alertList.innerHTML = "";

  if (result.alerts.length > 0) {
    result.alerts.forEach(alert => {
      const li = document.createElement("li");
      li.textContent = `[${alert.time}] ${alert.target} = ${alert.value} → ${alert.status} Threshold`;
      alertList.appendChild(li);
    });
    alertContainer.style.display = 'block';
  } else {
    alertContainer.style.display = 'none';
  }
});


// ------------------- Date Filtering Functions ------------------

function updatePredictionChart(data) {
  const labels = data.map(item => item.time);
  const actual = data.map(item => item.actual);
  const predicted = data.map(item => item.predicted);
  const upper = data.map(item => item.upper);
  const lower = data.map(item => item.lower);

  if (window.predChart) window.predChart.destroy();
  const ctx = document.getElementById("predictionChart").getContext("2d");

  window.predChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: actual, borderColor: '#ff0000', fill: false, tension: 0.2 },
        { label: 'Predicted', data: predicted, borderColor: '#41b350', fill: false, tension: 0.2 },
        { label: 'Upper Bound', data: upper, borderDash: [5, 5], borderColor: '#999', fill: false, tension: 0.2 },
        { label: 'Lower Bound', data: lower, borderDash: [5, 5], borderColor: '#999', fill: false, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#333',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Row Index',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 12
            },
            stepSize: 1
          }
        }
      }
    }
  });
}

// ✅ KEEP THIS ONE AND ADD guide visibility
function launchGearbox() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("main-content").style.display = "block";

  const guide = document.getElementById("user-guide-container");
  if (guide) guide.style.display = "block";

  history.pushState({ page: "main-content" }, "Gearbox", "#gearbox");
}

// Show Menu Page
function showMenu() {
  document.getElementById("main-menu").style.display = "flex";
  document.getElementById("main-content").style.display = "none";
}

// When the page first loads (after loader), show menu & set initial history
window.addEventListener('load', () => {
  history.replaceState({ page: "menu" }, "Menu", "#menu");
  showMenu();
});

// ✅ KEEP and MODIFY this one
window.addEventListener("popstate", function (event) {
  const guide = document.getElementById("user-guide-container");

  if (!event.state || event.state.page === "menu") {
    showMenu();
    if (guide) guide.style.display = "none"; // 🔴 Hide on menu
  } else if (event.state.page === "main-content") {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("main-content").style.display = "block";
    if (guide) guide.style.display = "block"; // ✅ Show on main page
  }
});

// ------------------- Block 3: Model Prediction Integration -------------------
async function predictWithModel() {
  const excelInput = document.getElementById("excelFile");
  const file = excelInput.files[0];

  const previewContainer = document.getElementById("preview-container");
  const assetAlertBox = document.getElementById("asset-alert");
  if (assetAlertBox) assetAlertBox.style.display = "none";

  const resultContainer = document.getElementById("model-result-container");
  const targetMetricsContainer = document.getElementById("target-metrics-container");
  const targetMetricsGrid = document.getElementById("target-metrics-grid");
  const deviationTable = document.getElementById("model-deviation-table");

  const stepProgress = document.getElementById("step-progress");
  const stepTwo = document.getElementById("step-two");
  const stepThree = document.getElementById("step-three");
  const stepLine = document.getElementById("step-line-1");
  const stepLine2 = document.getElementById("step-line-2");

  if (!file) {
    alert("Please upload a valid Excel file.");
    return;
  }

  document.getElementById("model-error").style.display = "none";
  document.getElementById("model-error").innerHTML = "";
  showLoaderVisual(); // ✅ Animated loader bar

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"     // ✅ Yahi fix tha
      },
      body: JSON.stringify({ data: excelData })
    });

    if (!res.ok) {
      throw new Error("Server did not respond properly");
    }

    const text = await res.text();  // 📦 Raw backend response
    console.log("📦 Raw response:", text);  // Console mein print hoga

    let result;
    try {
      result = JSON.parse(text);
      console.log("✅ Parsed JSON:", result);
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      alert("❌ Backend did not return valid JSON.");
      return;
    }

    hideLoaderVisual();

    if (result.status === "error") {
      const alertBox = document.getElementById("asset-alert");
      if (alertBox) {
        alertBox.innerText = "❌ " + result.message;
        alertBox.style.display = "block";
      }
      return;
    }

    // Step Progress UI
    stepProgress.style.display = "flex";
    stepTwo.classList.add("active");
    stepLine.classList.add("activated");

    setTimeout(() => {
      resultContainer.scrollIntoView({ behavior: "smooth" });
    }, 400);

    // Show metrics
    targetMetricsGrid.innerHTML = "";
    Object.entries(result.target_metrics).forEach(([target, metrics]) => {
      const card = document.createElement("div");
      card.className = "metric-card";
      card.innerHTML = `
        <h4>${target}</h4>
        <p>R²: ${metrics.r2.toFixed(4)}</p>
        <p>MAE: ${metrics.mae.toFixed(4)}</p>
        <p>MSE: ${metrics.mse.toFixed(4)}</p>
        <p>RMSE: ${metrics.rmse.toFixed(4)}</p>
      `;
      targetMetricsGrid.appendChild(card);
    });
    targetMetricsContainer.style.display = "block";
    window.targetMetrics = result.target_metrics;

    // Prediction table logic
    const resultData = result.results;
    window.resultData = resultData;

    // ✅ Extract feature columns dynamically
    const knownColumns = ["Timestamp", ...Object.keys(result.target_metrics).flatMap(t => [
      `Actual_${t}`, `Predicted_${t}`, `Deviation_${t}`
    ])];
    const sampleRow = resultData[0] || {};
    const allKeys = Object.keys(sampleRow);
    const featureKeys = allKeys.filter(k => !knownColumns.includes(k));
    window.fixedFeatureList = featureKeys; // preserve original casing
    console.log("🧠 Detected feature columns:", window.fixedFeatureList);
    window.featureKeyMap = Object.fromEntries(featureKeys.map(k => [k.toLowerCase(), k])); // for lookup



    const allHeaders = Object.keys(resultData[0]);
    const allTargets = allHeaders.filter(h => h.startsWith("Predicted_")).map(h => h.replace("Predicted_", ""));

    const filtersDiv = document.getElementById("prediction-filters");
    const checkboxesDiv = document.getElementById("target-checkboxes");
    const entryDropdown = document.getElementById("entry-dropdown");

    checkboxesDiv.innerHTML = "";
    allTargets.forEach(target => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = target;
      checkbox.checked = true;

      const label = document.createElement("label");
      label.className = "target-checkbox-label";
      label.appendChild(checkbox);
      label.append(` ${target}`);
      checkboxesDiv.appendChild(label);
    });

    filtersDiv.style.display = "block";

    function renderFilteredTable() {
      const selectedTargets = Array.from(checkboxesDiv.querySelectorAll("input:checked")).map(cb => cb.value);
      const limit = entryDropdown.value === "all" ? resultData.length : parseInt(entryDropdown.value);

      const displayHeaders = ["Timestamp", ...selectedTargets.flatMap(t => [
        `Actual_${t}`, `Predicted_${t}`, `Deviation_${t}`
      ])];

      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      displayHeaders.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      resultData.slice(0, limit).forEach(row => {
        const tr = document.createElement("tr");
        displayHeaders.forEach(h => {
          const td = document.createElement("td");
          td.textContent = row[h] ?? "--";
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      deviationTable.innerHTML = "";
      deviationTable.appendChild(table);
    }

    renderFilteredTable();
    checkboxesDiv.addEventListener("change", renderFilteredTable);
    entryDropdown.addEventListener("change", renderFilteredTable);
    resultContainer.style.display = "block";

    document.getElementById("download-report-btn").addEventListener("click", () => {
      const table = document.querySelector("#model-deviation-table table");
      if (!table) {
        alert("⚠️ No table found to download.");
        return;
      }

      let csv = [];
      const rows = table.querySelectorAll("tr");

      rows.forEach(row => {
        const cols = row.querySelectorAll("td, th");
        const rowData = Array.from(cols).map(col => `"${col.textContent.trim()}"`);
        csv.push(rowData.join(","));
      });

      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Prediction_Report.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    });


    // Chart & Alerts
    const chartSection = document.getElementById("chart-section-wrapper");
    const dropdown = document.getElementById("chart-target-dropdown");
    const canvas = document.getElementById("step3Chart");
    const alertBox = document.getElementById("alert-box");

    document.querySelector(".step-btn").onclick = () => {
      stepThree.classList.add("active");
      stepLine2.classList.add("activated");
      chartSection.style.display = "block";
      chartSection.scrollIntoView({ behavior: "smooth" });

      dropdown.innerHTML = allTargets.map(t => `<option value="${t}">${t}</option>`).join("");
      renderChartAndAlerts(dropdown.value);

      dropdown.addEventListener("change", () => {
        renderChartAndAlerts(dropdown.value);
      });

      document.getElementById("chart-entry-dropdown").addEventListener("change", () => {
        renderChartAndAlerts(dropdown.value);
      });

      // ✅ FINAL FIX
      document.getElementById("apply-btn").addEventListener("click", applyDateFilter);
      document.getElementById("reset-btn").addEventListener("click", resetChartDate);
    };

    function renderChartAndAlerts(target) {
      const mae = window.targetMetrics?.[target]?.mae || 0;
      const entryDropdown = document.getElementById("chart-entry-dropdown");

      // ✅ Dynamically detect feature columns not in prediction set
      const resultData = window.resultData;
      const knownCols = ["Timestamp", ...Object.keys(window.targetMetrics).flatMap(t => [
        `Actual_${t}`, `Predicted_${t}`, `Deviation_${t}`
      ])];
      const sampleRow = resultData[0] || {};
      const features = Object.keys(sampleRow).filter(k => !knownCols.includes(k));
      window.fixedFeatureList = features;

      console.log("🧪 Features extracted:", features);
      console.log("🧪 Sample resultData[0]:", resultData[0]);

      // 💾 Prepare full chart data
      window.fullChartData = resultData.map((row, idx) => {
        const actual = row[`Actual_${target}`];
        const predicted = row[`Predicted_${target}`];
        return {
          index: idx + 1,
          actual,
          predicted,
          upper: predicted + 4 * mae,
          lower: predicted - 7 * mae,
          timestamp: row["Timestamp"] || `Row ${idx + 1}`
        };
      });

      const limit = entryDropdown.value === "all"
        ? window.fullChartData.length
        : parseInt(entryDropdown.value);

      window.chartData = window.fullChartData.slice(0, limit);

      // ✅ Plotly Chart
      Plotly.newPlot('step3Chart', [
        {
          x: window.chartData.map(d => d.timestamp),
          y: window.chartData.map(d => d.actual),
          mode: 'lines',
          name: 'Actual',
          line: { color: '#ff0000' }
        },
        {
          x: window.chartData.map(d => d.timestamp),
          y: window.chartData.map(d => d.predicted),
          mode: 'lines',
          name: 'Predicted',
          line: { color: '#00c853' }
        },
        {
          x: window.chartData.map(d => d.timestamp),
          y: window.chartData.map(d => d.upper),
          mode: 'lines',
          name: 'Upper Bound',
          line: { dash: 'dash', color: '#999' }
        },
        {
          x: window.chartData.map(d => d.timestamp),
          y: window.chartData.map(d => d.lower),
          mode: 'lines',
          name: 'Lower Bound',
          line: { dash: 'dash', color: '#999' }
        }
      ], {
        title: `Prediction vs Actual - ${target}`,
        xaxis: { title: 'Timestamp', tickangle: -45, automargin: true },
        yaxis: { title: 'Value' },
        margin: { t: 40, l: 50, r: 20, b: 80 },
        legend: { orientation: 'h', x: 0.5, xanchor: 'center' }
      }, { responsive: true });

      // ✅ Setup calendar bounds
      const fullTimestamps = resultData
        .map(r => new Date((r.Timestamp || "").replace(" ", "T")))
        .filter(d => !isNaN(d));
      if (fullTimestamps.length > 0) {
        const minDate = new Date(Math.min(...fullTimestamps));
        const maxDate = new Date(Math.max(...fullTimestamps));
        const minStr = minDate.toISOString().split("T")[0];
        const maxStr = maxDate.toISOString().split("T")[0];

        const startInput = document.getElementById("start-date");
        const endInput = document.getElementById("end-date");
        startInput.min = endInput.min = minStr;
        startInput.max = endInput.max = maxStr;
        startInput.value ||= minStr;
        endInput.value ||= maxStr;

        document.getElementById("date-filter").style.display = "block";
      }

      // ✅ Alert table below chart
      const outliers = window.chartData.filter(d => d.actual > d.upper || d.actual < d.lower);
      const alertBox = document.getElementById("alert-box");
      alertBox.innerHTML = "";

      if (outliers.length === 0) {
        alertBox.innerHTML = `<div>✅ All predictions are within bounds.</div>`;
      } else {
        const table = document.createElement("table");
        table.className = "alert-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        ["Timestamp", "Actual", "Predicted", "Deviation", ...features].forEach(h => {
          const th = document.createElement("th");
          th.textContent = h;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        outliers.forEach(d => {
          const original = resultData[d.index - 1];
          const tr = document.createElement("tr");

          [d.timestamp, d.actual, d.predicted, Math.abs(d.actual - d.predicted).toFixed(4)].forEach((val, i) => {
            const td = document.createElement("td");
            td.textContent = val;
            if (i === 2) td.classList.add("alert-predicted");
            tr.appendChild(td);
          });

          features.forEach(f => {
            const key = Object.keys(original).find(k => k.toLowerCase() === f.toLowerCase());
            const td = document.createElement("td");
            td.textContent = key ? original[key] : "--";
            tr.appendChild(td);
          });

          table.appendChild(tr);
        });

        alertBox.appendChild(table);

        // ✅ Add download button only if outliers exist
        const btnWrapper = document.createElement("div");
        btnWrapper.style.textAlign = "center";
        btnWrapper.style.marginTop = "20px";

        const csvBtn = document.createElement("button");
        csvBtn.className = "download-btn";
        csvBtn.innerHTML = "📄 Export Table as CSV";
        csvBtn.onclick = downloadAlertCSV;

        btnWrapper.appendChild(csvBtn);
        const alertBtnContainer = document.getElementById("alert-button-container");
        alertBtnContainer.innerHTML = ""; // clear previous
        alertBtnContainer.appendChild(btnWrapper);
      }

      // ✅ Save export data with exact field matching
      window.alertExportData = outliers.map(d => {
        const original = resultData[d.index - 1];
        const exportRow = {
          Timestamp: d.timestamp,
          Actual: d.actual,
          Predicted: d.predicted,
          Deviation: Math.abs(d.actual - d.predicted).toFixed(4)
        };

        if (original && features && features.length > 0) {
          features.forEach(f => {
            const key = Object.keys(original).find(k => k.toLowerCase() === f.toLowerCase());
            exportRow[f] = key && original[key] !== undefined ? original[key] : "--";
          });
        }

        return exportRow;
      });

      console.log("🔎 Sample row with features:", resultData[outliers[0].index - 1]);
      console.log("🧪 Final alertExportData sample:", window.alertExportData[0]);
    }

  } catch (err) {
    hideLoaderVisual();
    const errorBox = document.createElement("div");
    errorBox.className = "status-box error";
    errorBox.textContent = "❌ Exception: " + err.message;
    previewContainer.insertAdjacentElement("afterend", errorBox);
  }
}

function downloadAlertsAsExcel() {
  if (!predictionData || !predictionData.length) return;

  const selectedTarget = document.getElementById("chart-target-dropdown").value;
  if (!selectedTarget) return;

  const data = predictionData.map(row => ({
    Timestamp: row.Timestamp || '',
    Actual: row[`Actual_${selectedTarget}`],
    Predicted: row[`Predicted_${selectedTarget}`],
    Deviation: row[`Deviation_${selectedTarget}`],
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Alerts");

  XLSX.writeFile(workbook, "Prediction_Alerts_Report.xlsx");
}


function renderStepThree(results) {
  const step3 = document.getElementById("step-three");
  const stepLine2 = document.getElementById("step-line-2");
  const chartContainer = document.getElementById("chart-section-wrapper");
  const alertBox = document.getElementById("alert-box");

  // Show Step 3
  step3.classList.add("active");
  stepLine2.classList.add("activated");
  chartContainer.style.display = "block";

  const targets = Object.keys(results[0])
    .filter(k => k.startsWith("Predicted_"))
    .map(k => k.replace("Predicted_", ""));

  // Fill dropdown
  const targetDropdown = document.getElementById("chart-target-dropdown");
  targetDropdown.innerHTML = targets.map(t => `<option value="${t}">${t}</option>`).join("");

  // Bind dropdown + toggle checkboxes
  targetDropdown.onchange = () => updateChartForTarget(targetDropdown.value, results);
  bindChartToggles(results);

  // Initial chart render
  updateChartForTarget(targets[0], results);
}

function updateChartForTarget(target, results) {
  const ctx = document.getElementById("step3Chart").getContext("2d");

  const data = results.map((row, idx) => ({
    index: idx + 1,
    actual: row[`Actual_${target}`],
    predicted: row[`Predicted_${target}`],
    upper: row[`Actual_${target}`] + 3,
    lower: row[`Actual_${target}`] - 3
  }));

  window.fullChartData = data;

  const showActual = document.querySelector(".chart-toggle[value='actual']").checked;
  const showPredicted = document.querySelector(".chart-toggle[value='predicted']").checked;
  const showUpper = document.querySelector(".chart-toggle[value='upper']").checked;
  const showLower = document.querySelector(".chart-toggle[value='lower']").checked;

  const labels = data.map(d => d.index);
  const datasets = [];

  if (showActual) {
    datasets.push({
      label: "Actual",
      data: data.map(d => d.actual),
      borderColor: "#ff0000",
      fill: false,
      tension: 0.3
    });
  }

  if (showPredicted) {
    datasets.push({
      label: "Predicted",
      data: data.map(d => d.predicted),
      borderColor: "#00c853",
      fill: false,
      tension: 0.3
    });
  }

  if (showUpper) {
    datasets.push({
      label: "Upper Bound",
      data: data.map(d => d.upper),
      borderColor: "#999",
      borderDash: [5, 5],
      fill: false
    });
  }

  if (showLower) {
    datasets.push({
      label: "Lower Bound",
      data: data.map(d => d.lower),
      borderColor: "#999",
      borderDash: [5, 5],
      fill: false
    });
  }

  if (window.predChart) window.predChart.destroy();

  window.predChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { title: { display: true, text: "Row Index" } },
        y: { title: { display: true, text: "Value" } }
      }
    }
  });

  // Alerts
  const alertBox = document.getElementById("alert-box");
  alertBox.innerHTML = "";
  const alerts = data.filter(d => d.actual > d.upper || d.actual < d.lower);
  if (alerts.length) {
    alertBox.innerHTML = `<ul>${alerts.map(a => `<li>Row ${a.index}: Actual ${a.actual} is OUT OF BOUNDS (±3)</li>`).join("")}</ul>`;
    alertBox.style.display = "block";
  } else {
    alertBox.style.display = "none";
  }
}

function bindChartToggles(results) {
  document.querySelectorAll(".chart-toggle").forEach(toggle => {
    toggle.addEventListener("change", () => {
      const selected = document.getElementById("chart-target-dropdown").value;
      updateChartForTarget(selected, results);
    });
  });
}

// ----------------------------------
// ✅ Descriptive Summary Button Handler
// ----------------------------------
function openDescriptiveSummary() {
  if (!window.excelData || window.excelData.length === 0) {
    alert("Please upload a file first.");
    return;
  }

  localStorage.setItem("uploadedCSV", JSON.stringify(window.excelData));
  window.open("summary.html", "_blank");
}


// ✅ This block is the only one needed for proper alert report download

document.getElementById("download-alerts-btn").addEventListener("click", () => {
  console.log("🟢 Download button clicked");
  if (!window.alertExportData || window.alertExportData.length === 0) {
    alert("⚠️ No alert data to download.");
    return;
  }

  const headers = Object.keys(window.alertExportData[0]);
  const csvRows = [headers.join(",")];

  window.alertExportData.forEach(row => {
    const values = headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`);
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Alerts_Report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function setup3DVisualization(rawData) {
  const features = Object.keys(rawData[0]).filter(k =>
    !k.startsWith("Predicted_") &&
    !k.startsWith("Deviation_") &&
    !k.startsWith("Timestamp") &&
    typeof rawData[0][k] === 'number'
  );

  const targets = Object.keys(rawData[0]).filter(k =>
    k.startsWith("Actual_") && typeof rawData[0][k] === 'number'
  );

  const targetDropdown = document.getElementById("viz-target-dropdown");
  const xDropdown = document.getElementById("viz-x-dropdown");
  const yDropdown = document.getElementById("viz-y-dropdown");

  targets.forEach(t => targetDropdown.append(new Option(t, t)));
  features.forEach(f => {
    xDropdown.append(new Option(f, f));
    yDropdown.append(new Option(f, f));
  });

  function render3D() {
    const target = targetDropdown.value;
    const xFeature = xDropdown.value;
    const yFeature = yDropdown.value;

    const x = rawData.map(d => d[xFeature]);
    const y = rawData.map(d => d[yFeature]);
    const z = rawData.map(d => d[target]);

    const trace = {
      x, y, z,
      mode: 'markers',
      type: 'scatter3d',
      marker: {
        size: 4,
        color: z,
        colorscale: 'Viridis',
        opacity: 0.8
      }
    };

    const layout = {
      margin: { l: 0, r: 0, b: 0, t: 0 },
      scene: {
        xaxis: { title: xFeature },
        yaxis: { title: yFeature },
        zaxis: { title: target }
      }
    };

    Plotly.newPlot('plotly-3d-container', [trace], layout);
  }

  targetDropdown.onchange = render3D;
  xDropdown.onchange = render3D;
  yDropdown.onchange = render3D;

  setTimeout(render3D, 500); // initial plot
}

function uploadAndGoToDashboard() {
  const fileInput = document.getElementById('excelFile');
  const file = fileInput.files[0];
  if (!file) {
    alert("Please upload a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        window.location.href = data.redirect_url;
      } else {
        alert("Upload failed");
      }
    });
}

function showLoaderVisual() {
  const previewContainer = document.getElementById("preview-container");

  // Remove old loaders
  document.querySelectorAll(".loader-visual").forEach(el => el.remove());

  const statusBox = document.createElement("div");
  statusBox.className = "status-box loader-visual";
  statusBox.innerHTML = `
    <div class="loader-text">
      <span class="spinner">⏳</span> Uploading and predicting...
    </div>
    <div class="progress-fill"></div>
  `;
  previewContainer.insertAdjacentElement("afterend", statusBox);
}

function hideLoaderVisual() {
  document.querySelectorAll(".loader-visual").forEach(el => el.remove());
}

function plotFilteredChart(data, target) {
  console.log("🎯 Redrawing chart with", data.length, "points for target:", target);

  // Plot traces
  const traceActual = {
    x: data.map(d => d.timestamp),
    y: data.map(d => d.actual),
    mode: 'lines',
    name: 'Actual',
    line: { color: '#ff0000' }
  };

  const tracePredicted = {
    x: data.map(d => d.timestamp),
    y: data.map(d => d.predicted),
    mode: 'lines',
    name: 'Predicted',
    line: { color: '#00c853' }
  };

  const traceUpper = {
    x: data.map(d => d.timestamp),
    y: data.map(d => d.upper),
    mode: 'lines',
    name: 'Upper Bound',
    line: { dash: 'dash', color: '#999' }
  };

  const traceLower = {
    x: data.map(d => d.timestamp),
    y: data.map(d => d.lower),
    mode: 'lines',
    name: 'Lower Bound',
    line: { dash: 'dash', color: '#999' }
  };

  const layout = {
    title: `Prediction vs Actual - ${target}`,
    xaxis: {
      title: 'Timestamp',
      tickangle: -45,
      automargin: true
    },
    yaxis: { title: 'Value' },
    margin: { t: 40, l: 50, r: 20, b: 80 },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center' }
  };

  Plotly.newPlot("step3Chart", [traceActual, tracePredicted, traceUpper, traceLower], layout, { responsive: true });

  // Alert logic
  const alertBox = document.getElementById("alert-box");
  const outliers = data.filter(d => d.actual > d.upper || d.actual < d.lower);
  // ✅ Update alertExportData for filtered chart
  window.alertExportData = outliers.map(d => {
    const row = window.resultData[d.index - 1];
    const exportRow = {
      Timestamp: d.timestamp,
      Actual: d.actual,
      Predicted: d.predicted,
      Deviation: Math.abs(d.actual - d.predicted).toFixed(4)
    };

    const features = window.fixedFeatureList;
    features.forEach(f => {
      const key = Object.keys(row).find(k => k.toLowerCase() === f.toLowerCase());
      exportRow[f] = key ? row[key] : "--";
    });

    return exportRow;
  });
  const features = window.fixedFeatureList;
  alertBox.innerHTML = "";

  if (outliers.length === 0) {
    alertBox.innerHTML = `<div>✅ All predictions are within bounds.</div>`;
  } else {
    const table = document.createElement("table");
    table.className = "alert-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Timestamp", "Actual", "Predicted", "Deviation", ...features].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    outliers.forEach(d => {
      const row = window.resultData[d.index - 1]; // ✅ CORRECTED: get full row from original dataset
      const tr = document.createElement("tr");

      [d.timestamp, d.actual, d.predicted, Math.abs(d.actual - d.predicted).toFixed(4)].forEach((val, i) => {
        const td = document.createElement("td");
        td.textContent = val;
        if (i === 2) td.classList.add("alert-predicted");
        tr.appendChild(td);
      });

      features.forEach(f => {
        const key = Object.keys(row).find(k => k.toLowerCase() === f.toLowerCase());
        const td = document.createElement("td");
        td.textContent = key ? row[key] : "--";
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    alertBox.appendChild(table);

    // ✅ Re-add download button after filtering
    const btnWrapper = document.createElement("div");
    btnWrapper.style.textAlign = "center";
    btnWrapper.style.marginTop = "20px";

    const csvBtn = document.createElement("button");
    csvBtn.className = "download-btn";
    csvBtn.innerHTML = "📄 Export Table as CSV";
    csvBtn.onclick = downloadAlertCSV;

    btnWrapper.appendChild(csvBtn);
    const alertBtnContainer = document.getElementById("alert-button-container");
    alertBtnContainer.innerHTML = ""; // clear previous
    alertBtnContainer.appendChild(btnWrapper);
  }
}


function applyDateFilter() {
  console.log("✅ Apply clicked");
  const start = new Date(document.getElementById("start-date").value);
  const endRaw = document.getElementById("end-date").value;
  const end = new Date(new Date(endRaw).setHours(23, 59, 59, 999));
  const target = document.getElementById("chart-target-dropdown")?.value;

  if (!target || !window.fullChartData) return;

  const filtered = window.fullChartData.filter(d => {
    let ts;
    try {
      ts = typeof d.timestamp === 'string'
        ? new Date(d.timestamp.replace(" ", "T"))
        : new Date(d.timestamp);

      if (isNaN(ts.getTime())) {
        console.warn("❌ Invalid timestamp:", d.timestamp);
        return false;
      }
    } catch (err) {
      console.error("❌ Failed to parse timestamp:", d.timestamp);
      return false;
    }

    return ts >= start && ts <= end;
  });

  console.log("Filtered Length:", filtered.length);
  if (filtered.length === 0) {
    alert("⚠️ Data not available for this duration.");
    return;
  }

  plotFilteredChart(filtered, target);
}


function resetChartDate() {
  const target = document.getElementById("chart-target-dropdown")?.value;
  if (!target || !window.fullChartData) return;

  plotFilteredChart(window.fullChartData, target);

  const timestamps = window.fullChartData.map(d => new Date(d.timestamp.replace(" ", "T"))).filter(Boolean);
  const min = new Date(Math.min(...timestamps));
  const max = new Date(Math.max(...timestamps));

  document.getElementById("start-date").value = min.toISOString().split("T")[0];
  document.getElementById("end-date").value = max.toISOString().split("T")[0];
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("apply-btn")?.addEventListener("click", applyDateFilter);
  document.getElementById("reset-btn")?.addEventListener("click", resetChartDate);
});



function downloadAlertCSV() {
  if (!window.alertExportData || window.alertExportData.length === 0) {
    alert("⚠️ No alert data to export.");
    return;
  }

  const headers = Object.keys(window.alertExportData[0]);
  const csvRows = [headers.join(",")];

  window.alertExportData.forEach(row => {
    const values = headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`);
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Alerts_Report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}