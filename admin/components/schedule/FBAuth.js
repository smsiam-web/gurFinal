import React, { useState } from "react";
import { AppForm, FormBtn, FormInput } from "../shared/Form";
import * as Yup from "yup";
import Button from "../shared/Button";
import { FaFacebookSquare } from "react-icons/fa";
const validationSchema = Yup.object().shape({
  email: Yup.string().email().required().label("Email"),
  password: Yup.string().required().label("Password"),
  checkbox: Yup.string().label("Remember me"),
});

const FBAuth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-5">
      <div className="mx-auto max-w-[400px] bg-slate-100 rounded-md">
        <div className="p-6 pt-8 my-6 md:my-8">
          <div className="flex justify-center space-x-4 uppercase font-semibold text-xl text-center border-b-2 border-slate-400 pb-6">
            <h1
              className={"text-slate-700 cursor-pointer text-3xl md:text-4xl"}
            >
              Facebook Login
            </h1>
          </div>
          <h2 className="text-sub-title pt-8 pb-6">
            {isLogin
              ? "Login with Your Facebook Account"
              : "Create Your Account"}
          </h2>

          <AppForm
            initialValues={{
              email: "",
              password: "",
              checkbox: "",
            }}
            // onSubmit={handelLoginSignUP}
            validationSchema={validationSchema}
          >
            <FormInput name="email" placeholder="Email" type="email" />
            <FormInput name="password" placeholder="Password" type="password" />
            <FormBtn
              title={isLogin ? "LOGIN" : "SIGN UP"}
              //   onClick={handelLoginSignUP}
              loading={loading}
            />
          </AppForm>
          <div className="flex justify-center gap-4 flex-col items-center py-6">
            <p className="pb-2">
              Or
              <span className="text-primary pl-2">Continue with</span>
            </p>
            <Button
              //   onClick={loginWithFacebook}
              icon={<FaFacebookSquare size={20} />}
              title="Facebook"
              className={"bg-blue-500 text-white w-full text-lg"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FBAuth;
