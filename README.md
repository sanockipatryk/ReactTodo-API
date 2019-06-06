## About the project

This repository is an API server made with node.js and express framework, for [to-do app](https://github.com/sanockipatryk/ReactTodo).
This project uses postgresql database, containing user accounts informations and tasks created by users. Connecting server and database is done using knex library. To config the connection, go to app.js file and change the object data of db constant.

To create tables, needed for the project, execute the scripts from dbscripts.txt file.

Server listens on http://localhost:5000
