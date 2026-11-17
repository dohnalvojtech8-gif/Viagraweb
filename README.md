# Testovací e-shop — Render + Supabase

Český obchod s katalogem, košíkem a testovacími objednávkami. Úpravy produktů, fotografií, textů, barev, dopravy, dokumentů a stavů objednávek přes `/admin`.

## Spuštění
Node.js 24, bez externích závislostí: `npm ci`, `npm run build`, `npm test`, `npm start`.

## Nasazení
- Render Web Service: build `npm ci && npm run build && npm test`, start `npm start`.
- Trvalá data: Supabase Postgres, tabulka `shop_records`, RLS a odebraná všechna práva rolím `anon` a `authenticated`.
- Databázový most `shop-database` běží v Supabase Edge Functions. Ověřuje nezávislý náhodný serverový token; v kódu je pouze jeho SHA-256 otisk. Databázové privilegované klíče se čtou z automatických tajných proměnných Supabase a neopouštějí Edge Function.
- Render má svůj ověřovací token pouze v proměnných prostředí. Klient dostává jen JSON, nikoli databázové nebo serverové klíče.

## Administrace
První jednorázový odkaz vyžádá nové heslo (min. 12 znaků). Heslo se ukládá přes PBKDF2-SHA256, náhodnou sůl a 210 000 iterací. Relace používají náhodný token; v databázi je jen jeho hash. Cookie je HttpOnly, Secure, SameSite=Lax.

Server autorizuje každou administrační operaci, zákazníkům povoluje jen jejich vlastní historii objednávek, chrání zápisy kontrolou Origin a omezuje pokusy o přihlášení. Render adaptér zahazuje klientem zaslané hlavičky `oai-*`.

Po použití prvního odkazu se znovu nelze inicializovat. Při přihlašování lze použít heslo správce, nebo po nastavení služby Resend jednorázový odkaz v e-mailu. Zákaznické účty používají ověření e-mailu přes Resend.

## Proměnné prostředí
Viz `.env.example`. Skutečné hodnoty patří jen do Render Environment.

`TEST_MODE=true`: pouze testovací objednávky, bez platby, bez odeslání obchodníkovi a bez doručení. Ukázková kolekce obsahuje běžné doplňky do domácnosti. Není implementována kontrola receptů ani systém výdeje léčiv. Tato verze není určená k prodeji léčiv na předpis.

## První kroky
1. Použijte jednorázový odkaz pro nastavení hesla správce.
2. Upravte produkty a obsah v administraci.
3. Pro zákaznické přihlašování nastavte v Nastavení odesílací službu Resend (ověřený odesílatel a API klíč).
4. Ověřte testovací objednávku. Objednávky z předchozího webu nebyly kopírovány do nové databáze.
