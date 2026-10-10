# Miscela — Guida alla preparazione

Web app mobile autonoma per la preparazione della miscela agricola. Progetto, indirizzo, dati locali e interfaccia separati da NozzleGuard. Nessun collegamento a diagnostica, sensori, trattore o barra degli ugelli.

## Percorso

1. Selezionare una delle quattro ricette configurate e inserire superficie, capacità serbatoio e, se necessario, volume tecnico. Confermare serbatoio inizialmente vuoto.
2. Leggere quantità per il campo e carichi, con prodotto ripartito alla stessa concentrazione. Il volume tecnico è esplicito e separato.
3. Seguire Prepara → Aggiungi → Completa → Pronto per ogni carico. Confermare manualmente i passaggi. Prima di un carico successivo, confermare l’utilizzo del precedente e il volume tecnico residuo previsto.
4. Terminare la guida e conservare le conferme nello storico locale. L’app non misura il lavoro reale sul campo.

Ricette: Laudis®, Decis® Top, Propulse®, Poly-Feed™ Foliar 21-21-21. Catalogo e calcoli derivano dal modulo già sviluppato, copiato in questo progetto indipendente. Le configurazioni sono dimostrative: l’etichetta vigente e le condizioni della coltura restano il riferimento per l’impiego reale.

## Utilizzo e limiti

Servire `dist/` tramite un server HTTP. Manifest e service worker permettono l’uso come web app sulla schermata Home e la riapertura offline dopo un primo caricamento riuscito in un browser compatibile. I collegamenti esterni del produttore richiedono rete. Dati e storico sono salvati esclusivamente nel browser corrente, non sincronizzati e non un backup cloud. La pubblicazione Sites mantiene l’accesso privato del prototipo.

Questo prototipo non include pagamenti, abbonamenti, account cliente o distribuzione su App Store/Play Store. È una base indipendente per un servizio dedicato.

## Verifica

`node tests/planner.cjs` verifica le quattro ricette, unità, carichi parziali, bilancio dei volumi, volume tecnico e protezioni contro conferme duplicate. `node --check dist/app.js` verifica la sintassi. Verifica visiva nel browser non eseguita nell’ambiente gestito corrente.
