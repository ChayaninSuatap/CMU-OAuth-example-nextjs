import axios from "axios";
import { setCookie } from "cookies-next";
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { CmuOAuthBasicInfo } from "../../types/CmuOAuthBasicInfo";

type SuccessResponse = {
  ok: true;
};

type ErrorResponse = {
  ok: false;
  message: string;
};

export type SignInResponse = SuccessResponse | ErrorResponse;

async function getOAuthAccessTokenAsync(
  authorizationCode: string
): Promise<string | null> {
  try {
    const response = await axios.post(
      process.env.CMU_OAUTH_GET_TOKEN_URL as string,
      {},
      {
        params: {
          code: authorizationCode,
          redirect_uri: process.env.CMU_OAUTH_REDIRECT_URL,
          client_id: process.env.CMU_OAUTH_CLIENT_ID,
          client_secret: process.env.CMU_OAUTH_CLIENT_SECRET,
          grant_type: "authorization_code",
        },
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (err) {
    return null;
  }
}

async function getCMUBasicInfoAsync(accessToken: string) {
  try {
    const response = await axios.get(
      process.env.CMU_OAUTH_GET_BASIC_INFO as string,
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );
    return response.data as CmuOAuthBasicInfo;
  } catch (err) {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignInResponse>
) {
  if (req.method !== "POST")
    return res.status(404).json({ ok: false, message: "Invalid HTTP method" });

  //validate authorizationCode
  const authorizationCode = req.body.authorizationCode;
  if (typeof authorizationCode !== "string")
    return res
      .status(400)
      .json({ ok: false, message: "Invalid authorization code" });

  //get access token
  const accessToken = await getOAuthAccessTokenAsync(authorizationCode);
  if (!accessToken)
    return res
      .status(400)
      .json({ ok: false, message: "Cannot get OAuth access token" });

  //get basic info
  const cmuBasicInfo = await getCMUBasicInfoAsync(accessToken);
  if (!cmuBasicInfo)
    return res
      .status(400)
      .json({ ok: false, message: "Cannot get cmu basic info" });

  //Code related to CMU OAuth ends here.
  //The rest code is just an example of how you can use CMU basic info to create session

  //if the code reach here, it means that user sign-in using his CMU Account successfully
  //Now we will use acquired baic info (student name, student id, ...) to create session
  //There are many authentication methods such as token or cookie session or you can use any authentication library.
  //The example will use JsonWebToken (JWT)

  if (typeof process.env.JWT_SECRET !== "string")
    throw "Please assign jwt secret in .env!";

  const token = jwt.sign(
    {
      cmuAccount: cmuBasicInfo.cmuitaccount,
      firstName: cmuBasicInfo.firstname_EN,
      lastName: cmuBasicInfo.lastname_EN,
      studentId: cmuBasicInfo.student_id, //Note that not everyone has this. Teachers and CMU Staffs don't have student id!
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h", // Token will last for one hour only
    }
  );

  //Write token in cookie storage of client's browser
  //Note that this is server side code. We can write client cookie from the server. This is normal.
  //You can view cookie in the browser devtools (F12). Open tab "Application" -> "Cookies"
  setCookie("cmu-oauth-example-token", token, {
    req,
    res,
    maxAge: 3600,
    //Set httpOnly to true so that client JavaScript cannot read or modify token
    //And the created token can be read by server side only
    httpOnly: true,
    sameSite: "lax",
    //force cookie to use HTTPS only in production code
    secure: process.env.NODE_ENV === "production",
    path: "/",
    //change to your hostname in production
    domain: "localhost",
  });

  return res.json({ ok: true });
}
