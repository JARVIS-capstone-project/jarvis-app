// Public surface of the `design` module: the route table, per the convention
// in this module's CLAUDE.md.
//
// `DevIndexPage` is deliberately not re-exported. Its only consumer mounts it
// through `React.lazy`, and a static re-export here would pull the page — and
// the component graph it renders — back into whichever chunk imports this
// barrel, silently undoing the split.
export { designRoutes } from '@modules/design/routes'
