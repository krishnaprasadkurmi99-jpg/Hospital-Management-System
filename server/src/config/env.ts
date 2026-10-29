import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(4000),
});
export const env = schema.parse(process.env);
