from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import os

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

# Initialize Anthropic client
client = anthropic.Anthropic(
    api_key="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"
)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        
        # Extract messages from the request
        messages = data.get('messages', [])
        
        # Create a message with Anthropic
        response = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            messages=messages,
            system=data.get('system', '')
        )
        
        return jsonify(response.model_dump())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)