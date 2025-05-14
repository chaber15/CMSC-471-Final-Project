let trees = [];
let currentTreeIndex = 0;
let homeWins = 0;
let awayWins = 0;
let root = null;
let test_games = [];

// ****** Clean-Up Functions ****** //
function cleanName(str) {
  if (!str) return "";
  const index = str.indexOf("<");
  let cleaned = index === -1 ? str : str.slice(0, index);
  return cleaned === "Home win" || cleaned === "Away win" ? "" : cleaned;
}

function clearHighlights() {
  const g = d3.select("#vis").select("g");

  g.selectAll(".node")
    .select("circle")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5);

  g.selectAll(".link").attr("stroke", "#ccc").attr("stroke-width", 3);
}
// ****** ------------------ ****** //

// ****** Path Functions ****** //

// Get The Leaf the Model Predicted
function getMatchingLeaf(test_path) {
  if (!root) return;
  let curr = root;
  for (let i = 0; i < test_path.length; i++) {
    children = curr.children;
    for (let c of children) {
      if (c.data.name === test_path[i]) {
        curr = c;
        break;
      }
    }
  }
  return curr;
}

// Highlight path to the leaf the model predicted
function highlightPathToLeaf(match) {
  clearHighlights();
  if (!root) return;

  let winner = match.data.name;

  if (winner === "Home win") homeWins++;
  else awayWins++;

  const g = d3.select("#vis").select("g");

  let current = match;
  const path = [];
  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  path.forEach((node, i) => {
    setTimeout(() => {
      g.selectAll(".node")
        .filter((d) => d === node)
        .select("circle")
        .attr("stroke", "gold")
        .attr("stroke-width", 4);

      if (i > 0) {
        g.selectAll(".link")
          .filter((d) => d.source === path[i - 1] && d.target === path[i])
          .attr("stroke", "gold")
          .attr("stroke-width", 4);
      }
    }, i * 600);
  });

  // After animation finishes, update summary + final result
  setTimeout(() => {
    const color =
      winner === "Home win"
        ? "#3CB371"
        : winner === "Away win"
        ? "#ff6347"
        : "#800080";

    d3.selectAll("#forestSummary .summaryCircle")
      .filter((d, i) => i === currentTreeIndex)
      .attr("data-tested", "true")
      .transition()
      .duration(600)
      .style("background", color)
      .style("opacity", 1)
      .style("width", "40px")
      .style("height", "40px")
      .style("margin-top", "20px")
      .attr("title", `Tree ${currentTreeIndex + 1}: ${winner}`);

    // Final forest result message (only if all trees are tested)
    const testedTrees = d3
      .selectAll("#forestSummary .summaryCircle")
      .filter(function () {
        return d3.select(this).attr("data-tested") === "true";
      })
      .size();

    if (testedTrees === trees.length) {
      const res = homeWins >= awayWins ? "HOME WINS!" : "AWAY WINS!";

      d3.select("#completionMessage").remove();
      d3.select("#forestSummary")
        .append("div")
        .attr("id", "completionMessage")
        .style("display", "inline-block")
        .style("margin-left", "10px")
        .style("margin-top", "15px")
        .style("color", res === "HOME WINS!" ? "#3CB371" : "#ff6347")
        .style("font-weight", "bold")
        .style("font-size", "18px")
        .style("text-align", "center")
        .text(res);
    }
  }, path.length * 600);
}
// ****** -------------- ****** //

// Function to render a single decision tree visualization
function renderSingleTree(treeData) {
  clearHighlights();
  const maxTreeWidth = 1300;
  const treeHeight = 600;
  const timing = 800;
  home_color = "#3CB371";
  away_color = "#ff6347";

  d3.select("#vis").html(""); // Clear any previous tree from the visualization area

  // Create a hierarchical structure
  root = d3.hierarchy(treeData);

  // Create a tree layout
  const treeLayout = d3.tree().size([maxTreeWidth, treeHeight]);
  treeLayout(root);

  // Create SVG container
  const svg = d3
    .select("#vis")
    .append("svg")
    .attr("width", maxTreeWidth)
    .attr("height", treeHeight + 125);

  // Create tooltip for displaying node names on hover
  const tooltip = d3
    .select("#vis")
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
  const xOffset =
    (maxTreeWidth - d3.max(root.descendants(), (d) => d.x)) / 2 - 100;
  const g = svg.append("g").attr("transform", `translate(${xOffset}, 100)`);

  // Draw tree links (lines between nodes)
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

  // Draw tree nodes (circles)
  const node = g
    .selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .style("opacity", 0);

  // Draw circles for each node
  node
    .append("circle")
    .attr("r", 13)
    .attr("fill", (d) => {
      if (d.data.name === "Home win") {
        return home_color; // Greenish for Home win
      } else if (d.data.name === "Away win") {
        return away_color; // Red for Away win
      } else return "#ADD8E6"; // Light blue for other nodes
    })
    .on("mouseover", function (event, d) {
      // Show tooltip on hover
      tooltip.transition().duration(100).style("opacity", 0.9);
      tooltip
        .html(d.data.name)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () =>
      tooltip.transition().duration(300).style("opacity", 0)
    );

  // Add text labels to each node
  node
    .append("text")
    .attr("dy", -20)
    .attr("text-anchor", "middle")
    .text((d) => cleanName(d.data.name))
    .style("fill", "grey")
    .style("font-weight", "bold")
    .style("font-size", "15px");

  // Animate nodes and links appearing depth-by-depth
  const maxDepth = d3.max(root.descendants(), (d) => d.depth);
  const delayPerDepth = timing;

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
    }, depth * delayPerDepth);
  }
}

