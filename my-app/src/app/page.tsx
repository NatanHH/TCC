//npm run dev para startar o programa

"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (email === "professor@exemplo.com" && senha === "123") {
      router.push("/pginicialprofessor");
    } else {
      alert("Email ou senha incorretos!");
    }
  }
  return (
    <div className="login-container">
      <div className="card">
        <Image
          src=""
          alt="codificai logo"
          className="logo"
          width="200"
          height="200"
        />
        <h2>Login Professor</h2>

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
          <Link href="loginaluno">Fazer login como aluno</Link>
        </div>
      </div>
    </div>
  );
}
function alert(arg0: string) {
  throw new Error("Function not implemented.");
}
