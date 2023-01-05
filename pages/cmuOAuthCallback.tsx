import axios, { AxiosError } from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SignInResponse } from "./api/signIn";

export default function CMUOAuthCallback() {
  const router = useRouter();
  const { code } = router.query;
  const [message, setMessage] = useState("");

  useEffect(() => {
    //Next.js takes sometime to read parameter from URL
    //So we'll check if "code" is ready before calling sign-in api
    if (!code) return;

    axios
      .post<SignInResponse>("/api/signIn", { authorizationCode: code })
      .then((resp) => {
        if (resp.data.ok) {
          router.push("/me");
        }
      })
      .catch((error: AxiosError<SignInResponse>) => {
        if (!error.response) {
          setMessage(
            "Cannot connect to CMU OAuth Server. Please try again later."
          );
        } else if (!error.response.data.ok) {
          setMessage(error.response.data.message);
        } else {
          setMessage("Unknown error occurred. Please try again later.");
        }
      });
  }, [code]);

  return <div className="p-3">{message || "Redirecting ..."}</div>;
}
