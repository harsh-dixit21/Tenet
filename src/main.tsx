import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './portal-app';
import {SessionProvider} from '@/lib/firebase/session';
import './portal-styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><MotionConfig reducedMotion="user"><SessionProvider><App /></SessionProvider></MotionConfig></React.StrictMode>);
