from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Restrict to API routes

# Secure database credentials using environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql://root:@localhost/sstock_viewer_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define StockData Model
class StockData(db.Model):
    __tablename__ = 'stock_data'
    date = db.Column(db.Date, primary_key=True)
    trade_code = db.Column(db.String(20), primary_key=True)
    high = db.Column(db.Numeric(10, 2), nullable=False)
    low = db.Column(db.Numeric(10, 2), nullable=False)
    open = db.Column(db.Numeric(10, 2), nullable=False)
    close = db.Column(db.Numeric(10, 2), nullable=False)
    volume = db.Column(db.Integer, nullable=False)

# Home route
@app.route('/')
def home():
    return jsonify({"message": "Welcome to Stock Viewer API!"})

# Add stock data (POST)
@app.route('/api/stock_data', methods=['POST'])
def add_stock_data():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON format"}), 400
    
    try:
        stock_entry = StockData(
            date=datetime.strptime(data.get('date'), "%Y-%m-%d").date(),
            trade_code=data.get('trade_code'),
            high=float(data.get('high', 0)),
            low=float(data.get('low', 0)),
            open=float(data.get('open', 0)),
            close=float(data.get('close', 0)),
            volume=int(data.get('volume', 0))
        )

        db.session.add(stock_entry)
        db.session.commit()

        return jsonify({"message": "Stock data added successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Fetch all stock data (GET)
@app.route('/api/stock_data', methods=['GET'])
def get_stock_data():
    try:
        stocks = StockData.query.with_entities(
            StockData.date, StockData.trade_code, 
            StockData.high, StockData.low, StockData.open, 
            StockData.close, StockData.volume
        ).all()

        result = [
            {
                "date": stock.date.strftime("%Y-%m-%d"),
                "trade_code": stock.trade_code,
                "high": float(stock.high),
                "low": float(stock.low),
                "open": float(stock.open),
                "close": float(stock.close),
                "volume": stock.volume
            }
            for stock in stocks
        ]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Fetch a stock entry by trade_code and date (GET)
@app.route('/api/stock_data/<string:trade_code>/<string:date>', methods=['GET'])
def get_stock_entry(trade_code, date):
    try:
        stock = StockData.query.filter_by(
            trade_code=trade_code, 
            date=datetime.strptime(date, "%Y-%m-%d").date()
        ).first()

        if not stock:
            return jsonify({"error": "Stock entry not found"}), 404

        return jsonify({
            "date": stock.date.strftime("%Y-%m-%d"),
            "trade_code": stock.trade_code,
            "high": float(stock.high),
            "low": float(stock.low),
            "open": float(stock.open),
            "close": float(stock.close),
            "volume": stock.volume
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Update a stock entry (PUT)
@app.route('/api/stock_data/<string:trade_code>/<string:date>', methods=['PUT'])
def update_stock_data(trade_code, date):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON format"}), 400

    try:
        stock = StockData.query.filter_by(
            trade_code=trade_code, 
            date=datetime.strptime(date, "%Y-%m-%d").date()
        ).first()

        if not stock:
            return jsonify({"error": "Stock entry not found"}), 404

        # Update fields only if provided
        stock.high = float(data.get("high", stock.high))
        stock.low = float(data.get("low", stock.low))
        stock.open = float(data.get("open", stock.open))
        stock.close = float(data.get("close", stock.close))
        stock.volume = int(data.get("volume", stock.volume))

        db.session.commit()
        return jsonify({"message": "Stock data updated successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Delete a stock entry (DELETE)
@app.route('/api/stock_data/<string:trade_code>/<string:date>', methods=['DELETE'])
def delete_stock_data(trade_code, date):
    try:
        stock = StockData.query.filter_by(
            trade_code=trade_code, 
            date=datetime.strptime(date, "%Y-%m-%d").date()
        ).first()

        if not stock:
            return jsonify({"error": "Stock entry not found"}), 404

        db.session.delete(stock)
        db.session.commit()
        return jsonify({"message": "Stock data deleted successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Add stock data from JSON file (POST)
@app.route('/api/add_stock_data_from_json', methods=['POST'])
def add_stock_data_from_json():
    try:
        with open('stock_market_data.json') as file:
            data = json.load(file)

        stock_entries = []
        for record in data:
            if not StockData.query.filter_by(
                date=datetime.strptime(record['date'], "%Y-%m-%d").date(),
                trade_code=record['trade_code']
            ).first():
                stock_entries.append(StockData(
                    date=datetime.strptime(record['date'], "%Y-%m-%d").date(),
                    trade_code=record['trade_code'],
                    high=float(record['high']),
                    low=float(record['low']),
                    open=float(record['open']),
                    close=float(record['close']),
                    volume=int(record['volume'])
                ))

        if stock_entries:
            db.session.bulk_save_objects(stock_entries)
            db.session.commit()

        return jsonify({"message": "Stock data from JSON added successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Run Flask
if __name__ == '__main__':
    app.run(debug=True)
