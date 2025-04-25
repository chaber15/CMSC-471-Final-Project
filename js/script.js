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

function renderSingleTree(treeData) {
  const maxTreeWidth = 1700;
  const treeHeight = 650;
  const timing = 1500;

  d3.select("#vis").html(""); // Clear previous tree

  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree().size([maxTreeWidth, treeHeight]);
  treeLayout(root);

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", maxTreeWidth)
    .attr("height", treeHeight + 150);

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

  const xOffset = (maxTreeWidth - d3.max(root.descendants(), (d) => d.x)) / 2 - 100;
  const g = svg.append("g").attr("transform", `translate(${xOffset}, 100)`);

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

  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("opacity", 0);

  node.append("circle")
    .attr("r", 13)
    .attr("fill", d => {
      if (d.data.name === "Home win") {
        homeWins++;
        document.getElementById("home").innerHTML = `<strong>Home Wins:</strong> ${homeWins}`;
        return "#69b3a2";
      } else if (d.data.name === "Away win") {
        awayWins++;
        document.getElementById("away").innerHTML = `<strong>Away Wins:</strong> ${awayWins}`;
        return "#ff6347";
      } else return "#ADD8E6";
    })
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(d.data.name)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  node.append("text")
    .attr("dy", -20)
    .attr("text-anchor", "middle")
    .text(d => cleanName(d.data.name))
    .style("font-size", "15px");

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
}

function updateButtons() {
  document.getElementById("backBtn").disabled = currentTreeIndex === 0;
  document.getElementById("nextBtn").disabled = currentTreeIndex === trees.length - 1;
}

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

      const legend = d3.select("#legend").html(""); // Clear if exists
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home win`);
      legend.append("div").html(`<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away win`);
    })
    .catch(error => console.error("Error loading random_forest.json:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  const nTrees = document.getElementById("yearSlider");
  const depth = document.getElementById("depthSlider");
  nTrees.value = localStorage.getItem("numTrees");
  depth.value = localStorage.getItem("depth");

  nTrees.addEventListener("change", function (event) {
    localStorage.setItem("numTrees", event.target.value);
    getData(nTrees.value, depth.value);
  });

  depth.addEventListener("change", function (event) {
    localStorage.setItem("depth", event.target.value);
    getData(nTrees.value, depth.value);
  });

  document.getElementById("away").innerHTML = `<strong>${awayWins}</strong>`;

  document.getElementById("backBtn").addEventListener("click", () => {
    if (currentTreeIndex > 0) {
      currentTreeIndex--;
      renderSingleTree(trees[currentTreeIndex]);
      updateButtons();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentTreeIndex < trees.length - 1) {
      currentTreeIndex++;
      renderSingleTree(trees[currentTreeIndex]);
      updateButtons();
    }
  });

  init();
});

async function getData(n, d) {
  const url = `http://localhost:5000/train?numTrees=${n}&depth=${d}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    console.log(json);
    // init();
  } catch (error) {
    console.error(error.message);
  }
}



document.addEventListener("load", init());

document.addEventListener("DOMContentLoaded", () => {
  const nTrees = document.getElementById("yearSlider");
  const depth = document.getElementById("depthSlider");
  nTrees.value = localStorage.getItem("numTrees");
  depth.value = localStorage.getItem("depth");

  nTrees.addEventListener("change", function (event) {
    localStorage.setItem("numTrees", event.target.value);
    getData(nTrees.value, depth.value);
  });

  depth.addEventListener("change", function (event) {
    localStorage.setItem("depth", event.target.value);
    getData(nTrees.value, depth.value);
  });
  document.getElementById("away").innerHTML = `<strong>${awayWins}</strong>`;
});
