# Projet d'évaluation Docker

Réalisé avec Claude sonnet 5.5 moyen : demande d'un template des dockerfiles et compose à partir de la fiche guide de projet fournie et du README de consigne.

Stack multi-conteneurs : React + Express + PostgreSQL, conteneurisée avec Docker Compose.

## Prérequis

- Docker Engine 24+
- Docker Compose v2
- Git
- Pour les Macs M1/M2/M3, Windows ARM ou serveurs ARM64 : Docker doit utiliser un environnement ARM64 compatible (Docker Desktop ou un environnement ARM64 natif)

## 1. Installation (une seule fois)

Important :
- `.env` contient uniquement des variables non secrètes comme `HTTP_PORT`, `DB_USER`, `DB_NAME`
- `secrets/db_password.txt` contient le vrai mot de passe PostgreSQL
- ne mettez jamais le mot de passe dans `.env`
- sur Linux/macOS, vous pouvez aussi faire `chmod 644 secrets/db_password.txt` si Docker signale un problème de permission
- sur Windows, `chmod` n’existe pas dans le shell standard ; il est généralement inutile, car le fichier est lu par Docker avec les permissions du système d’exploitation

Après un `git clone`, faites ceci avant de lancer le projet :

Sous PowerShell :

```powershell
git clone <url-du-repo>
cd <repo>
Copy-Item .env.example .env
Copy-Item secrets\db_password.txt.example secrets\db_password.txt
notepad secrets\db_password.txt
```

## 2. Lancer le projet en mode développement

```bash
docker compose up --build
```

Vérification :
- Frontend : http://localhost:5173
- API : http://localhost:3001/api/health

Test rapide :

```bash
curl http://localhost:3001/api/health
```

Réponse attendue : JSON avec `status: ok` et `database: up`.

Pour arrêter :

```bash
docker compose down
```

## 3. Lancer le projet en mode production locale

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d --build
```

Vérification :
- Application : http://localhost:8080
- API : http://localhost:8080/api/health

Test rapide :

```bash
curl -i http://localhost:8080/api/health
```

Pour arrêter :

```bash
docker compose -f compose.yaml -f compose.prod.yaml down
```

## 4. Vérifier que tout fonctionne

Exécuter ces commandes :

```bash
# Dev
docker compose ps
curl http://localhost:3001/api/health
curl http://localhost:5173

# Prod locale
docker compose -f compose.yaml -f compose.prod.yaml ps
curl -i http://localhost:8080/api/health
```

À vérifier :
- tous les services sont en cours d’exécution
- le frontend répond
- l’API répond bien
- la base de données est accessible

## 5. Vérifier la persistance des données

```bash
# 1. Ajouter une donnée
docker compose exec db psql -U postgres -d evaluation \
  -c "INSERT INTO instructions (message) VALUES ('Test de persistance');"

# 2. Redémarrer les conteneurs
docker compose down
docker compose up -d

# 3. Vérifier que la donnée est toujours là
docker compose exec db psql -U postgres -d evaluation \
  -c "SELECT id, message FROM instructions;"
```

Si la ligne `Test de persistance` est toujours présente, la persistance fonctionne.

Pour repartir de zéro :

```bash
docker compose down -v
```

## 6. Cas AMD64 vs ARM64

Le projet est compatible avec les deux architectures, mais la procédure est légèrement différente selon votre environnement.

### AMD64 / Intel / standard Linux

```bash
docker compose up --build
```

### ARM64 / Apple M1-M3 / Windows ARM / serveurs ARM64

Les images sont multi-architectures, donc le lancement est identique en principe :

```bash
docker compose up --build
```

Si vous rencontrez un problème de compatibilité `exec format error`, recréez le builder Docker avec :

```bash
docker buildx create --use --name multiarch-builder
docker run --privileged --rm tonistiigi/binfmt --install all
```

Puis relancez :

```bash
docker compose up --build
```

## 7. Problèmes fréquents

- `bind source path does not exist` : le secret `secrets/db_password.txt` n’existe pas
- `port is already allocated` : un autre service utilise 5173 ou 8080
- `password authentication failed` : le mot de passe secret a changé ; faire `docker compose down -v` puis relancer
- `exec format error` : architecture incompatible ; utiliser le buildx ARM/AMD ou reconstruire l’image

Cette procédure est suffisante pour installer, lancer, tester et vérifier la persistance du projet en local.
