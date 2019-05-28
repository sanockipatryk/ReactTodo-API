const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const knex = require("knex");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { validateEmail } = require("./helpers/validateEmail");

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
          const user = users[0];
          bcrypt.compare(password, user.password, (err, response) => {
            if (err || !response) {
              res.sendStatus(400);
            } else {
              jwt.sign({ user }, process.env.SECRET_KEY, (err, token) => {
                if (err) {
                  res.sendStatus(400);
                }
                res.status(200).json(token);
              });
            }
          });
        } else {
          res.sendStatus(400);
        }
      });
  } else {
    res.sendStatus(400);
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
    res.status(400).json({ message: "Please fill every field." });
  }
});

app.listen(5000);
