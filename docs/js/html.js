// Source: https://github.com/AntonioVdlC/html-template-tag
// Inspired on http://www.2ality.com/2015/01/template-strings-html.html#comment-2078932192

var htmlElementAttributes = {
  '*': [
    'accesskey',
    'autocapitalize',
    'autofocus',
    'class',
    'contenteditable',
    'dir',
    'draggable',
    'enterkeyhint',
    'hidden',
    'id',
    'inert',
    'inputmode',
    'is',
    'itemid',
    'itemprop',
    'itemref',
    'itemscope',
    'itemtype',
    'lang',
    'nonce',
    'popover',
    'slot',
    'spellcheck',
    'style',
    'tabindex',
    'title',
    'translate',
    'writingsuggestions'
  ],
  a: [
    'charset',
    'coords',
    'download',
    'href',
    'hreflang',
    'name',
    'ping',
    'referrerpolicy',
    'rel',
    'rev',
    'shape',
    'target',
    'type'
  ],
  applet: [
    'align',
    'alt',
    'archive',
    'code',
    'codebase',
    'height',
    'hspace',
    'name',
    'object',
    'vspace',
    'width'
  ],
  area: [
    'alt',
    'coords',
    'download',
    'href',
    'hreflang',
    'nohref',
    'ping',
    'referrerpolicy',
    'rel',
    'shape',
    'target',
    'type'
  ],
  audio: [
    'autoplay',
    'controls',
    'crossorigin',
    'loop',
    'muted',
    'preload',
    'src'
  ],
  base: ['href', 'target'],
  basefont: ['color', 'face', 'size'],
  blockquote: ['cite'],
  body: ['alink', 'background', 'bgcolor', 'link', 'text', 'vlink'],
  br: ['clear'],
  button: [
    'disabled',
    'form',
    'formaction',
    'formenctype',
    'formmethod',
    'formnovalidate',
    'formtarget',
    'name',
    'popovertarget',
    'popovertargetaction',
    'type',
    'value'
  ],
  canvas: ['height', 'width'],
  caption: ['align'],
  col: ['align', 'char', 'charoff', 'span', 'valign', 'width'],
  colgroup: ['align', 'char', 'charoff', 'span', 'valign', 'width'],
  data: ['value'],
  del: ['cite', 'datetime'],
  details: ['name', 'open'],
  dialog: ['open'],
  dir: ['compact'],
  div: ['align'],
  dl: ['compact'],
  embed: ['height', 'src', 'type', 'width'],
  fieldset: ['disabled', 'form', 'name'],
  font: ['color', 'face', 'size'],
  form: [
    'accept',
    'accept-charset',
    'action',
    'autocomplete',
    'enctype',
    'method',
    'name',
    'novalidate',
    'target'
  ],
  frame: [
    'frameborder',
    'longdesc',
    'marginheight',
    'marginwidth',
    'name',
    'noresize',
    'scrolling',
    'src'
  ],
  frameset: ['cols', 'rows'],
  h1: ['align'],
  h2: ['align'],
  h3: ['align'],
  h4: ['align'],
  h5: ['align'],
  h6: ['align'],
  head: ['profile'],
  hr: ['align', 'noshade', 'size', 'width'],
  html: ['manifest', 'version'],
  iframe: [
    'align',
    'allow',
    'allowfullscreen',
    'allowpaymentrequest',
    'allowusermedia',
    'frameborder',
    'height',
    'loading',
    'longdesc',
    'marginheight',
    'marginwidth',
    'name',
    'referrerpolicy',
    'sandbox',
    'scrolling',
    'src',
    'srcdoc',
    'width'
  ],
  img: [
    'align',
    'alt',
    'border',
    'crossorigin',
    'decoding',
    'fetchpriority',
    'height',
    'hspace',
    'ismap',
    'loading',
    'longdesc',
    'name',
    'referrerpolicy',
    'sizes',
    'src',
    'srcset',
    'usemap',
    'vspace',
    'width'
  ],
  input: [
    'accept',
    'align',
    'alt',
    'autocomplete',
    'checked',
    'dirname',
    'disabled',
    'form',
    'formaction',
    'formenctype',
    'formmethod',
    'formnovalidate',
    'formtarget',
    'height',
    'ismap',
    'list',
    'max',
    'maxlength',
    'min',
    'minlength',
    'multiple',
    'name',
    'pattern',
    'placeholder',
    'popovertarget',
    'popovertargetaction',
    'readonly',
    'required',
    'size',
    'src',
    'step',
    'type',
    'usemap',
    'value',
    'width'
  ],
  ins: ['cite', 'datetime'],
  isindex: ['prompt'],
  label: ['for', 'form'],
  legend: ['align'],
  li: ['type', 'value'],
  link: [
    'as',
    'blocking',
    'charset',
    'color',
    'crossorigin',
    'disabled',
    'fetchpriority',
    'href',
    'hreflang',
    'imagesizes',
    'imagesrcset',
    'integrity',
    'media',
    'referrerpolicy',
    'rel',
    'rev',
    'sizes',
    'target',
    'type'
  ],
  map: ['name'],
  menu: ['compact'],
  meta: ['charset', 'content', 'http-equiv', 'media', 'name', 'scheme'],
  meter: ['high', 'low', 'max', 'min', 'optimum', 'value'],
  object: [
    'align',
    'archive',
    'border',
    'classid',
    'codebase',
    'codetype',
    'data',
    'declare',
    'form',
    'height',
    'hspace',
    'name',
    'standby',
    'type',
    'typemustmatch',
    'usemap',
    'vspace',
    'width'
  ],
  ol: ['compact', 'reversed', 'start', 'type'],
  optgroup: ['disabled', 'label'],
  option: ['disabled', 'label', 'selected', 'value'],
  output: ['for', 'form', 'name'],
  p: ['align'],
  param: ['name', 'type', 'value', 'valuetype'],
  pre: ['width'],
  progress: ['max', 'value'],
  q: ['cite'],
  script: [
    'async',
    'blocking',
    'charset',
    'crossorigin',
    'defer',
    'fetchpriority',
    'integrity',
    'language',
    'nomodule',
    'referrerpolicy',
    'src',
    'type'
  ],
  select: [
    'autocomplete',
    'disabled',
    'form',
    'multiple',
    'name',
    'required',
    'size'
  ],
  slot: ['name'],
  source: ['height', 'media', 'sizes', 'src', 'srcset', 'type', 'width'],
  style: ['blocking', 'media', 'type'],
  table: [
    'align',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'frame',
    'rules',
    'summary',
    'width'
  ],
  tbody: ['align', 'char', 'charoff', 'valign'],
  td: [
    'abbr',
    'align',
    'axis',
    'bgcolor',
    'char',
    'charoff',
    'colspan',
    'headers',
    'height',
    'nowrap',
    'rowspan',
    'scope',
    'valign',
    'width'
  ],
  template: [
    'shadowrootclonable',
    'shadowrootdelegatesfocus',
    'shadowrootmode'
  ],
  textarea: [
    'autocomplete',
    'cols',
    'dirname',
    'disabled',
    'form',
    'maxlength',
    'minlength',
    'name',
    'placeholder',
    'readonly',
    'required',
    'rows',
    'wrap'
  ],
  tfoot: ['align', 'char', 'charoff', 'valign'],
  th: [
    'abbr',
    'align',
    'axis',
    'bgcolor',
    'char',
    'charoff',
    'colspan',
    'headers',
    'height',
    'nowrap',
    'rowspan',
    'scope',
    'valign',
    'width'
  ],
  thead: ['align', 'char', 'charoff', 'valign'],
  time: ['datetime'],
  tr: ['align', 'bgcolor', 'char', 'charoff', 'valign'],
  track: ['default', 'kind', 'label', 'src', 'srclang'],
  ul: ['compact', 'type'],
  video: [
    'autoplay',
    'controls',
    'crossorigin',
    'height',
    'loop',
    'muted',
    'playsinline',
    'poster',
    'preload',
    'src',
    'width'
  ]
}

