import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load your dataset (adjust path as needed)
df = pd.read_csv('./data/nfl_games_with_rolling_stats.csv')

# Optional column name cleanup
def remove_rolling(s):
    return s.replace('_rolling', '') if s not in ["away_score_rolling", "home_score_rolling"] else s
df.columns = [remove_rolling(col) for col in df.columns]

# Features and label
X, y = df.iloc[:, 6:-1], df.iloc[:, -1]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Parameter ranges
depths = list(range(2, 14, 2))         # 2 to 12
n_trees = list(range(10, 110, 10))     # 10 to 100

# Train and collect accuracy
results = []
for depth in depths:
    for n in n_trees:
        clf = RandomForestClassifier(
            n_estimators=n,
            max_depth=depth,
            random_state=42,
            max_features='sqrt',
            min_samples_leaf=5,
            min_samples_split=3
        )
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        results.append((depth, n, acc))

# Prepare DataFrame for heatmap
results_df = pd.DataFrame(results, columns=["depth", "n_trees", "accuracy"])
heatmap_data = results_df.pivot(index="depth", columns="n_trees", values="accuracy")

# Plot
plt.figure(figsize=(12, 8))
sns.set_theme(style="dark")

ax = sns.heatmap(
    heatmap_data,
    annot=True,
    fmt=".3f",
    cmap="coolwarm",
    cbar_kws={'label': 'Accuracy'},
    linewidths=0.5,
    linecolor='gray'
)

ax.invert_yaxis()

# Set dark background and white text
ax.set_facecolor("#333232")
plt.gcf().patch.set_facecolor("#333232")
plt.title("Random Forest Accuracy Heatmap", fontsize=16, color="white")
plt.xlabel("Number of Trees", color="white")
plt.ylabel("Tree Depth", color="white")
ax.tick_params(colors='white')
ax.figure.axes[-1].yaxis.label.set_color("white")   # colorbar label
ax.figure.axes[-1].tick_params(colors="white")      # colorbar tick labels
plt.tight_layout()
plt.savefig("heatmap.png", dpi=300, facecolor="#333232")  # Optional: save it
plt.show()
