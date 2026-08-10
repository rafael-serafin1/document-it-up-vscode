# CML (Commentary Markup Language)

Commentary Markup Language (CML) transforma comentários em uma camada semântica navegável do código, baseada em tags que adiciona navegação, documentação, relacionamento e informações semânticas ao código-fonte de forma independente da linguagem de programação.

Seu principal objetivo é permitir a navegação rápida dentro de um arquivo sem depender da estrutura da linguagem de programação. A CML não substitui a documentação da linguagem. Ela adiciona metadados estruturados e navegação semântica independentes da linguagem de programação.

---

# Observações

Todas as tags permitem múltiplas ocorrências, exceto as que estiverem marcadas com **. Além disso, toda tag pertence ao primeiro símbolo encontrado abaixo dela, exceto `<label>` e `<span>`, que descrevem regiões do arquivo.

Por mais que eu tenha usado a linguagem C++ como base para uso do CML, ela não deve se limitar a apenas essa linguagem.

Tags desconhecidas geram avisos e são ignoradas. Já atributos aceitam apenas aspas duplas, sendo assim, não se pode usar atributos da seguinte forma:
```
name=``
name=''
```

A CML aceita qualquer tipo de comentário, sendo eles os mais usados `//`, `/**/` e `/** */`, além de também poder ser usado em formas de comentários mais exóticas como o caso do `#`, `;` e `(**)`. 

---

# Tags

## Identidades das tags

### Tags de navegação

```
<label>
<desc>
<span>
<author>
---> Em Desenvolvimento
<pin>
<entry>
<exit>
<next>
<goto>
<labelref>
<depends>
```

### Tags de documentação

```
<synopsis>
<param>
<return>
<see>
<seealso>
<note>
<warn>
<since>
<status>
---> Em Desenvolvimento
<example>
<throws>
<access>
<platform>
<license>
```

## `<label>`**

Define um ponto de navegação dentro do arquivo. Ela é única até certo ponto, já que pode haver mais de uma etiqueta, mas não pode existir mais de uma label com mesmo nome dentro de um mesmo arquivo.

### Sintaxe

```cpp
//<label>STRINGS</label>
```

Também pode ser utilizada em comentários de bloco.

```cpp
/*
<label>STRINGS</label>
*/
```

### Atributos

`foldable`:
Atributo booleano responsável por definir se uma região é dobrável ou não. 

Não dobrado:
```c
//<label foldable>STRINGS</label>
//<desc>String handlers</desc>
//<span>
.
.
.
// </span>
```

Dobrado:
```c
//<label foldable>STRINGS</label> 
[...]
```

---

## `<desc>`**

Define uma breve descrição da label imediatamente anterior. Apenas uma por etiqueta.

### Exemplo

```cpp
//<label>STRINGS</label>
//<desc>Funções de manipulação de strings.</desc>

void trim(char *str)
{
    ...
}
```

---

## `<span>`**

Marca um intervalo de linhas como pertencente a descrição fornecida por uma `<label>`. Apenas um intervalo para cada etiqueta.

### Exemplo

```cpp
//<label>STRINGS</label>
//<span>
void trim(char *str) {
    ...
}

char[] split(char *str, char splitter) {
    ...
}
// </span>
```

---

## `<author>`**

Descreve quem foi o autor de tal parte do código. Pode ser usado em `<span>`.

### Atributo

`contact`:
Define um meio de contato com o autor. Pode ser email, número de telefone, etc.

`repository`:
Define uma url para o Github do autor.

### Exemplo

```cs
//<author contact="lucão123@example.com" repository="https://github.com/lucas-lucros$$.git">Lucão</author>
public class Carro {
    private string placa;
    private int chasi;
    private Marcas marca;
};
```


---

## `<next>`**

Define um fluxo linear único de documentação.

### Exemplo

```js
//<label>WINDOW_ON_LOAD_HANDLER</label>
//<desc>Handle animation trigger upon window loading status.</desc>
//<next>SCROLL_REVEAL_HANDLER</next>
//<span>

window.onload({
    ...
})

//</span>
```

---

## `<goto>`

Define um fluxo multi-linear único de documentação.

---

## `<pin>`

Define uma marcação em uma linha. Através dessa tag, é possível navegar através da busca por favoritos de um autor, ou buscar partes importantes, partes que precisam ser revisadas, etc. Além de também ser possível filtar/pesquisar através do atributo `priority`.

### Atributos

