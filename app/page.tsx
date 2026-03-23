"use client"

import { useEffect, useState } from "react"
import jsPDF from "jspdf"

export default function Home() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [lotesParaImprimir, setLotesParaImprimir] = useState<any[]>([])

  const [nome, setNome] = useState("")
  const [validade, setValidade] = useState("")

  const [produtoSelecionado, setProdutoSelecionado] = useState("")
  const [quantidade, setQuantidade] = useState("")

  const [produtoEditandoId, setProdutoEditandoId] = useState<number | null>(null)

  const [loteEditandoId, setLoteEditandoId] = useState<number | null>(null)
  const [quantidadeEditando, setQuantidadeEditando] = useState("")

  const carregarProdutos = async () => {
    const res = await fetch("/api/produtos")
    const data = await res.json()
    setProdutos(data)
  }

  const carregarLotes = async () => {
    const res = await fetch("/api/lotes")
    const data = await res.json()
    setLotes(data)
  }

  const verificarImpressaoAutomatica = async () => {
    const res = await fetch("/api/lotes", {
      method: "PUT",
    })
    const data = await res.json()
    setLotesParaImprimir(data)
  }

  useEffect(() => {
    carregarProdutos()
    carregarLotes()
    verificarImpressaoAutomatica()
  }, [])

  const criarProduto = async () => {
    if (!nome || !validade) {
      alert("Preencha nome e validade.")
      return
    }

    await fetch("/api/produtos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome,
        validadeDias: Number(validade),
      }),
    })

    setNome("")
    setValidade("")
    await carregarProdutos()
  }

  const atualizarProduto = async () => {
    if (!produtoEditandoId) return

    if (!nome || !validade) {
      alert("Preencha nome e validade.")
      return
    }

    await fetch("/api/produtos", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        produtoId: produtoEditandoId,
        nome,
        validadeDias: Number(validade),
      }),
    })

    setNome("")
    setValidade("")
    setProdutoEditandoId(null)
    await carregarProdutos()
    await carregarLotes()
    await verificarImpressaoAutomatica()
  }

  const iniciarEdicaoProduto = (produto: any) => {
    setProdutoEditandoId(produto.id)
    setNome(produto.nome)
    setValidade(String(produto.validade_dias))
  }

  const cancelarEdicaoProduto = () => {
    setProdutoEditandoId(null)
    setNome("")
    setValidade("")
  }

  const excluirProduto = async (produtoId: number) => {
    const confirmar = confirm("Deseja excluir este produto?")
    if (!confirmar) return

    const res = await fetch("/api/produtos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ produtoId }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Não foi possível excluir o produto.")
      return
    }

    await carregarProdutos()
  }

  const criarLote = async () => {
    if (!produtoSelecionado || !quantidade) {
      alert("Selecione um produto e informe a quantidade.")
      return
    }

    await fetch("/api/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        produtoId: Number(produtoSelecionado),
        quantidade: Number(quantidade),
      }),
    })

    setQuantidade("")
    setProdutoSelecionado("")
    await carregarLotes()
    await verificarImpressaoAutomatica()
  }

  const iniciarEdicaoLote = (lote: any) => {
    setLoteEditandoId(lote.id)
    setQuantidadeEditando(String(lote.quantidade))
  }

  const cancelarEdicaoLote = () => {
    setLoteEditandoId(null)
    setQuantidadeEditando("")
  }

  const atualizarLote = async () => {
    if (!loteEditandoId) return

    if (!quantidadeEditando) {
      alert("Informe a quantidade.")
      return
    }

    await fetch("/api/lotes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loteId: loteEditandoId,
        quantidade: Number(quantidadeEditando),
      }),
    })

    setLoteEditandoId(null)
    setQuantidadeEditando("")
    await carregarLotes()
    await verificarImpressaoAutomatica()
  }

  const excluirLote = async (loteId: number) => {
    const confirmar = confirm("Deseja excluir este lote?")
    if (!confirmar) return

    await fetch("/api/lotes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loteId }),
    })

    await carregarLotes()
    await verificarImpressaoAutomatica()
  }

  const gerarPdfEtiqueta = (lote: any, doc?: jsPDF, yInicial?: number) => {
  const pdf = doc || new jsPDF()
  let y = yInicial ?? 20

  const dataValidade = new Date(lote.data_producao + "T00:00:00")
  dataValidade.setDate(dataValidade.getDate() + lote.validade_dias)
  const validadeFormatada = dataValidade.toLocaleDateString("pt-BR")
  const producaoFormatada = new Date(lote.data_producao + "T00:00:00").toLocaleDateString("pt-BR")

  for (let i = 0; i < lote.quantidade; i++) {
    if (y > 230) {
      pdf.addPage()
      y = 20
    }

    // Caixa principal da etiqueta
    pdf.setDrawColor(60)
    pdf.setLineWidth(0.8)
    pdf.roundedRect(12, y, 186, 42, 3, 3)

    // Área reservada para logo
    pdf.setDrawColor(180)
    pdf.rect(16, y + 4, 28, 14)
    pdf.setFontSize(8)
    pdf.setTextColor(120)
    pdf.text("LOGO", 25, y + 12)

    // Título
    pdf.setFontSize(11)
    pdf.setTextColor(40)
    pdf.text("ETIQUETA DE IDENTIFICAÇÃO", 50, y + 10)

    // Produto
    pdf.setFontSize(13)
    pdf.setTextColor(20)
    const nomeProduto = String(lote.nome).toUpperCase()
    pdf.text(nomeProduto, 16, y + 26)

    // Produção
    pdf.setFontSize(9)
    pdf.setTextColor(70)
    pdf.text(`Produção: ${producaoFormatada}`, 16, y + 34)

    // Bloco de validade em destaque
    pdf.setFillColor(240, 240, 240)
    pdf.roundedRect(130, y + 18, 60, 18, 2, 2, "F")

    pdf.setFontSize(8)
    pdf.setTextColor(90)
    pdf.text("VALIDADE", 150, y + 24)

    pdf.setFontSize(16)
    pdf.setTextColor(10)
    pdf.text(validadeFormatada, 138, y + 32)

    y += 48
  }

  return { pdf, y }
}

  const imprimirAgora = async (lote: any) => {
    const { pdf } = gerarPdfEtiqueta(lote)

    pdf.save(`etiquetas-${lote.nome}.pdf`)

    await fetch("/api/lotes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loteId: lote.id }),
    })

    await carregarLotes()
    await verificarImpressaoAutomatica()
    alert("PDF gerado e lote marcado como impresso.")
  }

  const imprimirTodosDoDia = async () => {
    if (lotesParaImprimir.length === 0) {
      alert("Nenhum lote precisa de impressão hoje.")
      return
    }

    const doc = new jsPDF()
    let y = 20

    for (let i = 0; i < lotesParaImprimir.length; i++) {
      const lote = lotesParaImprimir[i]
      const resultado = gerarPdfEtiqueta(lote, doc, y)
      y = resultado.y

      if (i < lotesParaImprimir.length - 1) {
        y += 10
        if (y > 260) {
          doc.addPage()
          y = 20
        }
      }
    }

    doc.save("etiquetas-do-dia.pdf")

    const ids = lotesParaImprimir.map((l) => l.id)

    await fetch("/api/lotes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loteIds: ids }),
    })

    await carregarLotes()
    await verificarImpressaoAutomatica()
    alert("PDF do dia gerado e lotes marcados como impressos.")
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  }

  const wrapperStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
  }

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    color: "#111827",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  }

  const subtitleStyle: React.CSSProperties = {
    color: "#4b5563",
    marginBottom: 24,
    fontSize: 16,
  }

  const sectionTitleStyle: React.CSSProperties = {
    marginBottom: 16,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  }

  const buttonPrimary: React.CSSProperties = {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  }

  const buttonDanger: React.CSSProperties = {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  }

  const buttonSecondary: React.CSSProperties = {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
  }

  const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    minWidth: 180,
    color: "#111827",
    background: "#ffffff",
    fontSize: 15,
  }

  const itemBoxStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#f9fafb",
    color: "#111827",
  }

  const mutedTextStyle: React.CSSProperties = {
    color: "#6b7280",
    fontSize: 15,
  }

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Sistema de Etiquetas</h1>
        <p style={subtitleStyle}>
          Cadastro de produtos, controle de lotes e impressão automática de etiquetas.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              {produtoEditandoId ? "Editar Produto" : "Cadastrar Produto"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                style={inputStyle}
                placeholder="Nome do produto"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="Validade em dias"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />

              {produtoEditandoId ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={buttonPrimary} onClick={atualizarProduto}>
                    Atualizar Produto
                  </button>

                  <button style={buttonSecondary} onClick={cancelarEdicaoProduto}>
                    Cancelar edição
                  </button>
                </div>
              ) : (
                <button style={buttonPrimary} onClick={criarProduto}>
                  Salvar Produto
                </button>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Criar Lote</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <select
                style={inputStyle}
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
              >
                <option value="">Selecione um produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>

              <input
                style={inputStyle}
                placeholder="Quantidade"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />

              <button style={buttonPrimary} onClick={criarLote}>
                Criar Lote
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
              Lotes para imprimir hoje
            </h2>
            <button style={buttonPrimary} onClick={imprimirTodosDoDia}>
              Imprimir todos do dia
            </button>
          </div>

          {lotesParaImprimir.length === 0 ? (
            <div style={mutedTextStyle}>
              Nenhum lote precisa de impressão hoje.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {lotesParaImprimir.map((l) => (
                <div key={l.id} style={itemBoxStyle}>
                  <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 17 }}>
                    {l.nome}
                  </div>
                  <div>Quantidade: {l.quantidade}</div>
                  <div>Última impressão: {l.data_ultima_impressao}</div>
                  <div style={{ marginTop: 10 }}>
                    <button style={buttonSecondary} onClick={() => imprimirAgora(l)}>
                      Imprimir agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Produtos cadastrados</h2>

            {produtos.length === 0 ? (
              <div style={mutedTextStyle}>Nenhum produto cadastrado.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {produtos.map((p) => (
                  <div key={p.id} style={itemBoxStyle}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{p.nome}</div>
                    <div>Validade: {p.validade_dias} dias</div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        style={buttonSecondary}
                        onClick={() => iniciarEdicaoProduto(p)}
                      >
                        Editar produto
                      </button>

                      <button
                        style={buttonDanger}
                        onClick={() => excluirProduto(p.id)}
                      >
                        Excluir produto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Lotes cadastrados</h2>

            {lotes.length === 0 ? (
              <div style={mutedTextStyle}>Nenhum lote cadastrado.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {lotes.map((l) => (
                  <div key={l.id} style={itemBoxStyle}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{l.nome}</div>

                    {loteEditandoId === l.id ? (
                      <>
                        <input
                          style={inputStyle}
                          value={quantidadeEditando}
                          onChange={(e) => setQuantidadeEditando(e.target.value)}
                        />

                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button style={buttonPrimary} onClick={atualizarLote}>
                            Salvar
                          </button>

                          <button style={buttonSecondary} onClick={cancelarEdicaoLote}>
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>Quantidade: {l.quantidade}</div>
                        <div>Produção: {l.data_producao}</div>
                        <div>Última impressão: {l.data_ultima_impressao}</div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            style={buttonSecondary}
                            onClick={() => iniciarEdicaoLote(l)}
                          >
                            Editar lote
                          </button>

                          <button
                            style={buttonSecondary}
                            onClick={() => imprimirAgora(l)}
                          >
                            Imprimir
                          </button>

                          <button
                            style={buttonDanger}
                            onClick={() => excluirLote(l.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}