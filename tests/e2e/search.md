# Search

Hybrid search (Pagefind + MiniLM + RRF) in the browser, on the `/search` route. State: `q`, `mode=ai|keyword`.

## Flows

- `/search?q=protein` fills the query and lists results.
- The AI and Keyword buttons write `mode` (replace). Absent `mode` means AI.
- An empty query shows the hint instead of results.
- `/pagefind/pagefind.js` is present in the build output.
