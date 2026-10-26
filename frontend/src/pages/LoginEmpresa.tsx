import { useEffect } from "react";
import LoginForm from "../components/LoginForm";

export default function LoginEmpresa() {
  useEffect(() => {
    document.title = "SkillBridge | Login - Empresa";
  }, []);

  return <LoginForm tipo="empresa" />;
}
