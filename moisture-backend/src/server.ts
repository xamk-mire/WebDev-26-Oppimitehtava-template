import { createApp } from './app';
const PORT = process.env.PORT ?? 8001;
createApp().listen(PORT, () => console.log(`API käynnissä portissa ${PORT}`));
