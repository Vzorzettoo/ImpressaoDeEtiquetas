import db from "../../../lib/db"

export async function GET() {
  const produtos = db.prepare("SELECT * FROM produtos ORDER BY id DESC").all()
  return Response.json(produtos)
}

export async function POST(req) {
  const body = await req.json()
  const { nome, validadeDias } = body

  db.prepare(`
    INSERT INTO produtos (nome, validade_dias)
    VALUES (?, ?)
  `).run(nome, validadeDias)

  return Response.json({ ok: true })
}

export async function PATCH(req) {
  const body = await req.json()
  const { produtoId, nome, validadeDias } = body

  db.prepare(`
    UPDATE produtos
    SET nome = ?, validade_dias = ?
    WHERE id = ?
  `).run(nome, validadeDias, produtoId)

  return Response.json({ ok: true })
}

export async function DELETE(req) {
  const body = await req.json()
  const { produtoId } = body

  const loteRelacionado = db.prepare(`
    SELECT id FROM lotes WHERE produto_id = ?
  `).get(produtoId)

  if (loteRelacionado) {
    return Response.json(
      { ok: false, error: "Este produto possui lotes cadastrados e não pode ser excluído." },
      { status: 400 }
    )
  }

  db.prepare(`
    DELETE FROM produtos
    WHERE id = ?
  `).run(produtoId)

  return Response.json({ ok: true })
}