# 🗺️ Evolução Urbana - Espírito Santo do Pinhal (SP)

Este é um projeto web interativo desenvolvido com **JavaScript Vanilla** (puro), com o objetivo de praticar e aprender enquanto crio algo útil e visualmente interessante.

## 📍 Sobre o Projeto

A proposta é oferecer uma ferramenta visual que permita observar a **evolução urbana** da cidade de **Espírito Santo do Pinhal (SP)** ao longo das décadas, por meio de imagens aéreas e de satélite dos anos: **1978**, **1984**, **2000**, pelas imagens no diretório /imagens/, e **atualmente**, por intermédio das imagens via-satélite do Google Maps, e como opcional, para fins de comparação, o usuário também pode ativar o OpenStreetMap.

Você arrasta o **slider** no topo do site para fazer transições suaves entre as diferentes épocas, analisando o crescimento urbano, a transformação de áreas verdes e o desenvolvimento da malha urbana da cidade.

## ✨ Funcionalidades

- 🕹️ Interface intuitiva com **slider de anos**.
- 🛰️ Visualização alternada entre **Google Maps** e **OpenStreetMap**.
- 📌 Sistema de **pins personalizados** para marcar locais importantes.
- 💾 Opções de **importar e exportar** seus pins em JSON.
- 📱 Interface adaptada para **mobile**, com menu hamburger exclusivo.

## ⚙️ Tecnologias Utilizadas

- **JavaScript Vanilla (puro)** para toda a lógica da aplicação.
- **Leaflet.js** para manipulação e exibição dos mapas interativos.
- **HTML5 + CSS3** com design responsivo.

## ⚠️ Observações Técnicas

As imagens históricas **não utilizam tiles dinâmicos**, e sim imagens posicionadas manualmente sobre o mapa. Isso pode causar leves travamentos ao mudar de ano dependendo do seu hardware ou navegador.

> O foco aqui é **educacional**, e caso você tenha interesse em contribuir com melhorias — como integrar tilesets, adicionar novas épocas ou refinar a performance, e principalmente a responsividade para dispositivos mobile —, **sinta-se livre para colaborar!**

## 🧠 Por que fiz este projeto?

Resolvi criar esse projeto para **praticar JavaScript "puro"**, lidando com DOM, eventos e estrutura de dados sem o uso de frameworks como React ou Vue. Para a parte de mapas, usei o **Leaflet**, que é uma biblioteca leve e poderosa para mapas interativos.
