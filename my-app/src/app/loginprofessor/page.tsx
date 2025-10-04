"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeProfessor, setNomeProfessor] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch("/api/loginprofessor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setNomeProfessor(data.nome);
      router.push("/pginicialprofessor");
    } else {
      alert(data.error || "Email ou senha incorretos!");
    }
  }

  return (
    <div className="login-container">
      <div className="card">
        <Image
          src="/images/logopng.png"
          alt="codemind logo"
          className="logo"
          width={200}
          height={200}
        />
        <h2>Login Professor</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
          />
          <input
            type="password"
            placeholder="Senha"
            required
            value={senha}
            onChange={(e) => setSenha((e.target as HTMLInputElement).value)}
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
