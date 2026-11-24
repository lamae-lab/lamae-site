# lamae-site

Site web statique du **LAMAE**, laboratoire commun ICB (CNRS, Université Bourgogne Europe) et DAVI, consacré à l'IA agentique, multimodale et empathique.

Le site est publié avec GitHub Pages depuis la branche `main`.

## Contenu

Le site est en HTML, CSS et JavaScript uniquement : pas de PHP, pas de base de données.

Il a été généré à partir de l'ancien site WordPress (thème Auregon et Elementor), avec le même design. Les éléments propres à WordPress ont été retirés : WooCommerce, Contact Form 7 et appels à l'API.

| Chemin | Rôle |
|---|---|
| `index.html`, `*/index.html` | les pages |
| `recherche/` | recherche en JavaScript sur toutes les pages |
| `404.html` | page d'erreur |
| `assets/fonts/` | polices Manrope et DM Sans hébergées dans le site, sans appel à Google Fonts |
| `wp-content/`, `wp-includes/` | CSS, JS et médias repris de WordPress |
| `sitemap.xml`, `robots.txt` | référencement |

## Mise à jour

Le WordPress d'origine a été supprimé (novembre 2026) : les fichiers HTML se modifient désormais directement.

