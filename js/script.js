const width = 1500;
const height = 750;
let homeWins = 0;
let awayWins = 0;

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

function cleanName(str) {
  if (!str) return "";
  const index = str.indexOf("<");
  let cleaned = index === -1 ? str : str.slice(0, index);
  return cleaned === "Home win" || cleaned === "Away win" ? "" : cleaned;
}

function init() {
  if (localStorage.getItem("numTrees") === null) {
    localStorage.setItem("numTrees", 5);
  }

  if (localStorage.getItem("depth") === null) {
    localStorage.setItem("depth", 4);
  }

  d3.json("random_forest.json")
    .then((data) => {
      const trees = data[0].children;
      // const numTrees = trees.length;
      const maxTreeWidth = 900;
      const treeHeight = 650;

      // Clear any previous trees
      d3.select("#vis").html("");

      trees.forEach((treeData) => {
        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().size([maxTreeWidth - 40, treeHeight]);
        treeLayout(root);

        // Create a container div for each tree
        const treeContainer = d3
          .select("#vis")
          .append("div")
          .style("display", "inline-block")
          .style("margin", "10px")
          .style("vertical-align", "top")
          .style("border", "1px solid #ddd")
          .style("padding", "10px")
          .style("background", "#f9f9f9")
          .style("border-radius", "8px");

        const svg = treeContainer
          .append("svg")
          .attr("width", maxTreeWidth)
          .attr("height", treeHeight + 150);

        // Tooltip
        const tooltip = treeContainer
          .append("div")
          .style("position", "absolute")
          .style("background", "#fff")
          .style("border", "1px solid #999")
          .style("padding", "5px 8px")
          .style("border-radius", "6px")
          .style("pointer-events", "none")
          .style("font-size", "12px")
          .style("opacity", 0);

        const g = svg.append("g").attr("transform", `translate(20, 100)`);

        const link = g
          .selectAll(".link")
          .data(root.links())
          .enter()
          .append("line")
          .attr("class", "link")
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)
          .attr("stroke", "#ccc")
          .attr("stroke-width", 3)
          .style("opacity", 0);

        const node = g
          .selectAll(".node")
          .data(root.descendants())
          .enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .style("opacity", 0);

        node
          .append("circle")
          .attr("r", 13)
          .attr("fill", (d) => {
            if (d.data.name === "Home win") {
              homeWins++;
              document.getElementById(
                "home"
              ).innerHTML = `<strong>Home Wins:</strong> ${homeWins}`;
              return "#69b3a2";
            } else if (d.data.name === "Away win") {
              awayWins++;
              document.getElementById(
                "away"
              ).innerHTML = `<strong>Away Wins:</strong> ${awayWins}`;
              return "#ff6347";
            } else return "#ADD8E6";
          })
          .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(d.data.name)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 28}px`);
          })
          .on("mouseout", () => {
            tooltip.transition().duration(300).style("opacity", 0);
          });

        node
          .append("text")
          .attr("dy", -20)
          .attr("text-anchor", "middle")
          .text((d) => cleanName(d.data.name))
          .style("font-size", "15px");

        // Animate depth-by-depth
        const maxDepth = d3.max(root.descendants(), (d) => d.depth);
        const timing = 1500;
        for (let depth = 0; depth <= maxDepth; depth++) {
          setTimeout(() => {
            node
              .filter((d) => d.depth === depth)
              .transition()
              .duration(timing)
              .style("opacity", 1);

            link
              .filter((d) => d.target.depth === depth)
              .transition()
              .duration(timing)
              .style("opacity", 1);
          }, depth * timing);
        }
      });

      // Add legend only once
      const legend = d3
        .select("#vis")
        .append("div")
        .style("margin-top", "20px");

      legend
        .append("div")
        .html(
          `<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home win`
        );

      legend
        .append("div")
        .html(
          `<span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away win`
        );
    })
    .catch((error) =>
      console.error("Error loading random_forest.json:", error)
    );
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