`as`:
Define o tipo de pino. Valores possíveis:
```
favorite
important
refactored
caution
reviewed
optimization
secured
performatic
hotspot
critical
dirty
```

`by`:
Define quem colocou o pino.

`priority`:
Define a prioridade daquele código. Valores possíveis:
```
none    
low
medium
high 
urgent
```

### Exemplo

```rs
#[derive(Serialize, Deserialize, Debug)]
pub struct CoinPrice {                          //<pin as="important" by="Raphael" priority="high" />
    pub base: String,
    pub currency: String,
    pub amout: String
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CoinbasePrice {                      //<pin as="favorite" by="John Pork" />
    pub data: CoinPrice
}
```

---

## `<entry>`** & `<exit>`

Marca um ponto de entrada. Útil para buscar o ponto de entrada de um código e navegar até lá.

### Exemplo

```rs
//<entry>Rust Main Entry Point</entry>
pub fn main() {
    ...
}

//<exit>Releases all unsafe allocated resources.</exit>
pub fn shutdown() {
    ...
}
```

---

## `<synopsis>`**

Define uma descrição, detalhada ou não, de uma variável, função, classe, struct, etc.

### Exemplo

```cpp
//<synopsis>Configurações de uso para função `void trim(...)`</synopsis>
enum TRIM_CONFIGS {
    ONLY_WHITESPACES = 0,
    ONLY_ESCAPE_SEQUENCES = 1,
    WHITESPACES_AND_ESCAPE_SEQUENCES = 2
};

//<synopsis>Função responsável por remover todos os espaços em branco de uma string.</synopsis>
void trim(char *str, TRIM_CONFIGS config = TRIM_CONFIG::ONLY_WHITESPACES) {
    ...
}
```

---

## `<param>`

Define uma descrição de um certo parâmetro da função. Possui um atributo chamado `name`, cujo uso é obrigatório para descrever o parâmetro pelo seu nome.

### Exemplo

```cpp
// <param name="str">Ponteiro para a string de separação.</param>
// <param name="splitter">Caractere de foco para divisão de string.</param>
char[] split(char *str, char splitter) {
    ...
}
```

---

## `<return>`**

Define uma breve descrição do valor retornado por uma função.

### Exemplo

```cpp
//<return>Soma dos valores de parâmetro 'a' e 'b'.</return>
int sum(int a, int b) {
    return a + b;
}
```

---

## `<note>`

Define uma observação.

### Exemplo

```cpp
//<param>Temperatura em Fahrenheits</param>
//<note>Converte apenas de fahrenheit para celsius</note>
float convert_to_celsius(float F) {
    float C = (F - 32) * 9/5;
    return C;
}
```

---

## `<warn>`

Define um aviso ao desenvolvedor.

### Exemplo

```cpp
//<warn>Essa função não altera a string de parâmetro.</warn>
char* trim(char* str) {
    ...
}
```

---

## `<see>`

Comunica que é necessário dar uma olhada em outra parte do código, seja ela uma função, classe, struct, etc.

### Atributos

> Observação: 
    Apenas um dos atributos podem ser usados por cada tag `<see>`.

`path`:
Permite criar uma ponte até a parte do código desejada através de paths.

`url`:
Permite criar uma ponte até a parte do código desejada através de urls.

`target`:
Permite criar uma ponte até a parte do código desejada através do nome, desde que esteja no mesmo escopo. 

Não se limita a apenas estruturas de dados da linguagem, mas também pode colocar etiquetas CML como alvo através do prefixo '#'. Exemplo: `//<see target="#STRINGS">`

Se não houver uma etiqueta no escopo (arquivo) atual com o nome entregue logo após o '#', um modal com erro será exibido.

### Exemplo

```cpp
//<label>STRINGS</label>
//<span>
void trim(char* str) {
    ...
}
//</span>

//<see target="#STRINGS"/>
void absolute_trim(char* str) {
    ...
}
```

--- 

## `<seealso>`

Comunica que pode ser de interesse dar uma olhada em outra parte do código, seja ela uma função, classe, struct, etc.

### Atributos

> Observação: 
    Apenas um dos atributos podem ser usados por cada tag `<see>`.

`path`:
Permite criar uma ponte até a parte do código desejada através de paths.

`url`:
Permite criar uma ponte até a parte do código desejada através de urls.

`target`:
Permite criar uma ponte até a parte do código desejada através do nome, desde que esteja no mesmo escopo. 

