// Offline demo façade; this build never initializes Firebase.
import { DEMO_UID } from './demo/demoStore';
export const auth = {currentUser:{uid:DEMO_UID,displayName:'Alex',emailVerified:true,providerData:[]}};
export const db = {mode:'offline-demo'};
export const storage = null;
export default {name:'offline-demo'};
