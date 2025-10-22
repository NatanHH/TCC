// Ajuste o caminho do import abaixo conforme seu projeto
import prisma from "../../../lib/prisma"; // <- ajuste se necessário

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const professores = await prisma.professor.findMany();
    return new Response(JSON.stringify(professores), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/professor", err);
    return new Response(
      JSON.stringify({ error: "Erro ao listar professores" }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, senha } = body ?? {};
    if (!nome || !email || !senha)
      return new Response(
        JSON.stringify({ error: "Dados obrigatórios ausentes." }),
        {
          status: 400,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
    const novo = await prisma.professor.create({
      data: { nome, email, senha },
    });
    return new Response(JSON.stringify(novo), {
      status: 201,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /api/professor", err);
    return new Response(
      JSON.stringify({ error: "Erro ao criar professor" }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
}
