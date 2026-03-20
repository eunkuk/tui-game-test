import { App } from './App.ts';
import { RNG } from 'rot-js';

// Seed RNG
RNG.setSeed(Date.now());

const app = new App();
app.start();
