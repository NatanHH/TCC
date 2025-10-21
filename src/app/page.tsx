"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginAdm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const res = await fetch("/api/loginadm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (data.success) {
      router.push("/pginicialadm");
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
        <h2>Login Administrador</h2>

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

        <div className="link-professor">
          <Link href="/loginprofessor">Fazer login como professor</Link>
        </div>
        <div className="link-aluno">
          <Link href="/loginaluno">Fazer login como aluno</Link>
        </div>
      </div>
    </div>
  );
}
