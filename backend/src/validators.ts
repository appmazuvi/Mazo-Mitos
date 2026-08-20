import { z } from "zod";

// z.string().url() by itself accepts any syntactically valid URL scheme,
// including "javascript:" — always require http/https explicitly for any
// URL that ends up rendered or navigated to in the client.
export const httpUrl = z.string().url().regex(/^https?:\/\//, "La URL debe empezar con http:// o https://");
