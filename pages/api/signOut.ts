import { deleteCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true }>
) {
  deleteCookie("cmu-oauth-example-token", {
    req,
    res,
    path: "/",
    //change to your hostname in production
    domain: "localhost",
  });

  return res.json({ ok: true });
}
