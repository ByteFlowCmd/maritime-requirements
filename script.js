// Maritime Requirements Web App - Main Script

class MaritimeApp {
  constructor() {
    this.currentData = null;
    this.allFlags = {};
    this.selectedFlags = [];
    this.init();
  }

  init() {
    // Load data and initialize UI
    this.loadData();
    this.setupEventListeners();
    this.updateStats();
  }

  loadData() {
    // Load all available maritime data
    this.allFlags = window.MARITIME_DATA || {};

    // Set current data to first available flag
    const firstFlag = Object.keys(this.allFlags)[0];
    if (firstFlag) {
      this.currentData = this.allFlags[firstFlag];
    }

    this.populateDropdowns();
  }

  setupEventListeners() {
    // Search button
    document.getElementById("search-btn").addEventListener("click", () => {
      this.performSearch();
    });

    // Clear button
    document.getElementById("clear-btn").addEventListener("click", () => {
      this.clearSearch();
    });

    // Compare button
    document.getElementById("compare-btn").addEventListener("click", () => {
      this.showComparisonView();
    });

    // Flag selection change
    document.getElementById("flag-select").addEventListener("change", (e) => {
      this.onFlagChange(e.target.value);
    });

    // Search input enter key
    document
      .getElementById("requirement-search")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.performSearch();
        }
      });
  }

  populateDropdowns() {
    const flagSelect = document.getElementById("flag-select");
    const rankSelect = document.getElementById("rank-select");

    // Clear existing options
    flagSelect.innerHTML = '<option value="">Choose a flag...</option>';
    rankSelect.innerHTML = '<option value="">Choose a rank...</option>';

    // Populate flags
    Object.keys(this.allFlags).forEach((flagCode) => {
      const flagData = this.allFlags[flagCode];
      const option = document.createElement("option");
      option.value = flagCode;
      option.textContent = flagData.flagName;
      flagSelect.appendChild(option);
    });

    // Populate ranks (using current data)
    if (this.currentData) {
      Object.keys(this.currentData.ranks).forEach((rank) => {
        const option = document.createElement("option");
        option.value = rank;
        option.textContent = rank;
        rankSelect.appendChild(option);
      });
    }
  }

  onFlagChange(flagCode) {
    if (flagCode && this.allFlags[flagCode]) {
      this.currentData = this.allFlags[flagCode];
      this.populateRanks();
      this.updateStats();
    }
  }

  populateRanks() {
    const rankSelect = document.getElementById("rank-select");
    rankSelect.innerHTML = '<option value="">Choose a rank...</option>';

    if (this.currentData) {
      Object.keys(this.currentData.ranks).forEach((rank) => {
        const option = document.createElement("option");
        option.value = rank;
        option.textContent = rank;
        rankSelect.appendChild(option);
      });
    }
  }

  updateStats() {
    const totalFlags = Object.keys(this.allFlags).length;
    const totalRanks = this.currentData
      ? Object.keys(this.currentData.ranks).length
      : 0;
    const totalRequirements = this.currentData
      ? this.currentData.requirements.length
      : 0;

    document.getElementById("total-flags").textContent = totalFlags;
    document.getElementById("total-ranks").textContent = totalRanks;
    document.getElementById("total-requirements").textContent =
      totalRequirements;
  }

  performSearch() {
    const flagCode = document.getElementById("flag-select").value;
    const rank = document.getElementById("rank-select").value;
    const searchTerm = document
      .getElementById("requirement-search")
      .value.toLowerCase()
      .trim();

    if (!flagCode && !rank && !searchTerm) {
      alert("Please select a flag, rank, or enter a search term");
      return;
    }

    this.showLoading(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      this.displaySearchResults(flagCode, rank, searchTerm);
      this.showLoading(false);
    }, 500);
  }

  displaySearchResults(flagCode, rank, searchTerm) {
    const resultsSection = document.getElementById("results-section");
    const resultsTitle = document.getElementById("results-title");
    const resultsSummary = document.getElementById("results-summary");
    const requirementsGrid = document.getElementById("requirements-grid");

    // Show results section
    resultsSection.style.display = "block";
    document.getElementById("single-results").style.display = "block";
    document.getElementById("comparison-results").style.display = "none";

    let results = [];
    let flagData = null;

    if (flagCode) {
      flagData = this.allFlags[flagCode];
      results = flagData.requirements;
    } else if (this.currentData) {
      flagData = this.currentData;
      results = this.currentData.requirements;
    }

    // Filter by search term
    if (searchTerm) {
      results = results.filter(
        (req) =>
          req.name.toLowerCase().includes(searchTerm) ||
          req.category.toLowerCase().includes(searchTerm) ||
          req.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by rank
    if (rank) {
      results = results.filter((req) => req.ranks[rank]);
    }

    // Update title and summary
    let title = "Search Results";
    let summary = "";

    if (flagData && rank) {
      title = `Requirements for ${rank} - ${flagData.flagName}`;
      summary = `Found ${results.length} requirements`;
    } else if (flagData) {
      title = `Requirements for ${flagData.flagName}`;
      summary = `Found ${results.length} requirements`;
    } else if (searchTerm) {
      title = `Search Results for "${searchTerm}"`;
      summary = `Found ${results.length} requirements`;
    }

    resultsTitle.textContent = title;
    resultsSummary.textContent = summary;

    // Display results
    requirementsGrid.innerHTML = "";

    if (results.length === 0) {
      requirementsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No requirements found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
      return;
    }

    results.forEach((requirement) => {
      const reqElement = this.createRequirementElement(
        requirement,
        rank,
        flagData
      );
      requirementsGrid.appendChild(reqElement);
    });

    // Add animation
    resultsSection.classList.add("fade-in");
  }

  createRequirementElement(requirement, selectedRank, flagData) {
    const div = document.createElement("div");
    div.className = "requirement-item";

    let status = "N/A";
    let statusClass = "status-na";

    if (selectedRank && requirement.ranks[selectedRank]) {
      const value = requirement.ranks[selectedRank];
      if (value === "M") {
        status = "Mandatory";
        statusClass = "status-mandatory";
      } else if (value === "R") {
        status = "Recommended";
        statusClass = "status-recommended";
      }
    }

    // Count how many ranks require this
    const applicableRanks = Object.keys(requirement.ranks).filter(
      (rank) => requirement.ranks[rank] && requirement.ranks[rank] !== ""
    );

    const mandatoryCount = Object.keys(requirement.ranks).filter(
      (rank) => requirement.ranks[rank] === "M"
    ).length;

    const recommendedCount = Object.keys(requirement.ranks).filter(
      (rank) => requirement.ranks[rank] === "R"
    ).length;

    div.innerHTML = `
            <div class="requirement-header">
                <div class="requirement-name">${requirement.name}</div>
                ${
                  selectedRank
                    ? `<span class="requirement-status ${statusClass}">${status}</span>`
                    : ""
                }
            </div>
            <div class="requirement-details">
                <div><strong>Category:</strong> ${requirement.category}</div>
                <div><strong>Description:</strong> ${
                  requirement.description
                }</div>
                ${
                  requirement.stcw
                    ? `<div><strong>STCW Reference:</strong> ${requirement.stcw}</div>`
                    : ""
                }
                <div><strong>Applicable to:</strong> ${
                  applicableRanks.length
                } ranks 
                    (${mandatoryCount} mandatory, ${recommendedCount} recommended)
                </div>
            </div>
        `;

    return div;
  }

  showComparisonView() {
    // For now, show a placeholder since we only have one flag
    // This will be expanded when more flags are added
    const flagSelect = document.getElementById("flag-select");

    if (!flagSelect.value) {
      alert("Please select at least one flag to compare");
      return;
    }

    // Show comparison placeholder
    const resultsSection = document.getElementById("results-section");
    const resultsTitle = document.getElementById("results-title");
    const resultsSummary = document.getElementById("results-summary");

    resultsSection.style.display = "block";
    document.getElementById("single-results").style.display = "none";
    document.getElementById("comparison-results").style.display = "block";

    resultsTitle.textContent = "Flag Comparison";
    resultsSummary.textContent =
      "Comparison feature will be available when multiple flags are loaded";

    const comparisonTable = document.getElementById("comparison-table");
    comparisonTable.innerHTML = `
            <thead>
                <tr>
                    <th>Requirement</th>
                    <th>Antigua & Barbuda</th>
                    <th style="opacity: 0.5;">More flags coming soon...</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="3" style="text-align: center; padding: 2rem; color: #718096;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Flag comparison will be available when multiple flag datasets are loaded.<br>
                        Add more flag data files to enable this feature.
                    </td>
                </tr>
            </tbody>
        `;
  }

  clearSearch() {
    document.getElementById("flag-select").value = "";
    document.getElementById("rank-select").value = "";
    document.getElementById("requirement-search").value = "";
    document.getElementById("results-section").style.display = "none";

    // Reset to first flag
    const firstFlag = Object.keys(this.allFlags)[0];
    if (firstFlag) {
      this.currentData = this.allFlags[firstFlag];
      this.populateRanks();
      this.updateStats();
    }
  }

  showLoading(show) {
    const overlay = document.getElementById("loading-overlay");
    overlay.style.display = show ? "flex" : "none";
  }
}

// Global search function for requirement text
function searchRequirements(searchTerm, flagData) {
  if (!searchTerm || !flagData) return [];

  const term = searchTerm.toLowerCase();
  return flagData.requirements.filter(
    (req) =>
      req.name.toLowerCase().includes(term) ||
      req.category.toLowerCase().includes(term) ||
      req.description.toLowerCase().includes(term) ||
      (req.stcw && req.stcw.toLowerCase().includes(term))
  );
}

// Utility functions
function getRequirementsByRank(rank, flagData) {
  if (!rank || !flagData) return [];

  return flagData.requirements.filter((req) => req.ranks[rank]);
}

function getStatusIcon(status) {
  switch (status) {
    case "M":
      return "✅";
    case "R":
      return "💡";
    default:
      return "❌";
  }
}

function getStatusText(status) {
  switch (status) {
    case "M":
      return "Mandatory";
    case "R":
      return "Recommended";
    default:
      return "Not Required";
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if data is available
  if (!window.MARITIME_DATA || Object.keys(window.MARITIME_DATA).length === 0) {
    console.error(
      "No maritime data found. Please ensure data files are loaded."
    );
    return;
  }

  // Initialize the app
  window.maritimeApp = new MaritimeApp();

  console.log("Maritime Requirements App initialized");
  console.log("Available flags:", Object.keys(window.MARITIME_DATA));
});
