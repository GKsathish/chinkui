import axios from "axios";
import { useState } from "react";
import Button from "../utils/buttons/Button";
import { SpriteAnimation } from "../utils/SpriteAnimation";
import csrfTokenService from "../utils/csrfTokenService";

interface SignUpFormProps {
  showSpinner: (val: boolean) => void;
  onSuccess: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, showSpinner }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");

  // Validation functions
  const validateUsername = () => {
    if (username.length < 4) {
      setUsernameError("Username must be at least 4 characters");
    } else {
      setUsernameError("");
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPassword = () => {
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const validateEmail = () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError("");
    }
  };

  const validateMobile = () => {
    const re = /^[0-9]{10}$/;
    if (!re.test(mobile)) {
      setMobileError("Mobile number must be 10 digits");
    } else {
      setMobileError("");
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormError("");
    showSpinner(true);

    // Run all validations before submitting
    validateUsername();
    validatePassword();
    validateConfirmPassword();
    validateEmail();
    validateMobile();

    // Check if any error exists
    if (
      usernameError ||
      passwordError ||
      confirmPasswordError ||
      emailError ||
      mobileError ||
      !username ||
      !password ||
      !confirmPassword ||
      !email ||
      !mobile
    ) {
      showSpinner(false);
      setFormError("Please fill all the feilds before submitting");
      return;
    }

    try {
      await csrfTokenService.post(
        `/api/signup`,
        {
          username,
          password,
          confirm_password: confirmPassword,
          mobile,
          email,
        },
        {
          headers: {
            "Content-Type": "application/json",
           
          },
        }
      );

      // Notify parent component of successful signup
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError("Failed to sign up");
      }
    } finally {
      showSpinner(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
       <div className="flex justify-center mb-4 md:hidden">
        <SpriteAnimation
          spriteSheetImage={"sprites/fiesta_logo.png"}
          frameWidth={100}
          frameHeight={100}
          totalFrames={49}
          rows={7}
          cols={7}
          fps={21}
          delay={3000}
        />
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col mb-2">
          <input
            // className="mt-1"
            type="text"
            id="username"
            value={username}
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            onBlur={validateUsername}
            required
          />
          {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
        </div>
        <div className="flex flex-col mt-2 mb-2">
          <input
            // className="mt-1"
            type="password"
            id="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            required
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        </div>
        <div className="flex flex-col mt-2 mb-2">
          <input
            // className="mt-1"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={validateConfirmPassword}
            required
          />
          {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}
        </div>
        <div className="flex flex-col mt-2 mb-2">
          <input
            // className="mt-1"
            type="text"
            id="mobile"
            value={mobile}
            placeholder="Mobile"
            onChange={(e) => setMobile(e.target.value)}
            onBlur={validateMobile}
            required
          />
          {mobileError && <p className="text-red-500 text-sm">{mobileError}</p>}
        </div>
        <div className="flex flex-col mt-2 mb-2">
          <input
            // className="mt-1"
            type="email"
            id="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            required
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
        </div>
        <div className="flex w-full justify-center mt-[10px]">
          <Button type="submit" text={"Sign Up"}></Button>
        </div>
      </form>
      {formError && (
        <div className="flex w-full p-1 text-red-600 text-sm font-medium justify-center">
          <p>{formError}</p>
        </div>
      )}
    </div>
  );
};

export default SignUpForm;
