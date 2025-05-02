let trees = [];
let currentTreeIndex = 0;
let homeWins = 0;
let awayWins = 0;

function cleanName(str) {
  if (!str) return "";
  const index = str.indexOf("<");
  let cleaned = index === -1 ? str : str.slice(0, index);
  return cleaned === "Home win" || cleaned === "Away win" ? "" : cleaned;
}

// Function to render a single decision tree visualization
function renderSingleTree(treeData) {
  const maxTreeWidth = 1300;
  const treeHeight = 600;
  const timing = 800;  // Animation timing
  home_color = "#3CB371"
  away_color = "#ff6347"

  d3.select("#vis").html(""); // Clear any previous tree from the visualization area

  // Create a hierarchical structure
  const root = d3.hierarchy(treeData);

  // Create a tree layout
  const treeLayout = d3.tree().size([maxTreeWidth, treeHeight]);
  treeLayout(root);

  // Create SVG container
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", maxTreeWidth)
    .attr("height", treeHeight + 125);

  // Create tooltip for displaying node names on hover
  const tooltip = d3.select("#vis")
    .append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #999")
    .style("padding", "5px 8px")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("opacity", 0);

  // Center the tree horizontally
  const xOffset = (maxTreeWidth - d3.max(root.descendants(), (d) => d.x)) / 2 - 100;
  const g = svg.append("g").attr("transform", `translate(${xOffset}, 100)`);

  // Draw tree links (lines between nodes)
  const link = g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 3)
    .style("opacity", 0);

  // Draw tree nodes (circles)
  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("opacity", 0);

  // Draw circles for each node
  node.append("circle")
    .attr("r", 13)
    .attr("fill", d => {
      if (d.data.name === "Home win") {
        return home_color; // Greenish for Home win
      } else if (d.data.name === "Away win") {
        return away_color; // Red for Away win
      } else return "#ADD8E6"; // Light blue for other nodes
    })
    .on("mouseover", function (event, d) {  // Show tooltip on hover
      tooltip.transition().duration(100).style("opacity", 0.9);
      tooltip.html(d.data.name)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Add text labels to each node
  node.append("text")
    .attr("dy", -20)
    .attr("text-anchor", "middle")
    .text(d => cleanName(d.data.name))
    .style("fill", "grey")
    .style("font-weight", "bold")
    .style("font-size", "15px");

  // Animate nodes and links appearing depth-by-depth
  const maxDepth = d3.max(root.descendants(), d => d.depth);
  const delayPerDepth = timing;

  for (let depth = 0; depth <= maxDepth; depth++) {
    setTimeout(() => {
      node.filter(d => d.depth === depth)
        .transition()
        .duration(timing)
        .style("opacity", 1);

      link.filter(d => d.target.depth === depth)
        .transition()
        .duration(timing)
        .style("opacity", 1);
    }, depth * delayPerDepth);
  }

  // After animation, update home/away win counts
  setTimeout(() => { 
    const leaves = root.leaves();
  
    let homeWinCount = 0;
    let awayWinCount = 0;
    leaves.forEach(leaf => {
      if (leaf.data.name === "Home win") homeWinCount++;
      else if (leaf.data.name === "Away win") awayWinCount++;
    });
  
    let winner = null;
    if (homeWinCount > awayWinCount) winner = "Home";
    else if (awayWinCount > homeWinCount) winner = "Away";
    else winner = "Tie";

    
    const legend = d3.select("#legend").html(""); 
    legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home wins:${homeWinCount}`);
    legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away wins:${awayWinCount}`);

  
    const color = winner === "Home" ? home_color : (winner === "Away" ? away_color : "#800080");
  
    d3.selectAll("#forestSummary .summaryCircle")
      .filter((d, i) => i === currentTreeIndex)
      .transition()
      .duration(600)
      .style("background", color)
      .style("opacity", 1)
      .style("width", "40px")  
      .style("height", "40px") 
      .style("margin-top", "20px")
      .attr("title", `Tree ${currentTreeIndex + 1}: ${winner} win`);
  }, (maxDepth + 1) * delayPerDepth);
}

