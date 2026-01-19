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
- [ ] Crawl store origins for new product discovery.
- [ ] Add store_products.sku
- [ ] Investigate our design system and app feel to be like Polymarket
- [ ] Update page title dynamically. Price Lens | Products is insufficient when we have search filters active.
- [ ] Product filter options: show only available, missing barcode, must have barcode
- [ ] Chart should have refined data points for each range: update x scale (font size and more) and update number of data points for 5Y and MAX. Should never plot more than 500 points probably!
- [ ] Organize types
- [ ] Investigate if more things can be scraped and what new columns can be used for `store_products`.
- [ ] Chart error

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