Não se limita a apenas estruturas de dados da linguagem, mas também pode colocar etiquetas CML como alvo através do prefixo '#'. Exemplo: `//<seealso target="#STRINGS">`

Se não houver uma etiqueta no escopo atual com o nome entregue logo após o '#', um modal com erro será exibido.

---

## `<example>`

Define um exemplo que pode ser útil no entendimento de como usar um símbolo.

### Atributos

`lang`:
Específica a linguagem usada no exemplo.

### Exemplo

```cpp
//<example>
//  char *str = "      HELLO            WORLD!\0";
//  trim(*str);
//</example>
void trim(char* str) {
    ...
}
```

---

## `<since>`**

Define quando uma parte do código foi implementada.

### Exemplo

```cpp
//<since>1.17.109</since>
void append_to_file(char* str) {
    ...
}
```

---

## `<status>`**

Define o estado atual de uma partição do código.

### Atributos

`type`
Define o tipo de status do símbolo logo abaixo. Valores possíveis:
```
deprecated
bugged
todo
thread-safe
thread-unsafe
draft
implemented
testing
stable
obsolete
removed
experimental
legacy
frozen
unsafe
platform-specific
```

### Exemplo

```fs
open System

type Terminal = {
    Top: int
    Left: int
}

//<status type="deprecated">Marked for removal in 0.3.5</status>
//<since>0.2.10</since>
let consoleSize(): Terminal =
    let pos = Console.GetCursorPosition()
    match pos with
    | t, l -> 
        {
            Top = t
            Left = l
        }
```

---

## `<platform>`

Define como um símbolo se comporta em um ambiente específico.

### Atributos

`environment`:
Toma um ambiente como alvo para a descrição seguinte. Não pode existir sem o atributo `support`. Valores possíveis:
```
windows
linux
macos
android
ios
wasm
browser
node
win32
uwp
posix
unix
cuda
opengl
vulkan
directx
x11
wayland
```

`support`:
Define se um símbolo tem suporte para um ambiente específicado. Não pode existir sem o atributo `environment`. Valores possíveis:
```
true
false
partial
experimental
```

### Exemplo

```rs 
//<platform environment="win32">Utiliza PowerShell para criar uma pasta</platform>
//<platform environment="linux">Utiliza comando 'mkdir' para criar um diretório</platform>
pub fn make_dir(path: &str) {
    _mkdir(path);
}
```

---

## `<throws>`

Descreve uma exceção específica.

### Atributos

`exception`:
Define a exceção lançada pela função.

### Exemplo

```cpp
//<throws exception="std::invalid_argument">Argumento com valor inválido para função.</throws>
```

---

## `<access>`

Define quem possui permissões de uso.

### Exemplo

```rs
//<access>admin</access>
```

---

## `<license>`**

Define a licença usada.

### Atributo

`type`:
Define o tipo de licença usado. Valores possíveis:
```
MIT
Apache 2.0
BSD
GPL
MPL
EPL
```

> Observação: Não se limita a apenas essas licenças, mas essas são as mais comuns e serão listadas no Completion Provider do atributo `type`.

---

# Futuras Tags

`<labelref>`
`<depends>`
`<performance>`
`<collaterals>`
`<requires>`
`<threading>`
`<security>`
`<generated>`

---

# Funcionamento

Quando a extensão abre um arquivo, ela procura por todas as tags `<label>`.

Cada label encontrada é registrada juntamente com sua posição.

Exemplo interno:

| Nome | Arquivo | Linha |
|------|---------|------:|
| STRINGS | string.cpp | 15 |
| NETWORK | socket.cpp | 82 |

---

# Navegação

A extensão exibe um painel lateral contendo todas as labels encontradas no arquivo atual.

Exemplo:

```
Arquivo Atual

▼ Labels

STRINGS
NETWORK
FILES
PARSING
```

Ao clicar em uma label, o editor move o cursor para a linha onde ela foi declarada.

> **Importante:** somente labels pertencentes ao arquivo atualmente aberto podem ser utilizadas para navegação.

## Por autoria

Com o comando `CML: Search by Author's Name`, é possível fazer uma busca completa no projeto por todos os códigos de autoria de um desenvolvedor através da tag `<author>`. 
É pedido ao usuário para inserir o nome do autor em um Input Box e, ao pressionar Enter, será buscado por todo o projeto por símbolos registrados no nome daquele autor. Assim que a busca terminar, vai mostrar um quick pick com todos os códigos de autoria daquele autor. Ao clicar em qualquer item do quick item, o usuário será lançado até o range correspondente.

