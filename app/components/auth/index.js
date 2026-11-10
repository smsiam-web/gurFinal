import React, { useEffect, useState } from "react";
import { AppForm, FormBtn, FormInput } from "../shared/Form";
import * as Yup from "yup";
import Button from "../shared/Button";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookSquare } from "react-icons/fa";
import { auth, db, timestamp } from "@/app/utils/firebase";
import Firebase from "firebase";
import { Provider, useSelector } from "react-redux";
import { store } from "@/app/redux/store";
import { FiBox } from "react-icons/fi";
import Image from "next/image";
import { selectUser } from "@/app/redux/slices/authSlice";
import { notifications } from "@mantine/notifications";

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required().label("Email"),
  password: Yup.string().required().label("Password"),
  checkbox: Yup.string().label("Remember me"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(null);

  useEffect(() => {
    const unSub = db.collection("authKey").onSnapshot((snap) => {
      snap.docs.map((doc) => {
        setKey(doc.data().key);
      });
    });
    return () => {
      unSub();
    };
  }, []);

  const handelLoginSignUP = (values) => {
    setLoading(true);
    setTimeout(() => {
      if (isLogin) {
        logIn(values.email, values.password);
      } else {
        signUp(values.email, values.password);
      }
      setLoading(false);
    }, 500);
  };
  // login whith facebook
  const loginWithFacebook = () => {
    const provider = new Firebase.auth.FacebookAuthProvider();
    auth
      .signInWithPopup(provider)
      .then((result) => {
        // /** @type {firebase.auth.OAuthCredential} */
        var credential = result.credential;

        // The signed-in user info.
        var user = result.user;
        // IdP data available in result.additionalUserInfo.profile.
        // ...

        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var accessToken = credential.accessToken;

        // ...
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  // login with goole
  const loginWithGoogle = () => {
    const provider = new Firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(provider)
      .then((userCredential) => {
        addUserToDatabase(userCredential.user);
      })
      .catch((error) => {
        alert(error.message);
        console.log(error);
      });
  };

  const logIn = (email, password) => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);

        // get user doc from Firestore
        db.collection("users")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const dbUser = doc.data();
              console.log(dbUser);
              if (dbUser?.authKey !== key) {
                alert("Unauthorized User Login!");
                auth.signOut(); // optional: log them out
              } else {
                notifications.show({
                  title: "Success",
                  message: `Login successful`,
                  color: "blue",
                  autoClose: 3000,
                });
                console.log("User:", dbUser);
              }
            } else {
              alert("User record not found!");
            }
          })
          .catch((err) => {
            console.error("Error fetching user:", err);
            alert("Error fetching user data");
          });
      })
      .catch((error) => {
        let msg = error.message;

        try {
          // If error.message is a JSON string, parse it
          const parsed = JSON.parse(msg);
          if (parsed?.error?.message) {
            msg = parsed.error.message; // 👉 "INVALID_LOGIN_CREDENTIALS"
          }
        } catch (e) {
          // Not JSON, leave msg as is
        }

        alert(msg); // shows only "INVALID_LOGIN_CREDENTIALS"
        console.log("Error message:", msg);
      });
  };

  const signUp = (email, password) => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        addUserToDatabase(userCredential.user);
        // Show success popup
        alert("Sign Up success, waiting for admin approval");
      })
      .catch((error) => {
        alert(error.message);
        console.log(error);
      });
  };

  const addUserToDatabase = async (user) => {
    const { uid, displayName, email, photoURL } = user;
    const userRef = await db.collection("users").doc(uid).get();
    if (!userRef.exists) {
      db.collection("users").doc(uid).set({
        authKey: null,
        uid,
        name: displayName,
        email,
        image: photoURL,
        created_at: new Date().toISOString(),
      });
    }
  };

  return (
    <Provider store={store}>
      <div className="w-full grid grid-cols-2 min-h-screen  border-none ">
        <div className="col-span-2 md:col-span-1 hidden md:flex flex-col justify-between  inset-0 bg-[#020817] border-none rounded-none">
          <div className="md:flex flex-row  inset-0 ">
            {/* <Package2 className="h-10 w-10 text-background" /> */}
            <div className="pl-5 text-white text-xl font-bold pt-3 flex gap-2 items-center justify-center">
              <FiBox size={40} />
              <h1 className=" text-white text-[24px] font-bold">আম ওয়ালা.</h1>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <Image
              alt="Product image"
              height="400"
              src={"https://firebasestorage.googleapis.com/v0/b/rajshahiraamwala-8b7bf.appspot.com/o/login-dark.png?alt=media&token=aea581a5-f09e-4888-ae1f-984f835bb6af"}
              width="400"
            />
          </div>
          <div className="text-white p-5 max-w-xl flex flex-col items-start">
            <div className="text-white flex flex-col gap-2 ">
              <span className=" text-lg ">
                Ecommerce or electronic commerce is the trading of goods and
                services online. The internet allows individuals and businesses
                to buy and sell an increasing amount of physical goods, digital
                goods, and services electronically.
              </span>
              <span>---</span>
              <h3 className=" leading-none tracking-tight text-white">
                This site Developed Syed Siam Chowdhury
              </h3>
            </div>
          </div>
        </div>

        <div className="text-center col-span-2 md:col-span-1 place-content-center border-none rounded-none">
          <div className=" absolute top-4 right-3">
            <Button
              title={!isLogin ? "Sign up" : "Login"}
              className={"bg-[#020817] text-white w-full text-sm"}
            />
          </div>
          <div className=" mx-auto">
            <div className="p-5">
              <div className="mx-auto max-w-[500px]  rounded-md">
                <div className="p-6 pt-8 my-6 md:my-8">
                  <div className="flex justify-center space-x-4 uppercase font-semibold text-xl text-center border-b-2 border-slate-400 pb-6">
                    <h1
                      className={`${
                        isLogin ? "text-slate-700" : "text-slate-500"
                      } cursor-pointer text-3xl md:text-4xl`}
                      onClick={() => setIsLogin(true)}
                    >
                      login
                    </h1>
                    <h1
                      className={`${
                        !isLogin ? "text-slate-700" : "text-slate-400"
                      } cursor-pointer text-3xl md:text-4xl`}
                      onClick={() => setIsLogin(false)}
                    >
                      register
                    </h1>
                  </div>
                  <h2 className="text-sub-title py-4">
                    {isLogin ? "Login to Your Account" : "Create Your Account"}
                  </h2>

                  <AppForm
                    initialValues={{
                      email: "",
                      password: "",
                      checkbox: "",
                    }}
                    onSubmit={handelLoginSignUP}
                    validationSchema={validationSchema}
                  >
                    <div>
                      <div>
                        <FormInput
                          name="email"
                          placeholder="Email"
                          type="email"
                        />
                        <FormInput
                          name="password"
                          placeholder="Password"
                          type="password"
                        />
                      </div>
                      <div className="mt-6">
                        <FormBtn
                          title={isLogin ? "Sign In" : "Sign Up"}
                          onClick={handelLoginSignUP}
                          loading={loading}
                        />
                      </div>
                    </div>
                  </AppForm>
                  <div className="flex justify-center gap-3 flex-col items-center py-6">
                    <div className="flex justify-center flex-col border-b-2 w-full pb-3">
                      {isLogin ? (
                        <>
                          <p className="text-center text-sub-title pb-1">
                            You don&apos;t have any account?
                          </p>
                          <span
                            className="text-title hover:hover-primary cursor-pointer m-auto w-fit"
                            onClick={() => setIsLogin(false)}
                          >
                            Register Now
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-center text-sub-title pb-1">
                            Already have an account?
                          </p>
                          <span
                            className="text-title hover:hover-primary cursor-pointer m-auto w-fit"
                            onClick={() => setIsLogin(true)}
                          >
                            LogIn here
                          </span>
                        </>
                      )}
                    </div>

                    <p className="pb-2">
                      Or
                      <span className="text-primary pl-2">Continue with</span>
                    </p>
                    <Button
                      onClick={loginWithGoogle}
                      icon={<FcGoogle size={25} />}
                      title="Google"
                      className={
                        "bg-[#0f172a]  hover:bg-[#17233f] text-white w-full text-lg"
                      }
                    />
                    <Button
                      onClick={loginWithFacebook}
                      icon={<FaFacebookSquare size={20} />}
                      title="Facebook"
                      disabled
                      className={"bg-blue-300 text-white w-full text-lg"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
};

export default Auth;
