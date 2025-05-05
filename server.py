from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from randomForsestClassifier import train_and_export_forest


app = Flask(__name__)
api = Api(app)

CORS(app)  

class GetTrees(Resource):
    def get(self):
        numTrees = request.args.get('numTrees')
        depth = request.args.get('depth')
        
        trees =  train_and_export_forest(n_trees=int(numTrees), depth=int(depth))

        return {'trees': trees}

api.add_resource(GetTrees, '/train')

if __name__ == '__main__':
    app.run(debug=True)
