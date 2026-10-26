import { useEffect } from "react";
import LoginForm from "../components/LoginForm";

export default function LoginAluno() {
  useEffect(() => {
    document.title = "SkillBridge | Login - Aluno";
  }, []);

  return <LoginForm tipo="aluno" />;
}
