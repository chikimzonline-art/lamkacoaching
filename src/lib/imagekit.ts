import ImageKit from "@imagekit/nodejs";
import { env } from "@/env";

export const imagekit = new ImageKit({
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
});
