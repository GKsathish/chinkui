import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../utils/buttons/Button";
import { SpriteAnimation } from "../utils/SpriteAnimation";
import csrfTokenService from "../utils/csrfTokenService";

interface LoginFormProps {
  showSpinner: (val: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ showSpinner }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();

  // Validation functions
  const validateUsername = () => {
    if (username.length < 4) {
      setUsernameError("Username must be at least 4 characters");
      return false;
    } else {
      setUsernameError("");
      return true;
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Don't proceed if already loading
    if (isLoading) return;

    setFormError("");
    setIsLoading(true);
    showSpinner(true);

    // Run all validations before submitting
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    // Check if any error exists
    if (!isUsernameValid || !isPasswordValid || !username || !password) {
      setIsLoading(false);
      showSpinner(false);
      setFormError("Please fill all the fields before submitting");
      return;
    }

    try {
      const response = await csrfTokenService.post(
        `/api/login`,
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",

          },
        }
      );

      if(response&&response.data.description==="Successful login"){
      const { token } = response.data;

      // Store the token in session storage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("username", username);

      // Redirect to lobby or the requested path
      navigate("/lobby");
      }else if(response&&response.data.description){
        setFormError(response.data.description)
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.description) {
        setFormError(err.response.data.description);
      } else {
        setFormError("Failed to login");
      }
    } finally {
      setIsLoading(false);
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
      <form onSubmit={(e) => !isLoading && handleSubmit(e)}>
        <div className="flex flex-col mb-2">
          <input
            className={`mt-1 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            type="text"
            id="login-username"
            value={username}
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            onBlur={validateUsername}
            disabled={isLoading}
            required
          />
          {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
        </div>
        <div className="flex flex-col mt-4 mb-2">
          <input
            className={`mt-1 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            type="password"
            id="login-password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            disabled={isLoading}
            required
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        </div>
        <div className="flex w-full justify-center mt-[40px]">
          <Button
            type="submit"
            text={"Login"}
            isLoading={isLoading}
            loadingText="Logging in..."
            disabled={isLoading}
          />
        </div>
      </form>
      {formError && (
        <div className="flex w-full p-2 mt-3 text-red-600 text-sm font-medium justify-center">
          <p>{formError}</p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
