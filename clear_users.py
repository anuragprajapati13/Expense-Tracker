# Script to clear all users from the MongoDB users collection
from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/expense_tracker"
mongo = PyMongo(app)

with app.app_context():
    result = mongo.db.users.delete_many({})
    print(f"Deleted {result.deleted_count} users from the database.")
