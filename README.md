# talk-sre-battlebot-configurator-react

A TypeScript + React + [Material-UI](https://mui.com/) port of the
**BattleBotForge Configurator** originally built as a Python/Flask app in
[`talk-sre-battlebot-configurator`](../talk-sre-battlebot-configurator). It
keeps the same functionality and look and feel — pick a chassis (flipper,
spinner, hammer), a weapon power class, a paint job and a weapon, then see the
price and a checkout summary in real time.

## What changed vs. the Flask app

| Concern | Flask app | This app |
| --- | --- | --- |
| Rendering | Jinja2 templates + vanilla JS | React 18 + React Router + MUI |
| Styling | hand-written `style.css` | MUI theme + `sx` (same palette/fonts) |
| Catalog data | Azure SQL (`colors`, `engines`, `settings`) | Azure SQL via a read-only API in [`server/`](server), consumed through [`src/data/api.ts`](src/data/api.ts) |
| Payment failure | `POST /api/payment-unavailable` logs error code | `console.error` with the same code |

The pricing logic, the deliberately-unreachable payment probe
(`https://notfunctional.local`), the fixed payment error code
(`PAY-MSUTY3ZE-1OFQ`) and the maintenance-mode toggle are preserved so the
demo behaves the same way during the SRE talk.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (ships with npm)
- An [Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/database/)
  seeded with the schema in [`deploy/sql/`](deploy/sql)

## Set up the database

Run the three seed scripts (idempotent) against your Azure SQL Database — e.g.
with `sqlcmd`:

```bash
sqlcmd -S <server>.database.windows.net -d <db> -G \
  -i deploy/sql/colors.sql -i deploy/sql/engines.sql -i deploy/sql/settings.sql
```

## Run it locally

The front-end talks to a small read-only catalog API in [`server/`](server) that
loads `colors`, `engines` and `settings` from Azure SQL. Run both.

```bash
cd talk-sre-battlebot-configurator-react

# 1) start the catalog API (http://localhost:3001)
cd server
npm install
cp .env.example .env      # then fill in DB_SERVER / DB_NAME / credentials
npm run dev

# 2) in another terminal, start the front-end dev server (http://localhost:5173)
cd ..
npm install
npm run dev
```

Then open http://localhost:5173 in your browser. The Vite dev server proxies
`/api` to the API on port 3001; for other environments set `VITE_API_BASE_URL`.

> **Auth:** leave `DB_USER` blank in `server/.env` to connect with Azure AD /
> managed identity (recommended) instead of a SQL username/password. Database
> credentials live only in the API — never in the browser bundle.

## Other commands

```bash
# type-check and build a production bundle into dist/
npm run build

# preview the production build locally
npm run preview
```

## Toggling the demo behaviour

- **Maintenance mode**: set the `maintenance_mode` row in the `dbo.settings`
  table to `true` to disable the "Complete Order" button and show the
  maintenance notice (reloaded from Azure SQL on the next page load), exactly
  like the Flask app.
- **Payment outage**: the checkout deliberately probes an unreachable host, so
  clicking **Complete Order** surfaces the payment error card with the fixed
  error code — exactly like the original demo.




## To run it

```bash
# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# .env already has your DB settings
python app.py &

# frontend (another terminal)
cd frontend
npm run dev
```

## Run with Docker

```bash
# backend — pass DB settings at runtime (.env is not baked into the image)


az acr login --name $ACR_NAME 



docker build -t $ACR_NAME/battlebot-backend:0.0.1 ./backend

# Tag the local image with the registry path
#docker tag battlebot-backend:0.0.1 $ACR_NAME.azurecr.io/battlebot-backend:0.0.1

docker push $ACR_NAME.azurecr.io/battlebot-backend:0.0.1



docker run --rm -p 3001:3001 \
  -e DB_SERVER=... -e DB_NAME=... -e DB_USER=... -e DB_PASSWORD=... \
  battlebot-backend

# frontend (nginx serves the built SPA and proxies /api to the backend)
#docker build -t battlebot-frontend ./frontend
docker build -t $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1 ./frontend

# Tag the local image with the registry path
#docker tag battlebot-frontend:0.0.1 $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1

docker push $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1





docker run --rm -p 8080:80 battlebot-frontend   # http://localhost:8080
```













## Deploy Infra

Update the .env file first and the load the file
source .env


az login
Optional: az login --use-device-code

az account set --subscription $SUBSCRIPTION

az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.Sql


#0 

install sqlcmd:
curl -sSL -O https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb

sudo apt-get update
sudo apt-get install mssql-tools18 unixodbc-dev

echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
source ~/.bashrc







contents=$(ls kubernetes.example)
for filename in $contents
do 
  cat kubernetes.example/$filename | envsubst > kubernetes/$filename
done




#1_...

#!/usr/bin/env bash
set -euo pipefail


# Create the resource group
az group create \
  --name "$AKS_RESOURCE_GROUP" \
  --location "$LOCATION"

# Create the Azure Container Registry
az acr create \
  --resource-group "$AKS_RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --location "$LOCATION" \
  --sku Basic

# Create a public AKS cluster
az aks create \
  --resource-group "$AKS_RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --location "$LOCATION" \
  --node-count 2 \
  --node-vm-size Standard_d2s_v5 \
  --network-plugin azure \
  --network-plugin-mode overlay \
  --network-dataplane cilium \
  --pod-cidr "$POD_CIDR" \
  --enable-managed-identity \
  --attach-acr "$ACR_NAME" \
  --enable-gateway-api \
  --generate-ssh-keys   # --ssh-access disabled

# Fetch credentials into your kubeconfig
az aks get-credentials \  
  --resource-group "$AKS_RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME"



#2_...






#3_ Observability


# Ensure required extensions are available non-interactively.
# az config set extension.use_dynamic_install=yes_without_prompt >/dev/null

# --- Resource group --------------------------------------------------------
az group create \
  --name "$OBS_RESOURCE_GROUP" \
  --location "$LOCATION"

# --- Log Analytics workspace ----------------------------------------------
az monitor log-analytics workspace create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --workspace-name "$OBS_LAW_NAME" \
  --location "$LOCATION" \
  --sku PerGB2018 \
  --retention-time 30

OBS_LAW_ID="$(az monitor log-analytics workspace show \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --workspace-name "$OBS_LAW_NAME" \
  --query id -o tsv)"

# --- Application Insights (workspace-based) --------------------------------
az monitor app-insights component create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --app "$OBS_APPINSIGHTS_NAME" \
  --location "$LOCATION" \
  --kind web \
  --application-type web \
  --workspace "$OBS_LAW_ID"

OBS_APPINSIGHTS_ID="$(az monitor app-insights component show \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --app "$OBS_APPINSIGHTS_NAME" \
  --query id -o tsv)"

# --- Metric alert: Error2 --------------------------------------------------
# Fires when the App Insights exceptions count is greater than 0.
az monitor metrics alert create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --name "$OBS_ALERT_PAYMENT_ERROR" \
  --scopes "$OBS_APPINSIGHTS_ID" \
  --severity 1 \
  --evaluation-frequency 1m \
  --window-size 5m \
  --condition "count exceptions/count > 0" \
  --description "Connectivity or processing error in payment system."

# --- Log alert: Database Connectivity Error --------------------------------
# Scheduled query (log) alert on a specific ODBC/SQL connectivity exception.
read -r -d '' DB_CONN_QUERY <<'KQL' || true
exceptions
| where details contains "[Microsoft][ODBC Driver 18 for SQL Server][SQL Server]Cannot open server 'talk-sre-sqlserver01' requested by the login."
KQL

az monitor scheduled-query create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --name "$OBS_LOG_ALERT_NAME" \
  --scopes "$OBS_APPINSIGHTS_ID" \
  --severity 0 \
  --evaluation-frequency 5m \
  --window-size 5m \
  --condition "count 'DbConnErrors' > 1" \
  --condition-query DbConnErrors="$DB_CONN_QUERY" \
  --description "Fires on SQL Server connectivity exceptions from the app."




#4_ Database

# Create the resource group (safe to re-run)
az group create \
  --name "$DB_RESOURCE_GROUP" \
  --location "$LOCATION"

# Create the Azure SQL logical server
az sql server create \
  --name "$DB_SERVER_NAME" \
  --resource-group "$DB_RESOURCE_GROUP" \
  --location "$LOCATION" \
  --admin-user "$DB_USER" \
  --admin-password "$DB_PASSWORD"

# Allow other Azure services (e.g. AKS) to reach the server
az sql server firewall-rule create \
  --resource-group "$DB_RESOURCE_GROUP" \
  --server "$DB_SERVER_NAME" \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# Create the database
az sql db create \
  --resource-group "$DB_RESOURCE_GROUP" \
  --server "$DB_SERVER_NAME" \
  --name "$DB_NAME" \
  --service-objective S0

echo "SQL server FQDN: ${DB_SERVER_NAME}.database.windows.net"



for f in deploy/sql/*.sql; do
  echo "Applying $f ..."
  sqlcmd -S "${DB_SERVER_NAME}.database.windows.net" \
    -d "$DB_NAME" \
    -U "$DB_USER" \
    -P "$DB_PASSWORD" \
    -Nm \
    -C \
    -i "$f"
done







#5_ SRE Agent


# Create the resource group (safe to re-run)
az group create \
  --name "$AGENT_RESOURCE_GROUP" \
  --location "$AGENT_LOCATION"


# --- Log Analytics workspace ----------------------------------------------
az monitor log-analytics workspace create \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --workspace-name "$AGENT_LAW_NAME" \
  --location "$AGENT_LOCATION" \
  --sku PerGB2018 \
  --retention-time 30

AGENT_LAW_ID="$(az monitor log-analytics workspace show \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --workspace-name "$AGENT_LAW_NAME" \
  --query id -o tsv)"

# --- Application Insights (workspace-based) --------------------------------
az monitor app-insights component create \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --app "$AGENT_APPINSIGHTS_NAME" \
  --location "$AGENT_LOCATION" \
  --kind web \
  --application-type web \
  --workspace "$AGENT_LAW_ID"

# AGENT_APPINSIGHTS_ID="$(az monitor app-insights component show \
#  --resource-group "$AGENT_RESOURCE_GROUP" \
#  --app "$AGENT_APPINSIGHTS_NAME" \
#  --query id -o tsv)"









## Azure SRE Agent Export and Deployment

./bin/export-agent.sh --set agentName=clone2 -o export_2026_08_02/ -s c202c407-5be9-48fe-b16b-31049a9ce375 -g talk-sre-battlebot-agent-rg -n clone


./bin/deploy.sh import_2026_05_25/ --what-if
./bin/deploy.sh import_2026_05_25/




# select subscription!


git clone git@github.com:tmassoth/talk-sre-battlebot-configurator.git

1.) Copy .env.example and rename to .env or use the following command
cp .env.example .env

2.) Edit the .env file and enter the SUBSCRIPTION ID in SUBSCRIPTION=xxxxx
You can use the command vim .env
3.) Run ./setup.sh

The setup.sh will run approximately 20 minutes to deploy all required resources...





if you run the following KQL in the AppInsights resource -->Logs:

exceptions 
| where outerMessage contains "PAY-MSUTY3ZE-1OFQ"

you will find at least one exception message like:

Payment provider unreachable [PAY-MSUTY3ZE-1OFQ]: HTTPSConnectionPool(host='doesnotexist.xxxxxxx', port=443): Max retries exceeded with url: / (Caused by NameResolutionError("HTTPSConnection(host='doesnotexist.xxxxxxx', port=443): Failed to resolve 'doesnotexist.xxxxxxx' ([Errno -2] Name or service not known)"))

