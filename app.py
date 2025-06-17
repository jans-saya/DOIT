# Solution 1: Updated app.py with environment variable for API key
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Get API key from environment variable or use direct key
API_KEY = os.getenv('ANTHROPIC_API_KEY', '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')

# Initialize Anthropic client
try:
    client = anthropic.Anthropic(api_key=API_KEY)
    logger.info("✅ Anthropic client initialized successfully")
    
    # Test the API key immediately
    try:
        test_response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=10,
            messages=[{"role": "user", "content": "test"}]
        )
        logger.info("✅ API Key validation successful")
    except anthropic.AuthenticationError:
        logger.error("❌ API Key is invalid - please check your key")
        client = None
    except Exception as e:
        logger.error(f"❌ API Key test failed: {e}")
        client = None
        
except Exception as e:
    logger.error(f"❌ Failed to initialize Anthropic client: {e}")
    client = None

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.info("📥 Received chat request")
        
        # Check if client is initialized
        if client is None:
            logger.error("❌ Anthropic client not available")
            return jsonify({
                "error": "AI service not available", 
                "details": "API key is invalid or not configured"
            }), 503
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        messages = data.get('messages', [])
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        system_message = data.get('system', 'You are a helpful AI assistant.')
        
        logger.info(f"🔄 Processing {len(messages)} messages")
        
        # Create a message with Anthropic
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=messages,
            system=system_message
        )
        
        logger.info("✅ Anthropic API call successful")
        
        # Convert response to dict format
        response_dict = {
            "id": response.id,
            "model": response.model,
            "content": [{"type": "text", "text": response.content[0].text}],
            "role": response.role,
            "stop_reason": response.stop_reason,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }
        
        return jsonify(response_dict)
        
    except anthropic.AuthenticationError as e:
        logger.error(f"❌ Authentication Error: {e}")
        return jsonify({
            "error": "Authentication failed", 
            "details": "Invalid API key - please check your Anthropic API key"
        }), 401
        
    except anthropic.RateLimitError as e:
        logger.error(f"❌ Rate Limit Error: {e}")
        return jsonify({
            "error": "Rate limit exceeded", 
            "details": "Too many requests"
        }), 429
        
    except anthropic.APIError as e:
        logger.error(f"❌ Anthropic API Error: {e}")
        return jsonify({
            "error": "AI service error", 
            "details": str(e)
        }), 500
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            "error": "Internal server error", 
            "details": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy" if client else "unhealthy",
        "anthropic_client": client is not None,
        "api_key_configured": bool(API_KEY and len(API_KEY) > 20)
    }), 200

@app.route('/api/test-key', methods=['GET'])
def test_api_key():
    """Test API key endpoint"""
    if not client:
        return jsonify({
            "status": "failed",
            "error": "Client not initialized"
        }), 500
    
    try:
        # Test with a simple message
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=50,
            messages=[{"role": "user", "content": "Hello"}]
        )
        return jsonify({
            "status": "success",
            "message": "API key is working",
            "response_preview": response.content[0].text[:50] + "..."
        })
    except Exception as e:
        return jsonify({
            "status": "failed",
            "error": str(e)
        }), 400

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 DOIT AI Companion Server")
    print("="*50)
    print(f"📋 API Key Status: {'✅ Configured' if API_KEY and len(API_KEY) > 20 else '❌ Missing'}")
    print(f"🤖 Anthropic Client: {'✅ Ready' if client else '❌ Failed'}")
    print("="*50)
    
    if not client:
        print("\n❌ WARNING: API key is invalid!")
        print("📝 To fix this:")
        print("1. Get a valid API key from https://console.anthropic.com/")
        print("2. Replace the API key in app.py")
        print("3. Or set environment variable: export ANTHROPIC_API_KEY='your-key'")
        print("="*50)
    
    app.run(debug=True, port=5000, host='127.0.0.1')