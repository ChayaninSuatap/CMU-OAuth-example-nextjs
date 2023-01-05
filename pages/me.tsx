import axios, { AxiosError, AxiosResponse } from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { WhoAmIResponse } from "./api/whoAmI";

export default function MePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [cmuAccount, setCmuAccount] = useState("");
  const [studentId, setStudentId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    //All cookies that belong to the current url will be sent with the request automatically
    //so we don't have to attach token to the request
    //You can view token (stored in cookies storage) in browser devtools (F12). Open tab "Application" -> "Cookies"
    axios
      .get<{}, AxiosResponse<WhoAmIResponse>, {}>("/api/whoAmI")
      .then((response) => {
        if (response.data.ok) {
          setFullName(response.data.firstName + " " + response.data.lastName);
          setCmuAccount(response.data.cmuAccount);
          setStudentId(response.data.studentId ?? "No Student Id");
        }
      })
      .catch((error: AxiosError<WhoAmIResponse>) => {
        if (!error.response) {
          setErrorMessage(
            "Cannot connect to the network. Please try again later."
          );
        } else if (error.response.status === 401) {
          setErrorMessage("Authentication failed");
        } else if (error.response.data.ok === false) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Unknown error occurred. Please try again later");
        }
      });
  }, []);

  function signOut() {
    //Call sign out api without caring what is the result
    //It will fail only in case of client cannot connect to server
    //This is left as an exercise for you. Good luck.
    axios.post("/api/signOut").finally(() => {
      router.push("/");
    });
  }

  return (
    <div className="p-3">
      <h1>Hi, {fullName}</h1>
      <p>{cmuAccount}</p>
      <p>{studentId}</p>
      <p className="text-danger">{errorMessage}</p>

      <button className="btn btn-danger mb-3" onClick={signOut}>
        {errorMessage ? "Go back" : "Sign out"}
      </button>

      <p className="text-muted fs-6">
        This is a protected route. You can try to view this page without token.
        It will fail.
      </p>
    </div>
  );
}
