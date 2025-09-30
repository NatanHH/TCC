"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    if (email === "aluno@exemplo.com" && senha === "123") {
      router.push("/pginialuno"); // coloque o caminho correto aqui
    } else {
      alert("Email ou senha incorretos!");
    }
  }

  return (
    <div className="login-container">
      <div className="card">
        <Image
          src="/images/Logopng.png"
          alt="codificai logo"
          className="logo"
          width="200"
          height="200"
        />
        <h2>Login Aluno</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="submit">Entrar</button>
        </form>
        <div className="link-aluno">
          <Link href="/">Fazer login como Professor</Link>
        </div>
      </div>
    </div>
  );
}
