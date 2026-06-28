// Public bundle — anonymous guests only load this. No login, no admin
// code, no screens. Served server-side via hostDispatch:
// <key>.show-pony.<domain> → public.html → /client-public.js.

import { mountPublic } from "./public/mount";

mountPublic();
