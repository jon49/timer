function collector(node: Node): PropertyAttributes | 0 {
  if (node instanceof HTMLElement && node.attributes !== undefined) {
    const values = {}
    let setValues = false
    for(let attr of Array.from(node.attributes)) {
        let aName = attr.name
        if (aName[0] === '#') {
            const attrs =
                aName.length > 1
                    ? aName.slice(1).split(',')
                : []
            const name = attr.value
            if (name in values) {
                // @ts-ignore
                values[name].push(...attrs)
            } else {
                // @ts-ignore
                values[name] = attrs
            }
            node.removeAttribute(aName)
            setValues = true
        }
    }
    return /** @type {*} */(setValues ? values : 0)
  } else {
    let nodeData = node.nodeValue
    if (nodeData && nodeData[0] === '#') {
      node.nodeValue = ""
      return { [nodeData.slice(1)]: [] }
    }
    return 0
  }
}

const TREE_WALKER = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null) as HashTreeWalker
TREE_WALKER.roll = function(n) {
  while(--n) this.nextNode()
  return this.currentNode
}

const genPath = (() => {
  let id = 0
  function pathGenerator(node: Node): Paths {
    const w = TREE_WALKER
    w.currentNode = node

    let refs: Refs = {}
    let names: Names = {}
    let indices: { idx: number, id: number }[] = []
    let idx = 0
    let ref: PropertyAttributes | 0
    do {
      if (ref = collector(node)) {
        const i = idx + 1
        refs[id] = ref
        for (const name of Object.keys(ref)) {
          if (!(name in names)) names[name] = [id]
          else names[name].push(id)
        }
        indices.push({idx: i, id})
        idx = 1
      } else {
        idx++
      }
      id++
    // @ts-ignore
    } while(node = w.nextNode())

    return { refs, names, indices }
  }
  return pathGenerator
})();

function walker(node: Node, paths: Paths): Nodes {
  const refs: {[key: number]: Node} = {}

  const w = TREE_WALKER
  w.currentNode = node

  paths.indices.map(x => refs[x.id] = w.roll(x.idx))

  return refs
}

type GetNodesReturn<T> = {[key in keyof T]: Node}

class Template<T> {

  _refPaths: Paths
  root: HTMLElement | Node
    _nodes: Nodes

  constructor(node: Node, paths: Paths, o: Partial<T> | undefined, element: HTMLElement | undefined | null) {
    this._refPaths = paths
    this.root = element ? element : node.cloneNode(true)
    this._nodes = walker(this.root, this._refPaths)
    if (o) this.update(o)
  }

  getNodes<K extends keyof T>(keys: K[]): GetNodesReturn<K> {
    const nodes = {}
    for (const key of keys) {
        // @ts-ignore
      nodes[key] = this._nodes[this._refPaths.names[key][0]]
    }
    // @ts-ignore
    return nodes
  }

  update(o: Partial<T>) {
    if (!o) return
    Object.keys(o)
    .forEach(key => {
      /**
       * @param {string | number} idx
       */
      this._refPaths.names[key]
      ?.forEach(idx => {
        const n = this._nodes[idx]
        if (n instanceof Text) {
          // @ts-ignore
          n.nodeValue = o[key]
        } else if (n instanceof HTMLElement) {
          const attrs = this._refPaths.refs[idx]
          /**
           * @param {string} x
           */
          if (attrs[key]) {
            // @ts-ignore
            attrs[key].forEach(x => x === "text" ? n.textContent = o[key] : n.setAttribute(x, o[key]))
          } else { console.error(`Key '${key}' value not defined.`) }
        }
      })
    })
    return this
  }
}

const compilerTemplate = document.createElement("x")
function h(strings: TemplateStringsArray, ...args: any[]) {
  const template = String.raw(strings, ...args)
  compilerTemplate.innerHTML = template
  return compilerTemplate.firstElementChild
}

export default function template<T>(node: HTMLTemplateElement | TemplateStringsArray, ...args: any[]): DomGenerator<T> {
  const n: Node | null =
    node instanceof HTMLTemplateElement
      ? node.content.firstElementChild
    : node instanceof Element
      ? node
    : h(node, ...args)
  if (n === null) throw new Error("Template is empty.")
  const paths = genPath(n)
  return (o?: Partial<T>, element?: HTMLElement) => new Template(n, paths, o, element)
}

export type TemplateType<T> = Template<T>

export interface TemplateFactory<T> {
    (node: HTMLTemplateElement | TemplateStringsArray, ...args: any[]): DomGenerator<T>
}

export interface DomGenerator<T> {
    (o?: Partial<T>, element?: HTMLElement): Template<T>
}

export interface Nodes {
    [key: number]: Node
}

export interface Refs {
    [key: number]: PropertyAttributes
}

export interface Names {
    [key: string]: number[]
}

export interface Paths {
    refs: Refs
    names: Names
    indices: {idx: number, id: number}[]
}

export interface PropertyAttributes {
    [name: string]: string[]
}

export interface Update<T> {
    (o: Partial<T>): void
}

export namespace Test {
    export interface Test2 {
        a: string
    }
}

interface HashTreeWalker extends TreeWalker {
    roll: (n: number) => Node;
}
