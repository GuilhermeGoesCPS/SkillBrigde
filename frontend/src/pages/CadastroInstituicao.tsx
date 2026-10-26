import { useEffect } from "react";
import OrganizationRegistration from "../components/OrganizationRegistration";

export default function CadastroInstituicao() {
  useEffect(() => {
    document.title = "SkillBridge | Cadastro - Instituição";
  }, []);

  return <OrganizationRegistration tipo="instituicao" />;
}