// Update navigation button states
function updateButtons() {
  document.getElementById("backBtn").disabled = currentTreeIndex === 0;
  document.getElementById("nextBtn").disabled = currentTreeIndex === trees.length - 1;
}

// Initialization function - loads trees and sets up UI
function init() {
  if (localStorage.getItem("numTrees") === null) {
    localStorage.setItem("numTrees", 5);
  }

  if (localStorage.getItem("depth") === null) {
    localStorage.setItem("depth", 4);
  }

  d3.json("random_forest.json")
  .then(data => {
    trees = data[0].children;
    currentTreeIndex = 0;
    renderSingleTree(trees[currentTreeIndex]);
    updateButtons();   

    // Create tooltip element for summary circles
    const tooltip = d3.select("body")
      .append("div")
      .attr("id", "summaryTooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #999")
      .style("padding", "5px 8px")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("opacity", 0);

    const summary = d3.select("#forestSummary").html("");

    // Precompute outcomes for each tree
    const treeOutcomes = trees.map(tree => {
      const root = d3.hierarchy(tree);
      const leaves = root.leaves();
      let homeWins = 0, awayWins = 0;
      leaves.forEach(leaf => {
        if (leaf.data.name === "Home win") homeWins++;
        else if (leaf.data.name === "Away win") awayWins++;
      });
      if (homeWins > awayWins) return "Home win";
      else if (awayWins > homeWins) return "Away win";
      else return "Tie";
    });

    summary.selectAll("div")
      .data(trees)
      .enter()
      .append("div")
      .attr("class", "summaryCircle")
      .style("width", "40px")
      .style("height", "40px")
      .style("border-radius", "50%")
      .style("background", "#eee")
      .style("border", "1px solid #333")
      .style("display", "inline-block")
      .style("margin", "0 6px")
      .style("margin-top", "20px")
      .style("opacity", 0.5)

      })
      .catch(error => console.error("Error loading random_forest.json:", error));

    }

    // Sends a request to backend to retrain Random Forest model
    async function getData(n, d) {
      const url = `http://localhost:5000/train?numTrees=${n}&depth=${d}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
      } catch (error) {
        console.error(error.message);
      }
    }

// Start initial loading
document.addEventListener("load", init());

// Setup DOM event listeners after page load
document.addEventListener("DOMContentLoaded", () => {
  const nTrees = document.getElementById("yearSlider");
  const depth = document.getElementById("depthSlider");

  const legend = d3.select("#legend").html(""); 
  legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home wins:`);
  legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away wins:`);

  nTrees.value = localStorage.getItem("numTrees");
  depth.value = localStorage.getItem("depth");

  nTrees.addEventListener("change", function (event) {
    localStorage.setItem("numTrees", event.target.value);
  });

  depth.addEventListener("change", function (event) {
    localStorage.setItem("depth", event.target.value);
  });

  document.getElementById("train").addEventListener("click", () => {
    getData(localStorage.getItem('numTrees'), localStorage.getItem('depth'));
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    if (currentTreeIndex > 0) {
      currentTreeIndex--;
      const legend = d3.select("#legend").html(""); 
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home wins:`);
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away wins:`);

      renderSingleTree(trees[currentTreeIndex]);
      updateButtons();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentTreeIndex < trees.length - 1) {
      currentTreeIndex++;
      const legend = d3.select("#legend").html(""); 
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home wins:`);
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away wins:`);

      renderSingleTree(trees[currentTreeIndex]);
      updateButtons();
    }
  });

  document.getElementById("toggleExplanation").addEventListener("click", () => {
    const descCol = document.querySelector(".descCol");
  
    if (!descCol) {
      alert("Explanation content not found.");
      return;
    }
  
    const explanationHTML = `
  <html>
    <head>
      <title>Explanation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          line-height: 1.6;
          background-color: #333232;
          color: white;
        }
        h3 {
          color: white;
        }
        ol li {
          margin-bottom: 10px;
        }
        strong {
          color: #ccc;
        }
        p {
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      ${descCol.innerHTML}
    </body>
  </html>
`;

  
    const popup = window.open("", "Explanation", "width=600,height=500");
    popup.document.write(explanationHTML);
    popup.document.close();
  });
  

  init();
});
