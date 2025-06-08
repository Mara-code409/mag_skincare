const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;

// Vector cu folderele de creat
const vect_foldere = ["temp"];

// Verificăm și creăm folderele necesare
for (let folder of vect_foldere) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        console.log(`Folder creat: ${folder}`);
    }
}

// Definim un obiect global pentru stocarea erorilor
let obGlobal = {
    obErori: null
};

// Funcția initErori() pentru inițializarea obiectului de erori
function initErori() {
    try {
        const continutFisier = fs.readFileSync(path.join(__dirname, "resurse", "json", "erori.json")).toString("utf8");
        obGlobal.obErori = JSON.parse(continutFisier);
    } catch (err) {
        console.log("Eroare la inițializarea erorilor:", err);
        obGlobal.obErori = {
            "cale_baza": "/imagini/erori",
            "statusuri": {
                "403": {
                    "titlu": "Forbidden",
                    "text": "Nu aveți permisiunea de a accesa această resursă!",
                    "imagine": "error-403.png"
                },
                "404": {
                    "titlu": "Not Found",
                    "text": "Pagina pe care o căutați nu există.",
                    "imagine": "error-404.png"
                },
                "400": {
                    "titlu": "Bad Request",
                    "text": "Cererea trimisă către server conține erori.",
                    "imagine": "error-400.png"
                }
            },
            "eroare_default": {
                "titlu": "Eroare",
                "text": "A apărut o eroare neașteptată.",
                "imagine": "error-general.png"
            }
        };
    }
}

// Inițializăm erorile la pornirea aplicației
initErori();
// Funcția pentru afișarea erorilor
function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare;
    
    if (identificator && obGlobal.obErori && obGlobal.obErori.statusuri && obGlobal.obErori.statusuri[identificator]) {
        eroare = obGlobal.obErori.statusuri[identificator];
    } else if (obGlobal.obErori && obGlobal.obErori.eroare_default) {
        eroare = obGlobal.obErori.eroare_default;
    } else {
        eroare = {
            titlu: "Eroare",
            text: "A apărut o eroare neașteptată.",
            imagine: "error-general.png"
        };
    }
    
    const status = identificator || 500;
    
    const caleImagine = imagine || (obGlobal.obErori.cale_baza + "/" + eroare.imagine);
    
    res.status(status).render("pagini/eroare", {
        titlu: titlu || eroare.titlu,
        text: text || eroare.text,
        imagine: caleImagine
    });
}

// Setăm motorul de șabloane
app.set("view engine", "ejs");

// Configurăm fișierele statice
app.use(express.static(path.join(__dirname, 'resurse')));

// Alternativă pentru restricția fișierelor .ejs (Pasul 6)
app.use((req, res, next) => {
    if (req.path.endsWith('.ejs')) {
      afisareEroare(res, 400);
    } else {
      next();
    }
  });

// Pagina principală
app.get("/", (req, res) => {
    res.render("pagini/index", { ip: req.ip });
});

// Ruta pentru favicon
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse", "imagini", "favicon", "favicon.ico"));
});

// Pagina "Despre" - exemplu de pagină suplimentară
app.get("/despre", (req, res) => {
    res.render("pagini/despre", {
        ip: req.ip
    });
});

// Restricție pentru acces direct la directoarele din /resurse
app.get("/resurse", (req, res) => {
    afisareEroare(res, 403);
});

app.get("/resurse/:folder", (req, res, next) => {
    // Dacă e un director (nu conține punct)
    const url = req.url;
    if (!url.includes(".")) {
        afisareEroare(res, 403);
    } else {
        next();
    }
});

// Alias-uri pentru pagina principală
app.get("/index", (req, res) => {
    res.render("pagini/index", { ip: req.ip });
});

app.get("/home", (req, res) => {
    res.render("pagini/index", { ip: req.ip });
});

// Rută generică pentru pagini
app.get("/:pagina", (req, res, next) => {
    const pagina = req.params.pagina;
    
    // Verificăm dacă există fișierul .ejs corespunzător
    const caleEjs = path.join(__dirname, "views", "pagini", pagina + ".ejs");
    
    if (fs.existsSync(caleEjs)) {
        res.render(`pagini/${pagina}`, function(err, rezultatRandare) {
            if (err) {
                console.error(err);
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezultatRandare);
            }
        });
    } else {
        next(); // Trecem la handler-ul următor, care va afișa 404
    }
});

// Pagina Video
app.get("/video", (req, res) => {
    res.render("pagini/video", {
        ip: req.ip
    });
});

// Pagina de resurse și link-uri
app.get("/linkuri", (req, res) => {
    res.render("pagini/linkuri", {
        ip: req.ip
    });
});

// Handler pentru 404 - pagina nu există
app.use((req, res) => {
    afisareEroare(res, 404);
});

// Pornirea serverului
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});