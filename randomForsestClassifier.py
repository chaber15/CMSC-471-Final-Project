import pandas as pd
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.tree import _tree

def train_and_export_forest(depth=3, n_trees=10, csv_path='./data/nfl_games_with_rolling_stats.csv'):
    # Helper to clean column names
    def remove_rolling(s):
        return s.replace('_rolling', '') if s not in ["away_score_rolling", "home_score_rolling"] else s

    # Recursively convert a single decision tree to JSON
    def tree_to_json(tree, feature_names, tree_index):
        tree_ = tree.tree_
        global count
        count = 0

        def recurse(node):
            global count    
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
                count += 1
                return {
                    "name": "Home win" if class_idx == 1 else "Away win",
                    "value": int(value.sum()),
                    "id": count
                }
        return {"name": f"tree_{tree_index}", "children": [recurse(0)]}

    # Optional simplification of identical child leaves
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

    # Get the decision path for one row through one tree
    def get_path(tree, feature_names, sample):
        tree_ = tree.tree_
        feature = tree_.feature
        threshold = tree_.threshold
        node = 0
        path = []
        
        while feature[node] != _tree.TREE_UNDEFINED:
            fname = feature_names[feature[node]]
            thresh = threshold[node]
            val = sample[fname]
            direction = "left" if val <= thresh else "right"
            path.append({
                "node": f"{fname} <= {thresh:.2f}",
                "feature": fname,
                "threshold": thresh,
                "value": val,
                "direction": direction
            })
            node = tree_.children_left[node] if direction == "left" else tree_.children_right[node]

        value = tree_.value[node][0]
        prediction = "Home win" if value.argmax() == 1 else "Away win"
        path.append({"leaf": prediction})
        return path

    # === Load and preprocess dataset ===
    df = pd.read_csv(csv_path)
    df.columns = [remove_rolling(col) for col in df.columns]

    # Select features and label
    X, y = df.iloc[:, 6:-1], df.iloc[:, -1]  # Adjust if your feature slice is different
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # === Train Random Forest model ===
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

    # === FILE 1: Export forest structure ===
    accuracy = accuracy_score(y_test, y_pred)

    forest_json = [{
        "name": "forest",
        "value": round(accuracy*100, 3),
        "children": [tree_to_json(tree, X.columns, i) for i, tree in enumerate(clf.estimators_)]
    }]
    cleaned = [clean_tree(tree) for tree in forest_json]

    # with open('random_forest.json', 'w') as f:
    #     json.dump(cleaned, f, indent=2)

    # === FILE 2: Export example games with prediction paths ===
    
    # Build display fields
    df['game'] = df['away'] + " @ " + df['home']  # e.g., "Packers @ Bears"
    df['date'] = df['season'].astype(str) + ", Week " + df['week'].astype(str)
    
    X_test_full = X_test.copy()
    X_test_full['true_label'] = y_test
    X_test_full['pred_label'] = y_pred
    X_test_full['game'] = df.loc[X_test_full.index, 'game']
    X_test_full['date'] = df.loc[X_test_full.index, 'date']

    def label(val): return "Home win" if val == 1 else "Away win"
    X_test_full['true_label_text'] = X_test_full['true_label'].apply(label)
    X_test_full['pred_label_text'] = X_test_full['pred_label'].apply(label)

    correct_preds = X_test_full[X_test_full['true_label'] == X_test_full['pred_label']]
    incorrect_preds = X_test_full[X_test_full['true_label'] != X_test_full['pred_label']]
    sampled_correct = correct_preds.sample(7, random_state=42)
    sampled_incorrect = incorrect_preds.sample(3, random_state=42)
    test_samples = pd.concat([sampled_correct, sampled_incorrect]).reset_index(drop=True)

    test_data = []

    for i, row in test_samples.iterrows():
        game_info = {
            "id": i,
            "game": row["game"],
            "date": row["date"],
            "true_label": row['true_label_text'],
            "predicted_label": row['pred_label_text'],
            "tree_paths": []
        }

        for j, tree in enumerate(clf.estimators_):
            path = get_path(tree, X.columns, row)
            game_info["tree_paths"].append({
                "tree_index": j,
                "path": path
            })

        test_data.append(game_info)

    # with open("test_games.json", "w") as f:
    #     json.dump(test_data, f, indent=2)

    return cleaned, test_data

# Run the function
train_and_export_forest()
