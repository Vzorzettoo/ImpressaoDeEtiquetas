import db from "../../../lib/db"

function formatarHoje() {
  return new Date().toISOString().split("T")[0]
}

function adicionarDias(dataTexto, dias) {
  const data = new Date(dataTexto + "T00:00:00")
  data.setDate(data.getDate() + dias)
  return data
}

export async function GET() {
  const lotes = db.prepare(`
    SELECT lotes.*, produtos.nome, produtos.validade_dias
    FROM lotes
    JOIN produtos ON produtos.id = lotes.produto_id
    ORDER BY lotes.id DESC
  `).all()

  return Response.json(lotes)
}

export async function POST(req) {
  const body = await req.json()
  const { produtoId, quantidade } = body

  const hoje = formatarHoje()

  db.prepare(`
    INSERT INTO lotes 
    (produto_id, data_producao, quantidade, data_ultima_impressao)
    VALUES (?, ?, ?, ?)
  `).run(produtoId, hoje, quantidade, hoje)

  return Response.json({ ok: true })
}

export async function PUT() {
  const lotes = db.prepare(`
    SELECT lotes.*, produtos.nome, produtos.validade_dias
    FROM lotes
    JOIN produtos ON produtos.id = lotes.produto_id
  `).all()

  const hojeTexto = formatarHoje()
  const hoje = new Date(hojeTexto + "T00:00:00")

  const lotesParaImprimir = lotes.filter((lote) => {
    const proximaImpressao = adicionarDias(
      lote.data_ultima_impressao,
      lote.validade_dias
    )

    return hoje >= proximaImpressao
  })

  return Response.json(lotesParaImprimir)
}

export async function PATCH(req) {
  const body = await req.json()

  const hoje = formatarHoje()

  // editar quantidade
  if (body.loteId && body.quantidade !== undefined) {
    db.prepare(`
      UPDATE lotes
      SET quantidade = ?
      WHERE id = ?
    `).run(body.quantidade, body.loteId)

    return Response.json({ ok: true })
  }

  // marcar como impresso
  if (body.loteId) {
    db.prepare(`
      UPDATE lotes
      SET data_ultima_impressao = ?
      WHERE id = ?
    `).run(hoje, body.loteId)

    return Response.json({ ok: true })
  }

  return Response.json({ ok: false }, { status: 400 })
}

export async function DELETE(req) {
  const body = await req.json()

  if (body.loteIds) {
    const { loteIds } = body
    const hoje = formatarHoje()

    const update = db.prepare(`
      UPDATE lotes
      SET data_ultima_impressao = ?
      WHERE id = ?
    `)

    const transaction = db.transaction((ids) => {
      for (const id of ids) {
        update.run(hoje, id)
      }
    })

    transaction(loteIds)

    return Response.json({ ok: true })
  }

  if (body.loteId) {
    db.prepare(`
      DELETE FROM lotes
      WHERE id = ?
    `).run(body.loteId)

    return Response.json({ ok: true })
  }

  return Response.json(
    { ok: false, error: "Nenhum lote informado." },
    { status: 400 }
  )
}