import pandas as pd
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.tree import _tree

def train_and_export_forest(depth=3, n_trees=10, csv_path='nfl_games_with_rolling_stats.csv'):
    def remove_rolling(s):
        return s.replace('_rolling', '') if s not in ["away_score_rolling", "home_score_rolling"] else s

    def tree_to_json(tree, feature_names, tree_index):
        tree_ = tree.tree_
        def recurse(node):
            if tree_.feature[node] != _tree.TREE_UNDEFINED:
                name = feature_names[tree_.feature[node]]
                threshold = tree_.threshold[node]
                return {
                    "name": f"{name} <= {threshold:.2f}",
                    "children": [recurse(tree_.children_left[node]), recurse(tree_.children_right[node])]
                }
            else:
                value = tree_.value[node][0]
                class_idx = value.argmax()
                return {
                    "name": "Home win" if class_idx == 1 else "Away win",
                    "value": int(value.sum())
                }
        return {"name": f"tree_{tree_index}", "children": [recurse(0)]}

    def clean_tree(node):
        if 'children' not in node:
            return node
        node['children'] = [clean_tree(child) for child in node['children']]
        children = node['children']
        if len(children) == 2:
            c1, c2 = children
            if 'children' not in c1 and 'children' not in c2 and c1.get('name') == c2.get('name'):
                node['children'] = [c1]
        if len(node['children']) == 1 and 'children' not in node['children'][0]:
            return node['children'][0]
        return node

    # Load and preprocess data
    df = pd.read_csv(csv_path)
    df.columns = [remove_rolling(col) for col in df.columns]
    X, y = df.iloc[:, 6:-1], df.iloc[:, -1]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train model
    clf = RandomForestClassifier(
        n_estimators=n_trees,
        max_depth=depth,
        random_state=42,
        max_features='sqrt',
        min_samples_leaf=5,
        min_samples_split=3
    )
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    print(f'Accuracy: {accuracy_score(y_test, y_pred):.3f}')

    # Convert and clean trees
    forest_json = [{
        "name": "forest",
        "children": [tree_to_json(tree, X.columns, i) for i, tree in enumerate(clf.estimators_)]
    }]
    cleaned = [clean_tree(tree) for tree in forest_json]

    # Save to file
    with open('random_forest.json', 'w') as f:
        json.dump(cleaned, f, indent=2)

    return cleaned

train_and_export_forest()
