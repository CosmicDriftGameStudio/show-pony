// Public-Bundle — der anonyme Gast lädt nur das. Kein Login, kein Admin-
// Code, keine Screens. Server-seitig via hostDispatch ausgeliefert:
// <key>.show-pony.<domain> → public.html → /client-public.js.

import { mountPublic } from "./public/mount";

mountPublic();
