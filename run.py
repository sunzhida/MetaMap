# This is for the controller on the production environments
from os.path import dirname, abspath, join, isfile, isdir
from app import app
if __name__ == "__main__":
    cur_path = dirname(abspath(__file__))
    assert(isfile(join(cur_path, 'database.db')))
    assert(isdir(join(cur_path, 'app', 'static', 'img')))
    app.run(host='0.0.0.0', port=5000, debug=True)
# app.run(host = '0.0.0.0', port=?)
