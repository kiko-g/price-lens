# Price Lens

Price Lens is a project for tracking supermarket prices and all the goods that come from that. The idea for the project came from a desire to gather inflation data into the future and help shoppers be aware of what the shelves do not tell the buyer.

Tracking portuguese supermarkets: Continente, Auchan, Pingo Doce and more to come. Started in December 2024.

## Theming

Developer notes on theming. The main theme file is [`src/app/globals.css`](src/app/globals.css). Here are some resources to help you customize themes on top of shadcn:

- https://www.styleglide.ai/themes
- https://tweakcn.com/editor/theme
- https://ui.shadcn.com/themes
- https://www.shadcnblocks.com/

## Next Steps

- [x] Ensure scraper is completely using upserting behavior.
- [x] Orchestate a job in admin page that efficiently updates every store product by visiting every url.
- [x] Review product scheduling. Visualization of the schedule in admin page.
- [x] Scraping should include a column `store_products.available` so we can tell wether products became unavaible.
- [x] Crawl store origins for new product discovery.
- [x] Update page title dynamically. Price Lens | Products is insufficient when we have search filters active.
- [x] Chart floor and ceiling planning
- [x] Chart should have refined data points for each range: update x scale (font size and more) and update number of data points for 5Y and MAX. Should never plot more than 500 points probably!
- [x] 1200 ms debounce on product search
- [x] Develop `business.ts` to have priority business logic data propagated from there across the app (single source of truth)
- [x] (+/-) Add store_products column better than available that sets the status according to the last scrape http response status
- [x] Example spotify for searching when adding a song to a playlist
- [ ] Finish product category priority manual association
- [ ] Benchmark api routes
- [ ] Check query speeds especially on product page: loading time is very long for compare and related section.
- [ ] Product groups and a page for that
- [ ] Easily jump to compare pages
- [ ] Scan barcode with phone camera feature.
- [ ] Product filter options: show only available, missing barcode, must have barcode
- [ ] Badass smoke test
- [ ] Add supermarket SuperCor and Lidl
- [ ] Product analytics and views for better search results and ecosystem informatization
- [ ] Develop idea of money saving tally like glovo.
- [ ] If user searches for products including the name of the store origin we should help them out.
- [ ] Some products could have multiple canonical categories attached to them. So we could have more than 1 canonical id: a new column possibly for additional references? A product like Açai Oakberry in continente is under Congelados > Frutas e Legumes > Frutas and wont be identified as Gelado... That's kind of a pain dont you think? Altho setting this precedent in the database may be truly horrific
- [ ] Add route for /products/barcode/xxx
- [ ] Radically improve home page and think of marketing/sales/promoting the product via the homepage and its branding
- [ ] Investigate our design system and app feel to be like Polymarket
- [ ] Think about and plan product groups e.g. all coffee capsules store_products should be loosely associated
- [ ] Add list feature (more than just favorites)
- [ ] Add side by side comparer and possibly N-way product comparer. Should work for identical products but also more.
- [ ] Organize types
- [ ] Investigate if more things can be scraped and what new columns can be used for `store_products`.
- [ ] Chart error
- [ ] Add store_products.sku

```
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
```

- [ ] Redis error: sometimes console is just pinging. I wonder if the implementation is healthy dont even remmeber what it does

```
Redis Client Error Error: read ETIMEDOUT
    at ignore-listed frames {
  errno: -60,
  code: 'ETIMEDOUT',
  syscall: 'read'
}
```
