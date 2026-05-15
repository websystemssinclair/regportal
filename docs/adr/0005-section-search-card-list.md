# Section Search: card list layout, not DataTable

Section Search results are displayed as a card list. Each Section is a card showing Course code, title, Section Number, instructor, modality, meeting days/times, seat availability, and action buttons (Register Now / Add to Cart). PrimeVue DataTable is used only in Admin views.

RegPortal is mobile-first. Students browsing Section Search on phones need to evaluate one Section at a time — the primary action is reading a single Section's details and deciding to add it to their Cart. DataTable's columnar layout fights small screens and requires custom responsive templates for every column to remain usable. Card layout is naturally responsive, easier to manage focus order for keyboard navigation, and maps directly to the per-Section mental model.

DataTable is appropriate for Admin views (Terms list, etc.) where users are on desktop and comparing rows across multiple columns.

## Considered Options

- **PrimeVue DataTable** — rejected: columnar layout requires heavy responsive overrides for mobile; WCAG focus management across rows/columns is more complex than a list of cards
- **Card list (chosen)** — mobile-first naturally; each card is a self-contained focusable unit; straightforward WCAG landmark and focus order; easier to embed Register Now / Add to Cart actions per item