Exemplo:
```
Projeto Atual

> Insert Author's name

< Rafael

▼ Author's symbols

DBConnection    (CLASS)
trim            (FUNCTION)
ProductType     (ENUM)
```

## Hierarquia de Labels

A extensão exibe um Quick Pick contento todas as labels pais e, cada label pai pode conter nenhuma ou mais labels filhas. Através de um segundo comando chamado `CML: Show Hierarchy`, é possível escolher por uma label-pai, para procurar as labels-filhas deste e assim pode escolher a label-filha desejada para navegar até ela.

Exemplo: 

```
Arquivo Atual

▼ Labels

CLASSES
FUNÇÕES
STRUCTS

*escolhe CLASSES*

▼ Labels de CLASSES

BANCO_DE_DADOS
HTTP

```

Exemplo de síntaxe:

```cpp
//<label>CLASSES</label>
//<span>

//<label>BANCO_DE_DADOS</label>
//<span>
class Connection {
    ...
};
//</span>

// </span>
```

CLASSES ----> BANCO_DE_DADOS
  pai             filho

Ao clicar em uma label-filha, o editor move o cursor para a linha onde ela foi declarada.

> **Importante:** somente labels pertencentes ao arquivo atualmente aberto podem ser utilizadas para navegação.

## Fluxo de leitura 

### Linear

Permite que através de `<label>` e `<next>` seja possível definir um fluxo de leitura linear apropriado para o desenvolvedor. Fluxo esse podendo ser visto através de um pipeline gerado ao usar o comando `CML: Show Linear Flux`.

```cpp
//<label>DATA_BASE_CONFIGS</label>
//<next>#DATA_BASE_CREATE</next>
//<span>
class DBConnection {
    ...
}
// </span>


//<label>DATA_BASE_CREATE</label>
//<next>#DATA_BASE_READ</next>
//<span>
class DBCreate {
    ...
}
//</span>

//<label>DATA_BASE_READ</label>
//<next>#DATA_BASE_UPDATE</next>
//<span>
class DBRead {
    ...
}
//</span>
```
 
> **Importante:** O fluxo de leitura não depende de hierarquia e é totalmente independente, além de ser obrigatória a presença da tag `<next>` para que o fluxo seja gerado.

### Tree Root

Permite que através de `<label>` e `<goto>` seja possível definir um fluxo de leitura multi-linear apropriado para o desenvolvedor. Fluxo esse podendo ser visto através de um pipeline gerado ao usar o comando `CML: Show Multi-linear Flux`.

```cpp
//<label>DATA_BASE_CONFIGS</label>
//<goto>#DATA_BASE_CREATE</goto>
//<goto>#DATA_BASE_UPDATE</goto>
//<span>
class DBConnection {
    ...
}
// </span>


//<label>DATA_BASE_CREATE</label>
//<next>#DATA_BASE_READ</next>
//<span>
class DBCreate {
    ...
}
//</span>

//<label>DATA_BASE_READ</label>
//<next>#DATA_BASE_UPDATE</next>
//<span>
class DBRead {
    ...
}
//</span>
```

---

# Regras

## Nome obrigatório

Uma label deve possuir um nome.

✔ Correto

```cpp
//<label>STRINGS</label>
```

✘ Incorreto

```cpp
//<label></label>
```

---

## Labels únicas

Cada arquivo pode possuir apenas uma label com o mesmo nome.

✔ Correto

```cpp
//<label>STRINGS</label>

//<label>NETWORK</label>
```

✘ Incorreto

```cpp
//<label>STRINGS</label>

...

//<label>STRINGS</label>
```

---

## Caracteres permitidos

Os nomes das labels podem conter:

- Letras (`A-Z`, `a-z`)
- Números (`0-9`)
- `_`
- `-`
- `.`

Exemplos:

```
STRINGS
NETWORK_HTTP
Config-File
HTTP.Parser
```

---

## Sensibilidade a maiúsculas

Os nomes das labels **não diferenciam letras maiúsculas e minúsculas**.

Os exemplos abaixo representam a mesma label:

```text
STRINGS
Strings
strings
```

---

# Exemplo completo

```cpp
//====================================================
// Strings
//====================================================

//<label>STRINGS</label>
//<desc>Funções utilitárias para manipulação de texto.</desc>

void trim(char *str)
{
    ...
}

void replace(char *str)
{
    ...
}

void split(char *str)
{
    ...
}
```