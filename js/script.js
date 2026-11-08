const WHATSAPP = "5511900000000"; // troque pelo seu número (DDI + DDD + número)

/* ==========================================================================
   Sorriso Pleno Odontologia — interações da página
   JavaScript puro, sem dependências: funciona abrindo o index.html direto.
   ========================================================================== */

/* ---------- Configurações ---------- */
const NOME_CLINICA = "Sorriso Pleno Odontologia";
const MENSAGEM_PADRAO = "Olá! Vim pelo site da Sorriso Pleno e gostaria de agendar uma avaliação.";
const TEMPO_CARROSSEL = 6000; // tempo de cada depoimento na tela, em milissegundos

/* ---------- Utilitários ---------- */
const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

function linkWhatsApp(msg) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function soDigitos(texto) {
  return String(texto).replace(/\D/g, "");
}

// Formata um telefone brasileiro: (11) 91234-5678 ou (11) 3123-4567
function formatarTelefone(digitos) {
  const d = digitos.slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;

  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  if (numero.length <= 4) return `(${ddd}) ${numero}`;
  if (d.length <= 10) return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
  return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
}

/* ---------- 1. Ano atual no rodapé ---------- */
function iniciarAno() {
  const ano = String(new Date().getFullYear());
  document.querySelectorAll("[data-ano]").forEach((el) => {
    el.textContent = ano;
  });
}

/* ---------- 2. Links de WhatsApp ----------
   Todo elemento com data-whatsapp vira link para o número configurado.
   Use data-msg="..." para mudar a mensagem inicial de um link específico. */
function iniciarLinksWhatsApp() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = linkWhatsApp(link.dataset.msg || MENSAGEM_PADRAO);
    link.target = "_blank";
    link.rel = "noopener";
  });

  // Mostra o número formatado no rodapé, sem o DDI do Brasil
  const numeroLocal = WHATSAPP.startsWith("55") ? WHATSAPP.slice(2) : WHATSAPP;
  document.querySelectorAll("[data-whatsapp-numero]").forEach((el) => {
    el.textContent = formatarTelefone(numeroLocal);
  });
}

/* ---------- 3. Cabeçalho: diminui e ganha sombra ao rolar ---------- */
function iniciarCabecalho() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  let agendado = false;
  const atualizar = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
    agendado = false;
  };

  window.addEventListener("scroll", () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(atualizar);
    }
  }, { passive: true });

  atualizar();
}

/* ---------- 4. Menu mobile (hambúrguer) ---------- */
function iniciarMenu() {
  const header = document.querySelector("[data-header]");
  const botao = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("menu-principal");
  if (!header || !botao || !menu) return;

  const telaGrande = window.matchMedia("(min-width: 960px)");
  const estaAberto = () => botao.getAttribute("aria-expanded") === "true";

  function definir(aberto) {
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    header.classList.toggle("menu-aberto", aberto);
    document.body.classList.toggle("sem-rolagem", aberto);
  }

  botao.addEventListener("click", () => definir(!estaAberto()));

  // Fecha ao escolher um link
  menu.addEventListener("click", (evento) => {
    if (evento.target.closest("a")) definir(false);
  });

  // Fecha ao tocar no fundo escurecido (ele faz parte do próprio header)
  header.addEventListener("click", (evento) => {
    if (evento.target === header && estaAberto()) definir(false);
  });

  // Fecha com Esc e devolve o foco ao botão
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && estaAberto()) {
      definir(false);
      botao.focus();
    }
  });

  // Fecha se o foco do teclado sair do cabeçalho
  header.addEventListener("focusout", (evento) => {
    if (estaAberto() && evento.relatedTarget && !header.contains(evento.relatedTarget)) {
      definir(false);
    }
  });

  // Ao virar tela grande, o menu volta ao normal
  telaGrande.addEventListener("change", (evento) => {
    if (evento.matches) definir(false);
  });
}