function updateButtons() {
  document.getElementById("backBtn").disabled = currentTreeIndex === 0;
  document.getElementById("nextBtn").disabled =
    currentTreeIndex === trees.length - 1;
}

// ****** Initialization Functions ****** //

// Initialization function - loads data and sets up UI
function init() {
  if (localStorage.getItem("numTrees") === null) {
    localStorage.setItem("numTrees", 5);
  }

  if (localStorage.getItem("depth") === null) {
    localStorage.setItem("depth", 4);
  }

  data = JSON.parse(localStorage.getItem("test"));

  const dropdown = d3.select("#gameSelector");
  dropdown.selectAll("option").remove(); // Clear existing options

  data.forEach((game) => {
  const label = `${game.game} (${game.date}) - ${game.true_label}`;
  dropdown.append("option").attr("value", game.id).text(label);
  test_games[game.id] = game;  // <-- add this line
});

  data2 = JSON.parse(localStorage.getItem("trees"));
  localStorage.setItem("acc", data2[0].value);
  trees = data2[0].children;
  currentTreeIndex = 0;
  renderSingleTree(trees[currentTreeIndex]);
  updateButtons();

  const summary = d3.select("#forestSummary").html("");

  summary
    .selectAll("div")
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
    .style("opacity", 0.5);
}
// ****** ------------------------ ****** //

