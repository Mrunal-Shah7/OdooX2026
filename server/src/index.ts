import { env } from './env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`PeoplePay360 API listening on port ${env.PORT}`);
});