/* ---------- 5. Destaca no menu a seção visível ---------- */
function iniciarMenuAtivo() {
  const links = [...document.querySelectorAll(".nav__link[href^='#']")];
  if (!links.length || !("IntersectionObserver" in window)) return;

  // Seções sem link no menu (topo e agendamento) apenas apagam o destaque
  const secoes = new Map();
  document.querySelectorAll("main section[id]").forEach((secao) => {
    secoes.set(secao, links.find((link) => link.getAttribute("href") === `#${secao.id}`) || null);
  });

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      links.forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });
      const ativo = secoes.get(entrada.target);
      if (ativo) {
        ativo.classList.add("is-active");
        ativo.setAttribute("aria-current", "true");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  secoes.forEach((_, secao) => observador.observe(secao));
}

/* ---------- 6. Animação de entrada ao rolar ---------- */
function iniciarRevelar() {
  const itens = document.querySelectorAll(".reveal");
  if (!itens.length) return;

  if (movimentoReduzido.matches || !("IntersectionObserver" in window)) {
    itens.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("is-visible");
        obs.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  itens.forEach((el) => observador.observe(el));
}

/* ---------- 7. Contadores animados ----------
   O número final já está no HTML. Sem animação (movimento reduzido),
   ele simplesmente continua lá. */
function animarNumero(el) {
  const alvo = Number(el.dataset.contador);
  const casas = Number(el.dataset.casas || 0);
  const formato = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
  const duracao = 1800;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min(Math.max((agora - inicio) / duracao, 0), 1);
    const suave = 1 - Math.pow(1 - progresso, 3); // desacelera no final
    el.textContent = formato.format(alvo * suave);
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

function iniciarContadores() {
  const numeros = document.querySelectorAll("[data-contador]");
  if (!numeros.length || movimentoReduzido.matches || !("IntersectionObserver" in window)) return;

  numeros.forEach((el) => {
    el.textContent = "0";
  });

  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        animarNumero(entrada.target);
        obs.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.6 });

  numeros.forEach((el) => observador.observe(el));
}

