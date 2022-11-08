import express from "express";
import chalk from "chalk";
import cors from 'cors';

const app = express();


app.use(cors());
app.use(express.json());


const port = 5000;
app.listen(port, () => console.log(`Server running in --> ${chalk.bgBlack.cyan("http://localhost:5000")}`))