import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from GPT-4 CodeX!',
  });
});

app.post('/', async (req, res) => {
  let retries = 0;

  const retryFn = async () => {
    try {
      const prompt = req.body.prompt;

      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `${prompt}`,
        temperature: 0,
        max_tokens: 3000,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
      });

      res.status(200).send({
        bot: response.data.choices[0].text,
      });
    } catch (error) {
      if (
        error.response &&
        error.response.status === 429 &&
        retries < MAX_RETRIES
      ) {
        retries++;
        console.log(
          `Encountered 429 error. Retrying in ${RETRY_DELAY_MS}ms. Retry ${retries} of ${MAX_RETRIES}...`
        );
        setTimeout(retryFn, RETRY_DELAY_MS);
      } else {
        console.error(error);
        res.status(500).send(error || 'Something went wrong');
      }
    }
  };

  retryFn();
});

app.listen(5000, () =>
  console.log('AI server started on https://gpt-4-codex-2g.vercel.app')
);
