# Backlog

## Bugs

- [ ] Find out if scraping pressure is affecting loading times and UX.
- [x] Products cache issue showing 0-0 ?????

## Macro Features

### MF 1. Barcode scanner

### MF 2. Product families

1. ⁠⁠Chegares a loja
2. ⁠⁠Quero este tipo X de produto
3. ⁠⁠Diz me o mais barato e/ou o mais barato por unidade

### MF 3. Best deals today in this store

1. Im at this store
2. Tell me what to buy from list X (or favorites)

## General

- [ ] Ask what other pages we could create
- [x] Error states
- [x] Use local database
- [x] Bulk scrape: orchestate a job in admin page that efficiently updates every store product by visiting every url
- [x] Crawl store origins for new product discovery.
- [x] ! Review product scheduling. Visualization of the schedule in admin page.
- [x] ! Update page title dynamically. Price Lens | Products is insufficient when we have search filters active.
- [x] Chart floor and ceiling planning
- [x] ! Chart should have refined data points for each range: update x scale (font size and more) and update number of data points for 5Y and MAX. Should never plot more than 500 points probably!
- [x] Develop `business.ts` to have priority business logic data propagated from there across the app (single source of truth)
- [x] Debounce product search in desktop mode
- [x] Add route for /products/barcode/xxx
- [ ] Tangle scrape action with relevance score? How to reassess?
- [ ] Tangle scrape action with product barcode discoverability action on open api
- [ ] FILTER OPTION FOR RELEVANT PRODUCTS. RELEVANT HAVE MORE VIEWS, MORE DATA POINTS, ETC
- [ ] Radically improve home page and think of marketing/sales/promoting the product via the homepage and its branding
- [ ] Finish product category priority manual association
- [ ] Easily jump to compare pages
- [ ] Scan barcode with phone camera feature.
- [ ] Product analytics and views for better search results and ecosystem informatization
- [ ] Develop idea of money saving tally like glovo.
- [ ] IMAGE URL AS ARRAY!!!! UPDATE SCRAPER, DATABASE AND THEN WE HAVE CAROUSELS (ask if image_urls_extra column is a good idea so that we dont break main images. Good for SEO possibly or something and for code stability.)

## SEO and Usability

- [] Product filters are complex. We cant expect users to use it always. We must have links scattered around the app to set the origin to 1,2,3 or other things like that.
- [] Review SEO for products page. Needs to be fast and relevant products.

## UI Features

- [ ] Product price max variability next to range buttons like TR (min and max % uptick).
- [x] Product filter options: show only available, missing barcode, must have barcode
- [x] Example spotify for searching when adding a song to a playlist
- [x] ! Add side by side comparer and possibly N-way product comparer. Should work for identical products but also more.
- [x] ! Organize types
- [ ] Investigate our design system and app feel to be like Polymarket
- [ ] Use prominent apps as examples: stock circle, general product pages, uber eats
- [ ] Nutri score and priority score
- [ ] Product groups and a page for that
- [ ] If user searches for products including the name of the store origin we should help them out.
- [ ] Some products could have multiple canonical categories attached to them. So we could have more than 1 canonical id: a new column possibly for additional references? A product like Açai Oakberry in continente is under Congelados > Frutas e Legumes > Frutas and wont be identified as Gelado... That's kind of a pain dont you think? Altho setting this precedent in the database may be truly horrific
- [ ] Think about and plan product groups e.g. all coffee capsules store_products should be loosely associated

## Database

- [x] Scraping should include a column `store_products.available` so we can tell wether products became unavaible.
- [ ] Product variants
- [ ] Add list feature (more than just favorites)

## Data layer

- [x] Ensure scraper is completely using upserting behavior.
- [x] (+/-) Add store_products column better than available that sets the status according to the last scrape http response status
- [ ] Add supermarket SuperCor and Lidl
- [ ] Open food facts api: https://world.openfoodfacts.org/product/5060639126521
- [ ] Add store_products.sku
- [ ] Investigate if more things can be scraped and what new columns can be used for `store_products`.

## Performance

- [x] Use some kind of pagination magic wrapper to never deal with the 1000 supabase limit
- [ ] Check query speeds especially on product page: loading time is very long for compare and related section.
- [ ] Efficient SSR
- [ ] Audit queries
- [ ] Benchmark api routes
- [ ] No exact() queries?

## Bug investigation

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
