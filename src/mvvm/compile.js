import {PREFIX, DIRECTIVES} from './directive'
const DIRECTIVE_PATTERN = new RegExp(`${PREFIX}(\\w+)`)
import $ from 'jquery'
/**
 * @param {$} $element 文档节点
 * @param {Observer} observerable 绑定到的数据模型
 * @returns {Array} directives
 */
export default function compileTemplate($element, observerable) {
  const directives = []
  if ($element.children() && $element.children().length > 0) {
    $element.children().each((index, el) => {
      const parseResult = parseElement($(el), observerable)
      if (parseResult) {
        parseResult.forEach((d) => directives.push(d))
      }
      const compileResult = compileTemplate($(el), observerable)
      // compileResult 如果是 array 必须非空再 append
      if (compileResult && compileResult.length > 0) {
        compileResult.forEach((d) => directives.push(d))
      }
    })
  }
  return directives
}

/**
 * 解析指令
 * @param {Jquery} $el 需要解析的文档节点
 * @param {Object} observerable 数据模型
 * @returns {Array} directives
 */
function parseElement($el, observerable) {
  if ($el.length === 0) {
    return null
  }
  const attributes = Array.from($el[0].attributes) || []
  const scope = {
    $parent: $el.parent(),
    $next: $el.next(),
    $el
  }
  const directives = []
  attributes.forEach((attr) => {
    const raw = attr.value
    const directiveName = isDirecitve(attr.name)
    const directiveType = directiveName && DIRECTIVES[directiveName]
    if (directiveName && directiveType) {
      const directive = directiveType.New(raw, scope)
      directive.bind(observerable)
      directives.push(directive)
    }
  })
  return directives.length !== 0 && directives
}

/**
 * @param {string} attr 指令
 * @returns {string} 匹配到的字符
 */
export function isDirecitve(attr) {
  const matchResult = attr.match(DIRECTIVE_PATTERN)
  return matchResult && matchResult[1] || ''
}
