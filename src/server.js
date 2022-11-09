import express from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import dayjs from "dayjs";

const schemaParticipantPost = Joi.object({
  name: Joi.string().min(1).trim().required(),
});

const schemaMessagePost = Joi.object({
  to: Joi.string().min(1).trim().required(),
  text: Joi.string().min(1).trim().required(),
  type: Joi.valid("private_message", "message").required(),
  user: Joi.string().min(1).trim().required(),
});

//Config
const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

//Connection
let db;
async function OpenDBServer() {
  const mongoClient = new MongoClient(process.env.MONGO_URI);

  await mongoClient.connect();
  db = mongoClient.db("participants");
}
OpenDBServer()
//Models
async function getAllParticipants(){
  const allParticipants = await db
      .collection("participants")
      .find({})
      .toArray();
      return allParticipants
}

function getTimestamp(){
  const time = new Date().getTime();
  return time;
}


//Controllers
function hourNow() {
  const time = dayjs();

  let hour = time.hour();
  if (hour < 10) hour = "0" + hour;

  let minute = time.minute();
  if (minute < 10) minute = "0" + minute;

  let second = time.second();
  if (second < 10) second = "0" + second;
  return `${hour}:${minute}:${second}`;
}

//Routes

//Routes participants
app.get("/participants", async (req, res) => {
  const result = await db.collection("participants").find({}).toArray();
  res.status(200).send(result);
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  try {
    const response = schemaParticipantPost.validate({ name });
    if (response.error) {
      console.log(response);
      res.status(422).send({ details: response.error.details });
      return;
    }
    const allParticipants = await getAllParticipants();
    if (allParticipants.find((p) => p.name === name)) {
      res.status(409).send("Este nome de usuário já foi cadastrado!");
      return;
    }
  } catch (err) {
    res.send(err);
    return;
  }
  const lastStatus = getTimestamp();
  await db.collection("participants").insertOne({ name, lastStatus });
  await db.collection("messages").insertOne({
    from: name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: hourNow(),
  });
  res.status(201).send();
});

//Routes messages
app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const resultValidate = schemaMessagePost.validate({ to, text, type, user });
  if (resultValidate.error) {
    res.status(422).send(resultValidate.error.details);
    return;
  }
  const allParticipants = await db
    .collection("participants")
    .find({})
    .toArray();
  if (!allParticipants.find((participant) => participant.name === user)) {
    res.status(400).send("Usuário não encontrado!");
    return;
  }

  const objectMessage = {
    to,
    text,
    type,
    from: user,
    time: hourNow()
  };

  await db.collection("messages").insertOne(objectMessage);
  res.status(201).send(objectMessage);
});

app.get("/messages", async (req, res) => {
  const result = await db.collection("messages").find({}).toArray();
  res.send(result);
});





app.post("/status", async (req, res) => {
  const {user} = req.headers;
  // const allParticipants = await db
  //     .collection("participants")
  //     .find({})
  //     .toArray();
  const allParticipants = await getAllParticipants()
    if (!allParticipants.find((p) => p.name === user)) {
      res.status(404).send("Usuário não encontrado!");
      return;
    }
    
  const updateDocument = {
    $set: {
      lastStatus: getTimestamp()
    }
  }

  const userDB = await db.collection("participants").updateOne({name:user}, updateDocument);
  res.send(userDB)
});









app.delete("/messages", async (req, res) => {
  const result = await db.collection("messages").deleteMany({});
  res.send(result);
});

app.delete("/participants", async (req, res) => {
  const result = await db.collection("participants").deleteMany({});
  res.send(result);
});

 function removeUsersOffline(){
  setInterval(async () => {
   
  }, 8000)
}
// removeUsersOffline()

const port = 5000;
app.listen(port, () => {
  console.log(
    `Server running in --> ${chalk.bgBlack.cyan(`http://localhost:${port}`)}`
  )
  });
