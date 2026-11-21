import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Historia from './Historia.tsx'
import Deudas from "./Deudas.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Historia />
  </StrictMode>,
)