var chars = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

// Dynamically create a RegExp from the `chars` object
const re = new RegExp(Object.keys(chars).join("|"), "g");

// Return the escaped string
function escape(str = "") {
  return String(str).replace(re, (match) => chars[match]);
}

export const attributes = Object.values(htmlElementAttributes).flat();

export function endsWithUnescapedAttribute(acc) {
  return attributes.some((attribute) => acc.endsWith(`${attribute}=`));
}

export const attributesUri = [
  "action",
  "archive",
  "background",
  "cite",
  "classid",
  "codebase",
  "content",
  "data",
  "dynsrc",
  "formaction",
  "href",
  "icon",
  "imagesrcset",
  "longdesc",
  "lowsrc",
  "manifest",
  "nohref",
  "onload",
  "poster",
  "popovertargetaction",
  "profile",
  "src",
  "srcset",
  "style",
  "usemap",
];

function endsWithUriAttribute(acc) {
  return attributesUri.some(
    (attribute) =>
      acc.endsWith(`${attribute}=`) || acc.endsWith(`${attribute}="`)
  );
};

function htmlTemplateTag(literals, ...substs) {
  return literals.raw.reduce((acc, lit, i) => {
    let subst = substs[i - 1];
    if (Array.isArray(subst)) {
      subst = subst.join("");
    } else if (literals.raw[i - 1] && literals.raw[i - 1].endsWith("$")) {
      // If the interpolation is preceded by a dollar sign,
      // substitution is considered safe and will not be escaped
      acc = acc.slice(0, -1);
    } else {
      subst = escape(subst);
    }

    /**
     * If the interpolation is preceded by an unescaped attribute, we need to
     * add quotes around the substitution to avoid XSS attacks.
     *
     * ```
     * const foo = "Alt onload=alert(1)";
     * html`<img src="..." alt=${foo} />`
     *    => <img src="..." alt=Alt onload=alert(1) />
     * ```
     */
    if (endsWithUnescapedAttribute(acc)) {
      acc += '"';
      lit = '"' + lit;
    }

    /**
     * If the interpolation is preceded by an attribute that takes an URI, we
     * remove the interpolation altogether as it can pose serious security
     * vulnerabilities.
     *
     * A warning is displayed in the console.
     */
    if (endsWithUriAttribute(acc)) {
      console.warn(
        "[html-template-tag] Trying to interpolate inside an URI attribute. This can lead to security vulnerabilities. The interpolation has been removed.",
        { acc, subst, lit }
      );

      subst = "";
    }

    return acc + subst + lit;
  });
}

export default htmlTemplateTag;
