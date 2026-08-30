import { createRoot } from 'react-dom/client';
import '@/styles/fonts.css';
import './style.css';
import { Popup } from './Popup';

createRoot(document.getElementById('root')!).render(<Popup />);
