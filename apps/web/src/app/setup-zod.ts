import { z } from "zod"

// Zod probes `new Function` when it builds object schemas; the enforcing CSP
// (script-src 'self') reports that probe as a violation. main.tsx imports this
// module first so it runs before any schema is constructed.
z.config({ jitless: true })