/* ---------- 8. Carrossel de depoimentos ---------- */
function iniciarCarrossel() {
  const raiz = document.querySelector("[data-carrossel]");
  if (!raiz) return;

  const trilho = raiz.querySelector("[data-carrossel-trilho]");
  const slides = [...raiz.querySelectorAll("[data-carrossel-slide]")];
  const botaoAnterior = raiz.querySelector("[data-carrossel-anterior]");
  const botaoProximo = raiz.querySelector("[data-carrossel-proximo]");
  const areaPontos = raiz.querySelector("[data-carrossel-pontos]");
  const botaoPausa = raiz.querySelector("[data-carrossel-pausa]");
  if (!trilho || slides.length < 2) return;

  let atual = 0;
  let timer = null;
  let pausadoPeloUsuario = false;
  let mouseDentro = false;
  let focoDentro = false;

  // Cria um ponto (botão) para cada depoimento
  const pontos = slides.map((_, i) => {
    const ponto = document.createElement("button");
    ponto.type = "button";
    ponto.className = "carousel__dot";
    ponto.setAttribute("aria-label", `Mostrar depoimento ${i + 1} de ${slides.length}`);
    ponto.addEventListener("click", () => irPara(i));
    areaPontos.appendChild(ponto);
    return ponto;
  });

  function irPara(indice) {
    atual = (indice + slides.length) % slides.length;
    trilho.style.transform = `translateX(-${atual * 100}%)`;

    slides.forEach((slide, i) => {
      const ativo = i === atual;
      slide.setAttribute("aria-hidden", String(!ativo));
      slide.inert = !ativo;
    });

    pontos.forEach((ponto, i) => {
      if (i === atual) ponto.setAttribute("aria-current", "true");
      else ponto.removeAttribute("aria-current");
    });
  }

  function podeRodar() {
    return !movimentoReduzido.matches && !pausadoPeloUsuario && !mouseDentro && !focoDentro && !document.hidden;
  }

  function pararAuto() {
    clearInterval(timer);
    timer = null;
    trilho.setAttribute("aria-live", "polite"); // parado: anuncia as trocas manuais
  }

  function iniciarAuto() {
    pararAuto();
    if (!podeRodar()) return;
    trilho.setAttribute("aria-live", "off"); // rodando sozinho: não interrompe o leitor de tela
    timer = setInterval(() => irPara(atual + 1), TEMPO_CARROSSEL);
  }

  function atualizarBotaoPausa() {
    if (!botaoPausa) return;
    botaoPausa.hidden = movimentoReduzido.matches;
    botaoPausa.classList.toggle("is-paused", pausadoPeloUsuario);
    botaoPausa.setAttribute(
      "aria-label",
      pausadoPeloUsuario ? "Retomar troca automática dos depoimentos" : "Pausar troca automática dos depoimentos"
    );
  }

  botaoAnterior?.addEventListener("click", () => irPara(atual - 1));
  botaoProximo?.addEventListener("click", () => irPara(atual + 1));

  botaoPausa?.addEventListener("click", () => {
    pausadoPeloUsuario = !pausadoPeloUsuario;
    atualizarBotaoPausa();
    iniciarAuto();
  });

  // Pausa enquanto o mouse está em cima ou o foco está dentro
  raiz.addEventListener("mouseenter", () => { mouseDentro = true; pararAuto(); });
  raiz.addEventListener("mouseleave", () => { mouseDentro = false; iniciarAuto(); });
  raiz.addEventListener("focusin", () => { focoDentro = true; pararAuto(); });
  raiz.addEventListener("focusout", (evento) => {
    if (!raiz.contains(evento.relatedTarget)) {
      focoDentro = false;
      iniciarAuto();
    }
  });

  // Setas do teclado quando o foco está nos controles
  raiz.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowLeft") irPara(atual - 1);
    if (evento.key === "ArrowRight") irPara(atual + 1);
  });

  // Arrastar para os lados no celular
  let inicioX = null;
  trilho.addEventListener("pointerdown", (evento) => {
    if (evento.pointerType !== "mouse") inicioX = evento.clientX;
  });
  trilho.addEventListener("pointerup", (evento) => {
    if (inicioX === null) return;
    const distancia = evento.clientX - inicioX;
    inicioX = null;
    if (Math.abs(distancia) > 50) irPara(atual + (distancia < 0 ? 1 : -1));
  });
  trilho.addEventListener("pointercancel", () => { inicioX = null; });

  // Para de rodar com a aba escondida ou se o usuário ativar "reduzir movimento"
  document.addEventListener("visibilitychange", iniciarAuto);
  movimentoReduzido.addEventListener("change", () => {
    atualizarBotaoPausa();
    iniciarAuto();
  });

  irPara(0);
  atualizarBotaoPausa();
  iniciarAuto();
}

