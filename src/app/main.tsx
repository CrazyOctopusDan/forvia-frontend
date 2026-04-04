import ReactDOM from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import '@/styles/tokens.css';
import '@/styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<AppProviders />);
