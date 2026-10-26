import { useEffect } from "react";
import OrganizationRegistration from "../components/OrganizationRegistration";

export default function CadastroEmpresa() {
  useEffect(() => {
    document.title = "SkillBridge | Cadastro - Empresa";
  }, []);

  return <OrganizationRegistration tipo="empresa" />;
}
