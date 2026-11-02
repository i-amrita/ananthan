# Screen: locale list (v3 locales)

> v3: German dropped, Spanish added. The locale set is `en ms hi es ml`; the switcher labels are `English`, `Bahasa Melayu`, `हिन्दी`, `Español`, `മലയാളം`.

## Layout

```
 popover (w-48, align end, above the trigger)

        ┌────────────────────────┐
        │ English                │
        │ Bahasa Melayu          │
        │ हिन्दी                 │
        │ Español                │  <- new, replaces Deutsch
        │ മലയാളം                │
        └────────────────────────┘
```

## Behaviour

- One listbox, five options, in the order above. The active option is highlighted and carries `aria-selected="true"`.
- Every option carries `lang="<code>"`, so screen readers pronounce the native name.
- Picking an option writes `?locale=<code>` (replace); `en` clears the param. The other URL params survive.
- The shutter button is a second control for the same value: the code on the iris rotates to the new locale.
- The choice is stored in `localStorage.locale` and restored on the next visit when the URL carries no `?locale=`.

## Captures

375x812 and 1280x800; light and dark; popover open on the shutter and on the nav chip.
