import { useEffect } from "react";
import LoginForm from "../components/LoginForm";

export default function LoginInstituicao() {
  useEffect(() => {
    document.title = "SkillBridge | Login - Instituição";
  }, []);

  return <LoginForm tipo="instituicao" />;
}