/* ---------- 9. Card de tratamento já seleciona a opção no formulário ---------- */
function iniciarAtalhosTratamento() {
  const select = document.getElementById("tratamento");
  if (!select) return;

  document.querySelectorAll("[data-tratamento]").forEach((link) => {
    link.addEventListener("click", () => {
      select.value = link.dataset.tratamento;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

/* ---------- 10. Formulário: máscara, validação e envio pelo WhatsApp ---------- */
function iniciarFormulario() {
  const form = document.getElementById("form-agendamento");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const campoWhats = form.elements.whatsapp;
  const campoMensagem = form.elements.mensagem;
  const contador = form.querySelector("[data-contador-caracteres]");

  // Regras de cada campo: devolvem a mensagem de erro, ou "" se estiver tudo certo
  const validadores = {
    nome(valor) {
      const nome = valor.replace(/\s+/g, " ");
      if (!nome) return "Informe seu nome para sabermos como te chamar.";
      if (nome.length < 3) return "Esse nome parece curto demais. Pode conferir?";
      if (/\d/.test(nome)) return "O nome não deve ter números.";
      return "";
    },
    whatsapp(valor) {
      const d = soDigitos(valor);
      if (!d) return "Informe seu WhatsApp para podermos responder.";
      if (d.length < 10) return "Número incompleto. Digite o DDD e o número, como (11) 91234-5678.";
      if (d[0] === "0" || d[1] === "0") return "Confira o DDD: ele tem dois dígitos e não usa zero, como 11 ou 21.";
      if (d.length === 11 && d[2] !== "9") return "Celulares começam com 9 depois do DDD. Confira o número.";
      return "";
    },
    tratamento(valor) {
      return valor ? "" : "Escolha um tratamento. Se ainda não souber, selecione “Ainda não sei, quero orientação”.";
    },
    periodo(valor) {
      return valor ? "" : "Escolha o período que fica melhor para você.";
    },
  };

  const nomesValidados = Object.keys(validadores);
  const tocados = new Set();
  let tentouEnviar = false;

  function valorDe(nome) {
    const campo = form.elements[nome];
    return campo ? String(campo.value).trim() : "";
  }

  // Devolve os elementos de um campo (radios viram uma lista)
  function controlesDe(nome) {
    const campo = form.elements[nome];
    if (!campo) return [];
    return campo instanceof RadioNodeList ? [...campo] : [campo];
  }

  function mostrarErro(nome, mensagem) {
    const caixa = form.querySelector(`[data-campo="${nome}"]`);
    const erro = document.getElementById(`${nome}-erro`);
    if (!caixa || !erro) return;

    erro.textContent = mensagem;
    caixa.classList.toggle("field--erro", Boolean(mensagem));
    controlesDe(nome).forEach((controle) => {
      if (mensagem) controle.setAttribute("aria-invalid", "true");
      else controle.removeAttribute("aria-invalid");
    });
  }

  function validar(nome) {
    const mensagem = validadores[nome](valorDe(nome));
    mostrarErro(nome, mensagem);
    return !mensagem;
  }

  function mostrarStatus(tipo, texto, url) {
    status.className = `form__status form__status--${tipo}`;
    status.textContent = texto;
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = tipo === "sucesso" ? "Não abriu? Toque aqui." : "Toque aqui para enviar sua mensagem.";
      status.append(" ", link);
    }
  }

  function limparStatus() {
    status.className = "form__status";
    status.textContent = "";
  }

  // Atualiza o resumo de erros enquanto a pessoa corrige os campos
  function atualizarResumo() {
    if (!status.classList.contains("form__status--erro")) return;
    const restantes = form.querySelectorAll(".field--erro").length;
    if (!restantes) limparStatus();
    else mostrarStatus("erro", textoResumo(restantes));
  }

  function textoResumo(quantidade) {
    return quantidade === 1
      ? "Falta só um detalhe: confira o campo destacado."
      : `Faltam ${quantidade} informações: confira os campos destacados.`;
  }

  // Máscara do WhatsApp: (11) 91234-5678, mantendo o cursor no lugar certo
  let digitosAnteriores = soDigitos(campoWhats.value);
  campoWhats.value = formatarTelefone(digitosAnteriores);

  campoWhats.addEventListener("input", (evento) => {
    const cursor = campoWhats.selectionStart ?? campoWhats.value.length;
    let digitos = soDigitos(campoWhats.value);
    let antesDoCursor = soDigitos(campoWhats.value.slice(0, cursor)).length;

    // Apagou só um símbolo da máscara: apaga também o dígito anterior
    if (evento.inputType === "deleteContentBackward" && digitos === digitosAnteriores && antesDoCursor > 0) {
      digitos = digitos.slice(0, antesDoCursor - 1) + digitos.slice(antesDoCursor);
      antesDoCursor -= 1;
    }

    // Colou o número com +55 na frente
    if (digitos.length > 11 && digitos.startsWith("55")) {
      digitos = digitos.slice(2);
      antesDoCursor = Math.max(0, antesDoCursor - 2);
    }

    digitos = digitos.slice(0, 11);
    antesDoCursor = Math.min(antesDoCursor, digitos.length);

    const formatado = formatarTelefone(digitos);
    campoWhats.value = formatado;
    digitosAnteriores = digitos;

    // Recoloca o cursor logo depois do mesmo dígito em que estava
    let posicao = 0;
    let contados = 0;
    while (posicao < formatado.length && contados < antesDoCursor) {
      if (/\d/.test(formatado[posicao])) contados += 1;
      posicao += 1;
    }
    if (document.activeElement === campoWhats) campoWhats.setSelectionRange(posicao, posicao);
  });

  // Validação enquanto a pessoa preenche (sem incomodar quem só passou pelo campo)
  nomesValidados.forEach((nome) => {
    controlesDe(nome).forEach((controle) => {
      const ehEscolha = controle.tagName === "SELECT" || controle.type === "radio";

      controle.addEventListener(ehEscolha ? "change" : "input", () => {
        const caixa = form.querySelector(`[data-campo="${nome}"]`);
        if (ehEscolha || caixa.classList.contains("field--erro")) {
          tocados.add(nome);
          validar(nome);
          atualizarResumo();
        }
      });

      if (!ehEscolha) {
        controle.addEventListener("blur", () => {
          if (valorDe(nome) || tentouEnviar || tocados.has(nome)) {
            tocados.add(nome);
            validar(nome);
            atualizarResumo();
          }
        });
      }
    });
  });

  // Contador de caracteres da mensagem
  if (campoMensagem && contador) {
    const maximo = campoMensagem.maxLength > 0 ? campoMensagem.maxLength : 500;
    const atualizarContador = () => {
      contador.textContent = `${campoMensagem.value.length}/${maximo}`;
    };
    campoMensagem.addEventListener("input", atualizarContador);
    atualizarContador();
  }

  // Texto que chega no WhatsApp (os asteriscos viram negrito lá)
  function montarMensagem() {
    const select = form.elements.tratamento;
    const tratamento = select.options[select.selectedIndex].text;
    const linhas = [
      `Olá! Gostaria de agendar uma avaliação na ${NOME_CLINICA}.`,
      "",
      `*Nome:* ${valorDe("nome").replace(/\s+/g, " ")}`,
      `*WhatsApp:* ${valorDe("whatsapp")}`,
      `*Tratamento:* ${tratamento}`,
      `*Período preferido:* ${valorDe("periodo")}`,
    ];
    const mensagem = valorDe("mensagem");
    if (mensagem) linhas.push("", `*Mensagem:* ${mensagem}`);
    return linhas.join("\n");
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    tentouEnviar = true;

    const invalidos = nomesValidados.filter((nome) => !validar(nome));
    if (invalidos.length) {
      mostrarStatus("erro", textoResumo(invalidos.length));
      controlesDe(invalidos[0])[0].focus();
      return;
    }

    const url = linkWhatsApp(montarMensagem());
    const janela = window.open(url, "_blank");
    if (janela) {
      try {
        janela.opener = null;
      } catch (erro) {
        // alguns navegadores não deixam alterar; sem problema
      }
      mostrarStatus("sucesso", "Tudo certo! Abrimos o WhatsApp em outra aba com a sua mensagem pronta. É só tocar em enviar.", url);
    } else {
      mostrarStatus("aviso", "O navegador bloqueou a abertura automática do WhatsApp.", url);
    }
  });
}

/* ---------- Inicialização ---------- */
iniciarAno();
iniciarLinksWhatsApp();
iniciarCabecalho();
iniciarMenu();
iniciarMenuAtivo();
iniciarRevelar();
iniciarContadores();
iniciarCarrossel();
iniciarAtalhosTratamento();
iniciarFormulario();
