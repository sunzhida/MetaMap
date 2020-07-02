# This is for the controller on the production environments

from app import app
if __name__ == "__main__":
    app.run(host='0.0.0.0')
# app.run(host = '0.0.0.0', port=5000, debug=True)
