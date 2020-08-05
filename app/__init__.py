from flask import Flask, request, url_for, Response, render_template, jsonify, session, redirect, flash, g
import pandas as pd
import sqlite3
from sqlite3 import Error
import sys
import warnings
import json

if not sys.warnoptions:
    warnings.simplefilter("ignore")

DATABASE = "./database.db"

app = Flask(__name__, instance_relative_config=True)
app.config['DEBUG'] = True


# app.config['SECRET_KEY'] = 'hcihkust'

# TEMPData = pd.DataFrame()
# SCOPEData = pd.DataFrame()
# SCOPEView = 50


def create_connection(db_file):
    """ create a database connection to a SQLite database """
    try:
        conn = sqlite3.connect(db_file)
        # # print(sqlite3.version)
        return conn
    except Error as e:
        print(e)


# return suggest keywords based on input: a list of string
def suggestKeayword(input):
    conn = create_connection(DATABASE)
    search_df = pd.read_sql_query("SELECT suggestions from search where keyword == '%s'" % input, conn)
    conn.commit()
    conn.close()
    keywordlist = search_df.suggestions.values
    if len(keywordlist) != 0:
        keywordlist = eval(keywordlist[0])

    return keywordlist


# return related images based on input: a list of image ID
def searchImage(input):
    # print(input)
    # if input == "test":
    #     imagelist = ["1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg"]
    # else:
    #     imagelist = ["3.jpeg", "4.jpeg", "5.jpeg", "6.jpeg"]
    conn = create_connection(DATABASE)
    image_df = pd.read_sql_query("SELECT image_name from images where keyword == '%s'" % input, conn)
    imagelist = list(image_df.image_name.values)
    conn.commit()
    conn.close()

    return imagelist


@app.route('/', methods=['GET', 'POST'])
def index():
    RELOAD_DATABASE = False
    conn = create_connection(DATABASE)
    if conn is not None and RELOAD_DATABASE:
        search_data = pd.read_csv('./data_csv/search_demo.csv')
        image_data = pd.read_csv('./data_csv/images_demo.csv')
        search_data.to_sql('search', conn, if_exists='replace', index=False)
        image_data.to_sql('images', conn, if_exists='replace', index=False)
    conn.commit()
    conn.close()
    message = 'OK'
    return render_template('index.html', message=message)


@app.route('/search/<i>', methods=['GET', 'POST'])
def search(i):
    keyword = suggestKeayword(i)
    image = searchImage(i)
    data = {'search': i, 'keywords': keyword, 'images': image}
    return json.dumps(data)


@app.route('/browse/<i>', methods=['GET', 'POST'])
def browse(i):
    print(i)
    #################################
    # Youwen: processing the data here
    #################################
    data = "{\"input\":\"01.jpg\",\"semantic\":[{\"name\":\"000e74ea347f08c0cae2b3cfc4f612cf.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":276,\"height\":180},{\"name\":\"00a8885948a4a3abed0a27480c9f3fa6.png\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":240,\"height\":180},{\"name\":\"00a5155ce76792c8aaef4bd67e2d4f44.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":232,\"height\":180}],\"color\":[{\"name\":\"00ab0fe3d1d76da690d7438117eeea49.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":270,\"height\":180},{\"name\":\"00e43e295097e2580d0178cb3cadd04b.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":131,\"height\":180}],\"shape\":[{\"name\":\"00daeeb00b31e6f7fd9bf103a1733560.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":131,\"height\":180},{\"name\":\"00dddfdfe4ad349925af78c3d04533f9.jpg\",\"keywords\":[\"xxx\",\"health\",\"health\",\"health\"],\"width\":116,\"height\":180}],\"status\":\"xxx\"}"
    return json.dumps(data)


@app.route('/redir/<i>')
def redir(i):
    keyword = suggestKeayword(i)
    image = searchImage(i)
    message = 'OK'
    return render_template('index.html', keyword=keyword, image=image, message=message)
