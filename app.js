const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const knex = require("knex");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { validateEmail } = require("./helpers/validateEmail");
const { verifyToken } = require("./helpers/verifyToken");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "q1w2e3",
    database: "TodoApp"
  }
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome!"
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (validateEmail(email) && password) {
    db.select("*")
      .from("users")
      .where("email", "=", email)
      .then(users => {
        if (users[0]) {
          const dbUser = users[0];
          bcrypt.compare(password, dbUser.password, (err, response) => {
            if (err || !response) {
              res.status(400).json({
                message: "Could not log in."
              });
            } else {
              const user = {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email
              };
              jwt.sign({ user }, process.env.SECRET_KEY, (err, token) => {
                if (err) {
                  res.status(400).json({
                    message: "Could not log in."
                  });
                }
                res.status(200).json(token);
              });
            }
          });
        } else {
          res.status(400).json({
            message: "Could not log in."
          });
        }
      });
  } else {
    res.status(400).json({
      message: "Please fill correctly every field."
    });
  }
});

app.post("/api/register", (req, res) => {
  const { name, email, password, passwordConfirmation } = req.body;
  if (
    validateEmail(email) &&
    password &&
    passwordConfirmation &&
    name &&
    password === passwordConfirmation
  ) {
    db.select("*")
      .from("users")
      .where("email", "=", email)
      .then(users => {
        if (!users[0]) {
          bcrypt.hash(
            password,
            Number(process.env.SALT_ROUNDS),
            (err, hash) => {
              if (err) {
                res
                  .status(400)
                  .json({ message: "Account could not be created." });
              } else {
                db.insert({
                  name,
                  email,
                  password: hash
                })
                  .into("users")
                  .then(response =>
                    res
                      .status(200)
                      .json({ message: "Your account has been created." })
                  )
                  .catch(err =>
                    res
                      .status(400)
                      .json({ message: "Account could not be created." })
                  );
              }
            }
          );
        } else {
          res.status(400).json({ message: "Account could not be created." });
        }
      })
      .catch(err =>
        res.status(400).json({ message: "Account could not be created." })
      );
  } else if (password !== passwordConfirmation) {
    res.status(400).json({ message: "The passwords don't match." });
  } else {
    res.status(400).json({ message: "Please fill correctly every field." });
  }
});

app.post("/api/todo", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
    const { user } = authData;
    const { title, description, dateUntil, isImportant } = req.body;
    if (err) {
      res.sendStatus(403);
    } else {
      if (title) {
        db("todos")
          .returning("title")
          .insert({
            title,
            description,
            userid: user.id,
            dateadded: new Date(),
            dateuntil: dateUntil,
            datefinished: null,
            important: isImportant,
            iscompleted: false
          })
          .then(response => res.status(200).json(response[0]))
          .catch(err => res.sendStatus(400));
      }
    }
  });
});

app.get("/api/todo", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
    const { user } = authData;
    if (err) {
      res.sendStatus(403);
    } else {
      db.select("*")
        .from("todos")
        .where("userid", "=", user.id)
        .then(response => res.status(200).json(response));
    }
  });
});

app.delete("/api/todo/:id", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
    const { user } = authData;
    if (err) {
      res.sendStatus(403);
    } else {
      db("todos")
        .where("id", req.params.id)
        .del()
        .then(response => res.status(200).json(response));
    }
  });
});

app.put("/api/todo/complete/:id", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
    const { user } = authData;
    if (err) {
      res.sendStatus(403);
    } else {
      db("todos")
        .where("id", req.params.id)
        .update({
          iscompleted: true
        })
        .then(response => res.status(200).json(response));
    }
  });
});

app.listen(5000);
