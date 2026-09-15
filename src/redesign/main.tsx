import React from 'react';
import { createRoot } from 'react-dom/client';
import { Answer } from './Answer';
import './answer.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Answer /></React.StrictMode>,
);
