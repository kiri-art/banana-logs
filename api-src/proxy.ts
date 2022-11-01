import fetch from "node-fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function Proxy(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === "development") console.log(req.headers);

  const authorization = req.headers["authorization"];
  if (!authorization) return res.status(400).end("Bad Request");

  const url = req.query.url;
  if (process.env.NODE_ENV === "development") console.log(url);

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
    },
  });

  response.body.pipe(res);
}