// Sends a request to backend to retrain Random Forest model
async function getData(n, d) {
  const url = `https://cmsc-471-final-project.onrender.com/train?numTrees=${n}&depth=${d}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    localStorage.setItem("trees", JSON.stringify(json.trees));
    localStorage.setItem("test", JSON.stringify(json.test));
    console.log(json);
  } catch (error) {
    console.error(error.message);
  }
}

document.addEventListener("load", init);

document.addEventListener("DOMContentLoaded", () => {
  const nTrees = document.getElementById("yearSlider");
  const depth = document.getElementById("depthSlider");

  const legend = d3.select("#legend").html("");
  legend
    .append("div")
    .html(
      `<span style="display:inline-block;width:20px;height:20px;background:#69b3a2;border:1px solid #000;margin-right:5px;"></span>Home win</br><span style="display:inline-block;width:20px;height:20px;background:#ff6347;border:1px solid #000;margin-right:5px;"></span>Away win`
    );

  nTrees.value = localStorage.getItem("numTrees");
  depth.value = localStorage.getItem("depth");

  document.getElementById(
    "accuracy"
  ).innerHTML = `</br><strong>Model Accuracy</strong>: ${localStorage.getItem(
    "acc"
  )}`;

  nTrees.addEventListener("change", (event) => {
    localStorage.setItem("numTrees", event.target.value);
  });

  depth.addEventListener("change", (event) => {
    localStorage.setItem("depth", event.target.value);
  });

  document.getElementById("train").addEventListener("click", async () => {
    await getData(
      localStorage.getItem("numTrees"),
      localStorage.getItem("depth")
    );

    setTimeout(() => {
      init();
    }, 0);
  });

  document.getElementById("test").addEventListener("click", () => {
    let test_path = [];
    let chosenGame = test_games[document.getElementById("gameSelector").value];
    let gameTreePath = chosenGame.tree_paths[currentTreeIndex].path;

    for (let i = 0; i < gameTreePath.length; i++) {
      if (i == gameTreePath.length - 1) {
        test_path.push(gameTreePath[i].leaf);
      } else {
        test_path.push(gameTreePath[i].node);
      }
    }

    const match = getMatchingLeaf(test_path);

    highlightPathToLeaf(match);
  });

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

  document
    .getElementById("toggleModelExplanation")
    .addEventListener("click", () => {
      const explanationHTML = `
  <html>
    <head>
      <title>Explanation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
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
      <h3>🌲 What Is a Random Forest?</h3>
      <p>
        Imagine you want to predict whether an NFL team will win its next game. One way to do this is to ask an expert, 
        but what if you asked <strong>100 different experts</strong>, each looking at the data in a slightly different way — 
        and then went with the majority opinion?
      </p>
      <p>
        That’s the basic idea behind a <strong>random forest</strong>.
      </p>
      <p>
        A random forest is a machine learning method that combines the predictions of many smaller models 
        called <strong>decision trees</strong>. Each decision tree is like a flowchart that makes decisions by asking questions — 
        for example: “Was the team’s quarterback rating above 90?” → yes or no → “Was the defense ranked in the top 10?” → and so on.
      </p>
      <p>
        Each tree looks at different parts of the data and makes its own prediction. On their own, trees can be 
        <em>simple and sometimes wrong</em>, but when you combine many trees, they form a <strong>“forest”</strong> 
        that tends to be <strong>much more accurate</strong>.
      </p>
      <h3>🌱 Why "Random"?</h3>
      <ul>
        <li><strong>Random data samples:</strong> Each tree is trained on a random subset of the data (this is called bootstrapping).</li>
        <li><strong>Random features:</strong> At each decision point, the tree considers only a random set of features 
          (instead of all features) to decide how to split the data.</li>
      </ul>
      <p>
        This randomness helps the trees make different mistakes, which balances out when they vote. 
        The final prediction is made by a <strong>majority vote</strong> across all trees.
      </p>
    </body>
  </html>
`;
      const popup = window.open(
        "decription.html",
        "Explanation",
        "width=750,height=650"
      );
      popup.document.write(explanationHTML);
      popup.document.close();
    });

  document
    .getElementById("toggleTrainingExplanation")
    .addEventListener("click", () => {
      const explanationHTML = `
  <html>
    <head>
      <title>Explanation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
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
        <h3>🧪 How a Tree Tests Input Data</h3>
        <p>
          Once trained, a decision tree makes predictions by asking a series of yes-or-no questions about the input data. 
          Each node in the tree checks a specific feature — for example, “Is the number of passing yards greater than 250?”
        </p>
        <p>
          Based on the answer, the input travels down the left or right branch. This continues until it reaches a 
          <strong>leaf node</strong>, which holds the tree's prediction (like "Home win" or "Away win").
        </p>
        <p>
          This process is fast and efficient, and each tree’s path depends on the patterns it learned from training data.
        </p>

        <h3>📈 Number of Trees and Tree Depth</h3>
        <ul>
          <li>
            <strong>More Trees = More Accuracy (Usually):</strong> 
            Adding more trees improves prediction accuracy because each tree contributes a unique perspective. 
            The forest “averages out” their mistakes. But adding too many can slow down training and prediction.
          </li>
          <li>
            <strong>Tree Depth = Complexity:</strong> 
            Deeper trees can capture more detailed patterns in the data — but if they go too deep, they might memorize the training data 
            instead of generalizing, which leads to <em>overfitting</em>.
          </li>
          <li>
            <strong>Finding the Balance:</strong> 
            A well-performing random forest has enough trees and the right depth to capture patterns 
            without becoming too slow or overfitting the data.
          </li>
        </ul>

        <h3>🔥 Visualizing Accuracy Across Trees and Depths</h3>
        <p>
          The heatmap below shows how accuracy changes depending on two key parameters: the number of trees in the forest, 
          and the maximum depth each tree is allowed to grow. Darker shades of red represent higher accuracy.
        </p>
        <p>
          This kind of visualization helps us find the “sweet spot” — a combination of tree count and depth that gives strong performance 
          without making the model overly complex or slow.
        </p>
        <img src="heatmap.png" alt="Random Forest Accuracy Heatmap" style="max-width:800px; width:100%; border:0; margin-top:10px;">
      </body>
  </html>
`;
      const popup = window.open(
        "decription.html",
        "Explanation",
        "width=1200,height=1200"
      );
      popup.document.write(explanationHTML);
      popup.document.close();
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

    const popup = window.open(
      "decription.html",
      "Explanation",
      "width=1200,height=550"
    );
    popup.document.write(explanationHTML);
    popup.document.close();
  });

  init();
});
