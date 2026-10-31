import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut} from 'firebase/auth';
import {getFunctions,connectFunctionsEmulator,httpsCallable} from 'firebase/functions';
import {initializeAppCheck,ReCaptchaEnterpriseProvider} from 'firebase/app-check';
const env=import.meta.env;
export const firebaseConfigured=!!(env.VITE_FIREBASE_API_KEY&&env.VITE_FIREBASE_AUTH_DOMAIN&&env.VITE_FIREBASE_PROJECT_ID&&env.VITE_FIREBASE_APP_ID);
const app=firebaseConfigured?initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,storageBucket:env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:env.VITE_FIREBASE_APP_ID}):null;
export const auth=app?getAuth(app):null;
const functions=app?getFunctions(app,env.VITE_FIREBASE_FUNCTIONS_REGION||'asia-south1'):null;
if(app&&env.VITE_FIREBASE_APPCHECK_SITE_KEY)initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(env.VITE_FIREBASE_APPCHECK_SITE_KEY),isTokenAutoRefreshEnabled:true});
if(env.VITE_FIREBASE_USE_EMULATORS==='true'&&auth&&functions){if(!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('Firebase emulators are allowed only on localhost.');connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFunctionsEmulator(functions,'127.0.0.1',5001)}
export async function callBackend<T=unknown>(name:string,data:unknown={}):Promise<T>{if(!functions)throw new Error('Firebase is not configured yet.');return (await httpsCallable<unknown,T>(functions,name)(JSON.parse(JSON.stringify(data)))).data}
export async function googleLogin(){if(!auth)throw new Error('Firebase project setup is required before Google sign-in can connect.');const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});try{await signInWithPopup(auth,provider)}catch(error){const code=(error as {code?:string}).code;if(code==='auth/popup-blocked'){await signInWithRedirect(auth,provider);return}throw error}}
export async function finishRedirect(){if(auth)await getRedirectResult(auth)}
export async function firebaseLogout(){if(auth)await signOut(auth)}
