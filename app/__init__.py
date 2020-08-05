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
    print(input)
    # if input == "test":
    #     keywordlist = ['Key word 1', 'Key word 2', 'Key word 3', 'Key word 4']
    # else:
    #     keywordlist = ['Key word 1', 'Key word 2', 'Key word 3', 'Key word 4', 'test']
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
    for image_name in imagelist:
        if image_name[-3:] not in ("jpg", "png"):
            imagelist.remove(image_name)
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
        search_data.to_sql('search', conn, if_exists='replace', index = False)
        image_data.to_sql('images', conn, if_exists='replace', index = False)
    conn.commit()
    conn.close()
    message = 'OK'
    return render_template('index.html', message=message)


@app.route('/search/<i>', methods=['GET', 'POST'])
def search(i):
    keyword = suggestKeayword(i)
    image = searchImage(i)
    data = {'search':i, 'keywords': keyword, 'images': image}
    return json.dumps(data)

@app.route('/redir/<i>')
def redir(i):
    keyword = suggestKeayword(i)
    image = searchImage(i)
    message = 'OK'
    return render_template('index.html', keyword=keyword, image=image, message=message)


