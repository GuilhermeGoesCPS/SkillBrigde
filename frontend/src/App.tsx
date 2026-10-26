import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import LoginAluno from "./pages/LoginAluno";
import LoginEmpresa from "./pages/LoginEmpresa";
import CadastroAluno from "./pages/CadastroAluno";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import Edital from "./pages/Edital";
import Perfil from "./pages/Perfil";
import Talentos from "./pages/Talentos";
import Vaga from "./pages/Vaga";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login-aluno" element={<LoginAluno />} />
        <Route path="/login-empresa" element={<LoginEmpresa />} />
        <Route path="/cadastro-aluno" element={<CadastroAluno />} />
        <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
        <Route path="/edital" element={<Edital />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/talentos" element={<Talentos />} />
        <Route path="/vaga" element={<Vaga />} />
      </Route>
    </Routes>
  );
}
