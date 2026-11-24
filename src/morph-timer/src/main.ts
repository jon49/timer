import "@jon49/web/app-actions.js"
import "@jon49/web/_action.lifecycle.js"
import "./timer-navigation"
import { actions } from "./actions"
import { render } from "./render"

Object.assign(window.app, actions)

render()
