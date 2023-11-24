from flask import Flask, request
from script import AladdinGlassVape

app = Flask(__name__)


@app.route('/')
def index():
  return "Alive"


@app.route('/test', methods=['POST'])
def test():
  return request.get_json()


@app.route('/get_cookie', methods=['POST'])
def get_cookie():
  if request.method == 'POST':
    data = request.get_json()
    username = data.get('username', None)
    password = data.get('password', None)
    return AladdinGlassVape().authenticate(username, password)
  else:
    return "This route only accepts POST requests"


app.run(host='0.0.0.0', port=8000)
