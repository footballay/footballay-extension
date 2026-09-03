import { createRoot } from 'react-dom/client';
import '@/styles/fonts.css';
import '@/popup/style.css';
import { Popup } from '@/popup/Popup';

createRoot(document.getElementById('root')!).render(<Popup />);
